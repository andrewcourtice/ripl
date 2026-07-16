import type {
    ToolId,
} from '../constants';

import type {
    Editor,
} from '../editor';

import {
    pickTopShape,
    shapesInMarquee,
} from '../hit-test';

import {
    cloneShape,
} from '../model';

import type {
    Shape,
} from '../model';

import {
    getSelectionBounds,
    getSelectionHandles,
} from '../selection';

import type {
    HandleId,
} from '../selection';

import type {
    PointerInput,
    Tool,
} from './tool';

import {
    Box,
    isPointInBox,
} from '@ripl/web';

import type {
    Point,
} from '@ripl/web';

type DragMode = 'move' | 'resize' | 'marquee';

interface DragState {
    mode: DragMode;
    originScreen: Point;
    originWorld: Point;
    moved: boolean;
    live: Shape[];
    snapshots: Map<string, Shape>;
    fromBounds: Box;
    handle?: HandleId;
    additive: boolean;
}

const MOVE_THRESHOLD = 3;

/** Maps a point from one bounding box into another, guarding against zero-size source spans. */
function mapPoint(point: Point, from: Box, to: Box): Point {
    const sx = from.width === 0 ? 1 : to.width / from.width;
    const sy = from.height === 0 ? 1 : to.height / from.height;

    return [
        to.left + (point[0] - from.left) * sx,
        to.top + (point[1] - from.top) * sy,
    ];
}

/** Writes a translated copy of `snapshot`'s geometry into the live `target` shape. */
function translateShape(target: Shape, snapshot: Shape, dx: number, dy: number): void {
    if (snapshot.type === 'freehand' || snapshot.type === 'path') {
        (target as typeof snapshot).points = snapshot.points.map(([x, y]): Point => [x + dx, y + dy]);
        return;
    }

    if (snapshot.type === 'line') {
        const line = target as typeof snapshot;
        line.x1 = snapshot.x1 + dx;
        line.y1 = snapshot.y1 + dy;
        line.x2 = snapshot.x2 + dx;
        line.y2 = snapshot.y2 + dy;
        return;
    }

    if (snapshot.type === 'connector') {
        const connector = target as typeof snapshot;

        if (!snapshot.source.shapeId) {
            connector.source.point = [snapshot.source.point[0] + dx, snapshot.source.point[1] + dy];
        }

        if (!snapshot.target.shapeId) {
            connector.target.point = [snapshot.target.point[0] + dx, snapshot.target.point[1] + dy];
        }

        return;
    }

    const box = target as Extract<Shape, { x: number;
        y: number; }>;
    box.x = (snapshot as typeof box).x + dx;
    box.y = (snapshot as typeof box).y + dy;
}

/** Writes a scaled copy of `snapshot`'s geometry (mapped `from` → `to`) into the live `target` shape. */
function scaleShape(target: Shape, snapshot: Shape, from: Box, to: Box): void {
    if (snapshot.type === 'freehand' || snapshot.type === 'path') {
        (target as typeof snapshot).points = snapshot.points.map(point => mapPoint(point, from, to));
        return;
    }

    if (snapshot.type === 'line') {
        const line = target as typeof snapshot;
        const [x1, y1] = mapPoint([snapshot.x1, snapshot.y1], from, to);
        const [x2, y2] = mapPoint([snapshot.x2, snapshot.y2], from, to);
        line.x1 = x1;
        line.y1 = y1;
        line.x2 = x2;
        line.y2 = y2;
        return;
    }

    if (snapshot.type === 'connector') {
        const connector = target as typeof snapshot;

        if (!snapshot.source.shapeId) {
            connector.source.point = mapPoint(snapshot.source.point, from, to);
        }

        if (!snapshot.target.shapeId) {
            connector.target.point = mapPoint(snapshot.target.point, from, to);
        }

        return;
    }

    if (snapshot.type === 'text') {
        const text = target as typeof snapshot;
        const [x, y] = mapPoint([snapshot.x, snapshot.y], from, to);
        const scaleY = from.height === 0 ? 1 : to.height / from.height;
        text.x = x;
        text.y = y;
        text.fontSize = Math.max(1, snapshot.fontSize * Math.abs(scaleY));
        return;
    }

    const box = target as Extract<Shape, { x: number;
        y: number;
        width: number;
        height: number; }>;
    const source = snapshot as typeof box;
    const tl = mapPoint([source.x, source.y], from, to);
    const br = mapPoint([source.x + source.width, source.y + source.height], from, to);
    box.x = Math.min(tl[0], br[0]);
    box.y = Math.min(tl[1], br[1]);
    box.width = Math.abs(br[0] - tl[0]);
    box.height = Math.abs(br[1] - tl[1]);
}

/** Selection tool: click to pick, drag to move, drag handles to resize, empty-drag to marquee. */
export class SelectTool implements Tool {

    /** The tool's identifier. */
    public id: ToolId = 'select';
    /** The cursor shown while the tool is active. */
    public cursor = 'default';

