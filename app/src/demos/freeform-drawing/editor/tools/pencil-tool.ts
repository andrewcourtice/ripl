import {
    FREEHAND_MIN_DISTANCE,
    HIGHLIGHTER_WIDTH_SCALE,
} from '../constants';

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
    FreehandShape,
} from '../model';

import type {
    Tool,
} from './tool';

import {
    getEuclideanDistance,
} from '@ripl/web';

import type {
    Point,
} from '@ripl/web';

/** Freehand tool that captures smoothed pointer strokes as {@link FreehandShape} records. */
export class PencilTool implements Tool {

    /** The tool's identifier. */
    public id: ToolId = 'pencil';
    /** The cursor shown while the tool is active. */
    public cursor = 'crosshair';
    /** Whether strokes are drawn as translucent highlighter ink. */
    protected highlighter = false;

    protected editor: Editor;

    #draft: FreehandShape | null = null;

    constructor(editor: Editor) {
        this.editor = editor;
    }

    /** Begins a new stroke at the pressed point. */
    public onPointerDown(world: Point): void {
        const style = this.editor.style;

        this.#draft = {
            id: createShapeId(),
            type: 'freehand',
            points: [[world[0], world[1]]],
            highlighter: this.highlighter,
            stroke: style.stroke,
            fill: null,
            strokeWidth: this.highlighter ? style.strokeWidth * HIGHLIGHTER_WIDTH_SCALE : style.strokeWidth,
            opacity: style.opacity,
            dash: false,
            zIndex: 0,
        };

        this.editor.beginDraft(this.#draft);
    }

    /** Appends a sample point when the pointer has moved far enough (in world units). */
    public onPointerMove(world: Point): void {
        if (!this.#draft) {
            return;
        }

        const points = this.#draft.points;
        const last = points[points.length - 1];
        const minDistance = FREEHAND_MIN_DISTANCE / this.editor.zoom;

        if (getEuclideanDistance(world[0] - last[0], world[1] - last[1]) < minDistance) {
            return;
        }

        points.push([world[0], world[1]]);
        this.editor.updateLive([this.#draft]);
    }

    /** Finalises the stroke. */
    public onPointerUp(): void {
        this.#finish();
    }

    /** Aborts (commits) any in-progress stroke when the tool is switched away. */
    public onDeactivate(): void {
        this.#finish();
    }

    #finish(): void {
        if (!this.#draft) {
            return;
        }

        if (this.#draft.points.length === 1) {
            const [x, y] = this.#draft.points[0];
            this.#draft.points.push([x + 0.01, y]);
        }

        this.#draft = null;
        this.editor.commit();
    }

}
