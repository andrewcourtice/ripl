import type {
    Context,
} from '../context';

import {
    BaseElementState,
    Shape,
    ShapeOptions,
} from '../core';

import {
    BorderRadius,
    Box,
    normaliseBorderRadius,
} from '../math';

export interface RectState extends BaseElementState {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number | BorderRadius;
}

export class Rect extends Shape<RectState> {

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

    public get width() {
        return this.getStateValue('width');
    }

    public set width(value) {
        this.setStateValue('width', value);
    }

    public get height() {
        return this.getStateValue('height');
    }

    public set height(value) {
        this.setStateValue('height', value);
    }

    public get borderRadius() {
        return this.getStateValue('borderRadius');
    }

    public set borderRadius(value) {
        this.setStateValue('borderRadius', value);
    }

    constructor(options: ShapeOptions<RectState>) {
        super('rect', options);
    }

    public getBoundingBox(): Box {
        return new Box(
            this.y,
            this.x,
            this.y + this.height,
            this.x + this.width
        );
    }

    public render(context: Context) {
        return super.render(context, path => {
            const {
                x,
                y,
                width,
                height,
                borderRadius,
            } = this;

            if (!borderRadius) {
                return path.rect(x, y, width, height);
            }

            const borders = normaliseBorderRadius(borderRadius);

            if (path.roundRect) {
                return path.roundRect(x, y, width, height, borders);
            }

            const [
                borderTopLeft,
                borderTopRight,
                borderBottomRight,
                borderBottomLeft,
            ] = borders;

            path.moveTo(x + borderTopLeft, y);
            path.lineTo(x + width - borderTopRight, y);
            path.arcTo(x + width, y, x + width, y + borderTopRight, borderTopRight);
            path.lineTo(x + width, y + height - borderBottomRight);
            path.arcTo(x + width, y + height, x + width - borderBottomRight, y + height, borderBottomRight);
            path.lineTo(x + borderBottomLeft, y + height);
            path.arcTo(x, y + height, x, y + height - borderBottomLeft, borderBottomLeft);
            path.lineTo(x, y + borderTopLeft);
            path.arcTo(x, y, x + borderTopLeft, y, borderTopLeft);
            path.closePath();
        });
    }

}

export function createRect(...options: ConstructorParameters<typeof Rect>) {
    return new Rect(...options);
}

export function elementIsRect(value: unknown): value is Rect {
    return value instanceof Rect;
}