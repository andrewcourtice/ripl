import type {
    ToolId,
} from '../constants';

import type {
    Editor,
} from '../editor';

import {
    PencilTool,
} from './pencil-tool';

/** Freehand tool that draws thick, translucent highlighter strokes with a multiply blend. */
export class HighlighterTool extends PencilTool {

    /** The tool's identifier. */
    public id: ToolId = 'highlighter';

    constructor(editor: Editor) {
        super(editor);
        this.highlighter = true;
    }

}
