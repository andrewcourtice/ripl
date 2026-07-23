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
    PathShape,
} from '../model';

import type {
    Tool,
} from './tool';

import type {
    Point,
} from '@ripl/web';

const CLOSE_DISTANCE = 12;

/** Vector pen tool: each click places an anchor; the path closes when clicking near its start. */
export class PenTool implements Tool {

    /** The tool's identifier. */
    public id: ToolId = 'pen';
    /** The cursor shown while the tool is active. */
    public cursor = 'crosshair';

    #editor: Editor;
    #draft: PathShape | null = null;

    constructor(editor: Editor) {
        this.#editor = editor;
    }

    /** Places an anchor, starting a new path or extending the current one; closes near the start. */
    public onPointerDown(world: Point): void {
        if (!this.#draft) {
            const style = this.#editor.style;

            this.#draft = {
                id: createShapeId(),
                type: 'path',
                points: [[world[0], world[1]], [world[0], world[1]]],
                closed: false,
                stroke: style.stroke,
                fill: style.fill,
                strokeWidth: style.strokeWidth,
                opacity: style.opacity,
                dash: style.dash,
                zIndex: 0,
            };

            this.#editor.beginDraft(this.#draft);
            return;
        }

        const anchors = this.#draft.points.slice(0, -1);

        if (anchors.length >= 2 && this.#nearStart(world)) {
            this.#draft.closed = true;
            this.#draft.points = anchors;
            this.#finish();
            return;
        }

        this.#draft.points = [...anchors, [world[0], world[1]], [world[0], world[1]]];
        this.#editor.updateLive([this.#draft]);
    }

    /** Moves the trailing anchor with the pointer to preview the next segment. */
    public onPointerMove(world: Point): void {
        if (!this.#draft) {
            return;
        }

        this.#draft.points = [...this.#draft.points.slice(0, -1), [world[0], world[1]]];
        this.#editor.updateLive([this.#draft]);
    }

    /** Finishes the path. */
    public onDoubleClick(): void {
        this.#finishOpen();
    }

    /** Handles Enter (finish) and Escape (cancel). */
    public onKeyDown(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.#finishOpen();
        }

        if (event.key === 'Escape' && this.#draft) {
            this.#editor.discardDraft(this.#draft.id);
            this.#draft = null;
        }
    }

    /** Discards any in-progress path when the tool is switched away. */
    public onDeactivate(): void {
        if (this.#draft) {
            this.#editor.discardDraft(this.#draft.id);
            this.#draft = null;
        }
    }

    #nearStart(world: Point): boolean {
        if (!this.#draft) {
            return false;
        }

        const [sx, sy] = this.#draft.points[0];
        return Math.hypot(world[0] - sx, world[1] - sy) * this.#editor.zoom < CLOSE_DISTANCE;
    }

    #finishOpen(): void {
        if (this.#draft) {
            // Drop the trailing preview anchor before committing.
            this.#draft.points = this.#draft.points.slice(0, -1);
            this.#finish();
        }
    }

    #finish(): void {
        if (!this.#draft) {
            return;
        }

        const draft = this.#draft;
        this.#draft = null;

        if (draft.points.length < 2) {
            this.#editor.discardDraft(draft.id);
            return;
        }

        this.#editor.commit();
        this.#editor.select([draft.id]);
    }

}
