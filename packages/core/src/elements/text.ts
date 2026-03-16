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
    x: number;
    y: number;
    content: string | number;
    pathData?: string;
    startOffset?: number;
}

/** A text element that renders string or numeric content, with optional path-based text layout. */
export class Text extends Element<TextState> {

    public get x() {
        return this.getStateValue('x');
    }

    public set x(value) {
        this.setStateValue('x', value);
    }

    public get y() {
        return this.getStateValue('y');
    }

    public set y(value) {
        this.setStateValue('y', value);
    }

    public get content() {
        return this.getStateValue('content');
    }

    public set content(value) {
        this.setStateValue('content', value);
    }

    public get pathData() {
        return this.getStateValue('pathData');
    }

    public set pathData(value) {
        this.setStateValue('pathData', value);
    }

    public get startOffset() {
        return this.getStateValue('startOffset');
    }

    public set startOffset(value) {
        this.setStateValue('startOffset', value);
    }

    constructor(options: ElementOptions<TextState>) {
        super('text', options);
    }

    public getBoundingBox(): Box {
        const text = this.content.toString();

        const {
            actualBoundingBoxAscent,
            actualBoundingBoxLeft,
            actualBoundingBoxDescent,
            actualBoundingBoxRight,
        } = this.context
            ? this.context.measureText(text, this.font)
            : measureText(text, {
                font: this.font,
            });

        return new Box(
            this.y - actualBoundingBoxAscent,
            this.x - actualBoundingBoxLeft,
            this.y + actualBoundingBoxDescent,
            this.x + actualBoundingBoxRight
        );
    }

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