import {
    type Context,
    measureText,
} from '../context';

import {
    BaseElementState,
    Element,
    ElementOptions,
} from '../core';

import {
    Box,
} from '../math';

export interface TextState extends BaseElementState {
    x: number;
    y: number;
    content: string | number;
}

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

    constructor(options: ElementOptions<TextState>) {
        super('text', options);
    }

    public getBoundingBox() {
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
            });

            if (this.strokeStyle) {
                return context.stroke(text);
            }

            if (this.fillStyle) {
                return context.fill(text);
            }
        });
    }

}

export function createText(...options: ConstructorParameters<typeof Text>) {
    return new Text(...options);
}

export function elementIsText(value: unknown): value is Text {
    return value instanceof Text;
}