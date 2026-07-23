import type {
    ToolId,
} from '../constants';

import type {
    Editor,
} from '../editor';

import {
    createShapeId,
} from '../model';

import type {
    EllipseShape,
    LineShape,
    RectShape,
    Shape,
} from '../model';

import type {
    PointerInput,
    Tool,
} from './tool';

import type {
    Point,
} from '@ripl/web';

/** The parametric shape kinds the {@link ShapeTool} can draw. */
export type ShapeVariant = 'rect' | 'ellipse' | 'line';

/** Drag-to-size tool for rectangles, ellipses and straight lines, with shift-constrained proportions. */
export class ShapeTool implements Tool {

    /** The tool's identifier (matches its variant). */
    public id: ToolId;
    /** The cursor shown while the tool is active. */
    public cursor = 'crosshair';

    #editor: Editor;
    #variant: ShapeVariant;
    #draft: Shape | null = null;
    #start: Point = [0, 0];

    constructor(editor: Editor, variant: ShapeVariant) {
        this.#editor = editor;
        this.#variant = variant;
        this.id = variant;
    }

    /** Creates a zero-size draft anchored at the pressed point. */
    public onPointerDown(world: Point): void {
        this.#start = [world[0], world[1]];

        const style = this.#editor.style;
        const base = {
            id: createShapeId(),
            stroke: style.stroke,
            fill: style.fill,
            strokeWidth: style.strokeWidth,
            opacity: style.opacity,
            dash: style.dash,
            zIndex: 0,
        };

        if (this.#variant === 'line') {
            this.#draft = {
                ...base,
                type: 'line',
                x1: world[0],
                y1: world[1],
                x2: world[0],
                y2: world[1],
            } satisfies LineShape;
        } else if (this.#variant === 'ellipse') {
            this.#draft = {
                ...base,
                type: 'ellipse',
                x: world[0],
                y: world[1],
                width: 0,
                height: 0,
            } satisfies EllipseShape;
        } else {
            this.#draft = {
                ...base,
                type: 'rect',
                x: world[0],
                y: world[1],
                width: 0,
                height: 0,
                radius: this.#editor.cornerRadius,
            } satisfies RectShape;
        }

        this.#editor.beginDraft(this.#draft);
    }

    /** Resizes the draft toward the pointer, honoring shift for squares/circles and 45° lines. */
    public onPointerMove(world: Point, input: PointerInput): void {
        if (!this.#draft) {
            return;
        }

        if (this.#draft.type === 'line') {
            const end = input.shiftKey ? this.#snapAngle(this.#start, world) : world;
            this.#draft.x2 = end[0];
            this.#draft.y2 = end[1];
            this.#editor.updateLive([this.#draft]);
            return;
        }

        let dx = world[0] - this.#start[0];
        let dy = world[1] - this.#start[1];

        if (input.shiftKey) {
            const size = Math.max(Math.abs(dx), Math.abs(dy));
            dx = Math.sign(dx || 1) * size;
            dy = Math.sign(dy || 1) * size;
        }

        const box = this.#draft as RectShape | EllipseShape;
        box.x = Math.min(this.#start[0], this.#start[0] + dx);
        box.y = Math.min(this.#start[1], this.#start[1] + dy);
        box.width = Math.abs(dx);
        box.height = Math.abs(dy);

        this.#editor.updateLive([this.#draft]);
    }

    /** Commits a non-degenerate shape (selecting it) or discards a zero-size draft. */
    public onPointerUp(): void {
        this.#finish();
    }

    /** Discards any in-progress draft when the tool is switched away. */
    public onDeactivate(): void {
        if (this.#draft) {
            this.#editor.discardDraft(this.#draft.id);
            this.#draft = null;
        }
    }

    #snapAngle(start: Point, end: Point): Point {
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const length = Math.hypot(dx, dy);
        const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);

        return [start[0] + Math.cos(angle) * length, start[1] + Math.sin(angle) * length];
    }

    #finish(): void {
        if (!this.#draft) {
            return;
        }

        const draft = this.#draft;
        this.#draft = null;

        const degenerate = draft.type === 'line'
            ? draft.x1 === draft.x2 && draft.y1 === draft.y2
            : (draft as RectShape).width < 1 && (draft as RectShape).height < 1;

        if (degenerate) {
            this.#editor.discardDraft(draft.id);
            return;
        }

        this.#editor.commit();
        this.#editor.select([draft.id]);
    }

}
