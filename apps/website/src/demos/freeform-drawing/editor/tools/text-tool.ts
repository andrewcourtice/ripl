import type {
    ToolId,
} from '../constants';

import type {
    Editor,
} from '../editor';

import {
    pickTopShape,
} from '../hit-test';

import {
    createShapeId,
} from '../model';

import type {
    TextShape,
} from '../model';

import type {
    PointerInput,
    Tool,
} from './tool';

import type {
    Point,
} from '@ripl/web';

const BASE_FONT_SIZE = 26;

/** Tool that places or edits a single line of text via a floating input overlaid on the canvas. */
export class TextTool implements Tool {

    /** The tool's identifier. */
    public id: ToolId = 'text';
    /** The cursor shown while the tool is active. */
    public cursor = 'text';

    #editor: Editor;
    #input: HTMLInputElement | null = null;
    #editing: TextShape | null = null;
    #isNew = false;

    constructor(editor: Editor) {
        this.#editor = editor;
    }

    /** Opens an editor for the text under the pointer, or creates a new text shape there. */
    public onPointerDown(world: Point, input: PointerInput): void {
        if (this.#input) {
            this.#commit();
            return;
        }

        const existing = pickTopShape(this.#editor.document, world);

        if (existing && existing.type === 'text') {
            this.#isNew = false;
            this.#editing = existing;
            this.#openInput(input.screen, existing.content);
            return;
        }

        const style = this.#editor.style;

        this.#isNew = true;
        this.#editing = {
            id: createShapeId(),
            type: 'text',
            x: world[0],
            y: world[1],
            content: '',
            fontSize: BASE_FONT_SIZE / this.#editor.zoom,
            stroke: style.stroke,
            fill: style.stroke,
            strokeWidth: style.strokeWidth,
            opacity: style.opacity,
            dash: false,
            zIndex: 0,
        };

        this.#openInput(input.screen, '');
    }

    /** Closes any open editor when the tool is switched away. */
    public onDeactivate(): void {
        this.#commit();
    }

    #openInput(screen: Point, value: string): void {
        const input = document.createElement('input');

        input.type = 'text';
        input.value = value;
        input.className = 'freeform-text-input';
        input.style.position = 'absolute';
        input.style.left = `${screen[0]}px`;
        input.style.top = `${screen[1]}px`;
        input.style.font = `600 ${BASE_FONT_SIZE}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

        input.addEventListener('keydown', event => {
            event.stopPropagation();

            if (event.key === 'Enter') {
                this.#commit();
            }

            if (event.key === 'Escape') {
                this.#cancel();
            }
        });

        input.addEventListener('blur', () => this.#commit());

        this.#editor.host.appendChild(input);
        this.#input = input;

        requestAnimationFrame(() => input.focus());
    }

    #commit(): void {
        const input = this.#input;
        const editing = this.#editing;

        if (!input || !editing) {
            return;
        }

        const value = input.value.trim();

        this.#teardownInput();

        if (!value) {
            if (!this.#isNew) {
                this.#editor.deleteShapes([editing.id]);
            }

            this.#editing = null;
            return;
        }

        editing.content = value;

        if (this.#isNew) {
            this.#editor.addShape(editing, true);
        } else {
            this.#editor.commit();
            this.#editor.select([editing.id]);
        }

        this.#editing = null;
    }

    #cancel(): void {
        this.#teardownInput();
        this.#editing = null;
    }

    #teardownInput(): void {
        if (!this.#input) {
            return;
        }

        const input = this.#input;
        this.#input = null;
        input.remove();
    }

}