    #editor: Editor;
    #drag: DragState | null = null;

    constructor(editor: Editor) {
        this.#editor = editor;
    }

    /** Begins a resize, move or marquee gesture depending on where the pointer landed. */
    public onPointerDown(world: Point, input: PointerInput): void {
        const handle = this.#handleAt(input.screen);

        if (handle) {
            this.#startResize(world, input, handle);
            return;
        }

        const hit = pickTopShape(this.#editor.document, world);

        if (hit) {
            this.#startMove(world, input, hit);
            return;
        }

        if (!input.shiftKey) {
            this.#editor.clearSelection();
        }

        this.#drag = {
            mode: 'marquee',
            originScreen: input.screen,
            originWorld: world,
            moved: false,
            live: [],
            snapshots: new Map(),
            fromBounds: Box.empty(),
            additive: input.shiftKey,
        };
    }

    /** Updates the active gesture as the pointer moves. */
    public onPointerMove(world: Point, input: PointerInput): void {
        const drag = this.#drag;

        if (!drag) {
            return;
        }

        if (!drag.moved) {
            const dsx = input.screen[0] - drag.originScreen[0];
            const dsy = input.screen[1] - drag.originScreen[1];

            if (Math.hypot(dsx, dsy) < MOVE_THRESHOLD) {
                return;
            }

            drag.moved = true;
        }

        if (drag.mode === 'move') {
            const dx = world[0] - drag.originWorld[0];
            const dy = world[1] - drag.originWorld[1];
            drag.live.forEach(shape => translateShape(shape, drag.snapshots.get(shape.id)!, dx, dy));
            this.#editor.updateLive(drag.live);
            return;
        }

        if (drag.mode === 'resize') {
            const to = this.#resizeBounds(drag.fromBounds, drag.handle!, world);
            drag.live.forEach(shape => scaleShape(shape, drag.snapshots.get(shape.id)!, drag.fromBounds, to));
            this.#editor.updateLive(drag.live);
            return;
        }

        const box = this.#marqueeBox(drag.originWorld, world);
        this.#editor.setMarquee(box);
        this.#editor.select(shapesInMarquee(this.#editor.document, box).map(shape => shape.id), drag.additive);
    }

    /** Commits a move/resize (when something actually moved) or finalises the marquee selection. */
    public onPointerUp(): void {
        const drag = this.#drag;
        this.#drag = null;

        if (!drag) {
            return;
        }

        if (drag.mode === 'marquee') {
            this.#editor.setMarquee(null);
            return;
        }

        if (drag.moved) {
            this.#editor.commit();
        }
    }

    /** Aborts any in-progress gesture when the tool is switched away. */
    public onDeactivate(): void {
        if (this.#drag?.mode === 'marquee') {
            this.#editor.setMarquee(null);
        }

        this.#drag = null;
    }

    #handleAt(screen: Point): HandleId | undefined {
        return getSelectionHandles(this.#editor).find(handle => isPointInBox(screen, handle.box))?.id;
    }

    #startResize(world: Point, input: PointerInput, handle: HandleId): void {
        const fromBounds = getSelectionBounds(this.#editor);

        if (!fromBounds) {
            return;
        }

        const live = this.#editor.getSelectedShapes();

        this.#drag = {
            mode: 'resize',
            originScreen: input.screen,
            originWorld: world,
            moved: false,
            live,
            snapshots: new Map(live.map(shape => [shape.id, cloneShape(shape)])),
            fromBounds,
            handle,
            additive: false,
        };
    }

    #startMove(world: Point, input: PointerInput, hit: Shape): void {
        if (input.shiftKey) {
            const ids = new Set(this.#editor.selection);

            if (ids.has(hit.id)) {
                ids.delete(hit.id);
            } else {
                ids.add(hit.id);
            }

            this.#editor.select([...ids]);
        } else if (!this.#editor.selection.has(hit.id)) {
            this.#editor.select([hit.id]);
        }

        const live = this.#editor.getSelectedShapes();

        this.#drag = {
            mode: 'move',
            originScreen: input.screen,
            originWorld: world,
            moved: false,
            live,
            snapshots: new Map(live.map(shape => [shape.id, cloneShape(shape)])),
            fromBounds: Box.empty(),
            additive: false,
        };
    }

    #resizeBounds(from: Box, handle: HandleId, world: Point): Box {
        let { top, left, bottom, right } = from;

        if (handle.includes('n')) {
            top = world[1];
        }

        if (handle.includes('s')) {
            bottom = world[1];
        }

        if (handle.includes('w')) {
            left = world[0];
        }

        if (handle.includes('e')) {
            right = world[0];
        }

        return new Box(Math.min(top, bottom), Math.min(left, right), Math.max(top, bottom), Math.max(left, right));
    }

    #marqueeBox(a: Point, b: Point): Box {
        return new Box(Math.min(a[1], b[1]), Math.min(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[0], b[0]));
    }

}
