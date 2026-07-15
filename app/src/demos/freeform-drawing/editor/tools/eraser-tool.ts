import type {
    ToolId,
} from '../constants';

import type {
    Editor,
} from '../editor';

import {
    pickTopShape,
} from '../hit-test';

import type {
    Tool,
} from './tool';

import type {
    Point,
} from '@ripl/web';

const ERASED_OPACITY = 0.15;

/** Tool that deletes shapes dragged over; hovered shapes dim, then are removed in one undo step. */
export class EraserTool implements Tool {

    /** The tool's identifier. */
    public id: ToolId = 'eraser';
    /** The cursor shown while the tool is active. */
    public cursor = 'crosshair';

    #editor: Editor;
    #erasing = false;
    #marked = new Set<string>();

    constructor(editor: Editor) {
        this.#editor = editor;
    }

    /** Begins an erase gesture. */
    public onPointerDown(world: Point): void {
        this.#erasing = true;
        this.#marked.clear();
        this.#eraseAt(world);
    }

    /** Marks shapes under the pointer for deletion, dimming them for feedback. */
    public onPointerMove(world: Point): void {
        if (this.#erasing) {
            this.#eraseAt(world);
        }
    }

    /** Deletes all marked shapes in a single commit. */
    public onPointerUp(): void {
        this.#erasing = false;

        if (this.#marked.size) {
            this.#editor.deleteShapes([...this.#marked]);
        }

        this.#marked.clear();
    }

    /** Restores any dimmed-but-unerased shapes if the tool is switched mid-gesture. */
    public onDeactivate(): void {
        this.#erasing = false;

        if (!this.#marked.size) {
            return;
        }

        const shapes = [...this.#marked]
            .map(id => this.#editor.getShape(id))
            .filter((shape): shape is NonNullable<typeof shape> => Boolean(shape));

        shapes.forEach(shape => {
            shape.opacity = this.#editor.style.opacity;
        });

        this.#editor.updateLive(shapes);
        this.#marked.clear();
    }

    #eraseAt(world: Point): void {
        const shape = pickTopShape(this.#editor.document, world);

        if (!shape || this.#marked.has(shape.id)) {
            return;
        }

        this.#marked.add(shape.id);
        shape.opacity = ERASED_OPACITY;
        this.#editor.updateLive([shape]);
    }

}
