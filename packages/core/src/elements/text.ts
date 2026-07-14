import {
    Element,
} from '../core';

import type {
    BaseElementState,
    ElementOptions,
} from '../core';

import {
    measureText,
} from '../context';

import type {
    Context,
} from '../context';

import {
    Box,
} from '../math';

/** State interface for a text element, defining position, content, and optional path-based text layout. */
export interface TextState extends BaseElementState {
    /** The x-coordinate of the text's anchor point. */
    x: number;
    /** The y-coordinate of the text's anchor point. */
    y: number;
    /** The string or numeric content rendered by the element. */
    content: string | number;
    /** The SVG path data along which the text is laid out, if set. */
    pathData?: string;
    /** The offset along the path at which the text begins. */
    startOffset?: number;
}

/** A text element that renders string or numeric content, with optional path-based text layout. */
export class Text extends Element<TextState> {

    /** The x-coordinate of the text's anchor point. */
    public get x() {
        return this.getStateValue('x');
    }

    public set x(value) {
        this.setStateValue('x', value);
    }

    /** The y-coordinate of the text's anchor point. */
    public get y() {
        return this.getStateValue('y');
    }

    public set y(value) {
        this.setStateValue('y', value);
    }

    /** The string or numeric content rendered by the element. */
    public get content() {
        return this.getStateValue('content');
    }

    public set content(value) {
        this.setStateValue('content', value);
    }

    /** The SVG path data along which the text is laid out, if set. */
    public get pathData() {
        return this.getStateValue('pathData');
    }

    public set pathData(value) {
        this.setStateValue('pathData', value);
    }

    /** The offset along the path at which the text begins. */
    public get startOffset() {
        return this.getStateValue('startOffset');
    }

    public set startOffset(value) {
        this.setStateValue('startOffset', value);
    }

    constructor(options: ElementOptions<TextState>) {
        super('text', options);
    }

    /** Returns the axis-aligned bounding box of the text, measured with its current alignment. */
    public getBoundingBox(): Box {
        const text = this.content.toString();

        // Measure with the element's alignment so the anchor-relative `actualBoundingBox*` metrics
        // position the box correctly for any `textAlign`/`textBaseline` (not just start/alphabetic).
        const {
            actualBoundingBoxAscent,
            actualBoundingBoxLeft,
            actualBoundingBoxDescent,
            actualBoundingBoxRight,
        } = measureText(text, {
            font: this.font,
            textAlign: this.textAlign,
            textBaseline: this.textBaseline,
        });

        return new Box(
            this.y - actualBoundingBoxAscent,
            this.x - actualBoundingBoxLeft,
            this.y + actualBoundingBoxDescent,
            this.x + actualBoundingBoxRight
        );
    }

    /** Renders the text to the provided {@link Context}. */
    public render(context: Context) {
        return super.render(context, () => {
            const text = context.createText({
                id: this.id,
                x: this.x,
                y: this.y,
                content: this.content.toString(),
                pathData: this.pathData,
                startOffset: this.startOffset,
            });

            if (this.stroke) {
                return context.applyStroke(text);
            }

            if (this.fill) {
                return context.applyFill(text);
            }
        });
    }

}

/** Factory function that creates a new `Text` instance. */
export function createText(...options: ConstructorParameters<typeof Text>) {
    return new Text(...options);
}

/** Type guard that checks whether a value is a `Text` instance. */
export function elementIsText(value: unknown): value is Text {
    return value instanceof Text;
}