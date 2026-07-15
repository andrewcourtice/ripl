import type {
    ToolId,
} from '../constants';

import type {
    Editor,
} from '../editor';

import type {
    PointerInput,
    Tool,
} from './tool';

import type {
    Point,
} from '@ripl/web';

/** Tool that pans the view by dragging (the explicit counterpart to space-hold/middle-drag panning). */
export class HandTool implements Tool {

    /** The tool's identifier. */
    public id: ToolId = 'hand';
    /** The cursor shown while the tool is active. */
    public cursor = 'grab';

    #editor: Editor;
    #last: Point | null = null;

    constructor(editor: Editor) {
        this.#editor = editor;
    }

    /** Records the drag origin. */
    public onPointerDown(_world: Point, input: PointerInput): void {
        this.#last = input.screen;
        this.#editor.host.style.cursor = 'grabbing';
    }

    /** Pans the view by the screen-space delta since the last move. */
    public onPointerMove(_world: Point, input: PointerInput): void {
        if (!this.#last) {
            return;
        }

        this.#editor.panBy(input.screen[0] - this.#last[0], input.screen[1] - this.#last[1]);
        this.#last = input.screen;
    }

    /** Ends the pan gesture. */
    public onPointerUp(): void {
        this.#last = null;
        this.#editor.host.style.cursor = this.cursor;
    }

    /** Ensures the cursor resets if the tool is switched mid-drag. */
    public onDeactivate(): void {
        this.#last = null;
    }

}
