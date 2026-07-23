import {
    Shape2D,
} from '../core';

import type {
    BaseElementState,
    Shape2DOptions,
} from '../core';

import type {
    Context,
} from '../context';

import {
    Box,
    normalizeBorderRadius,
} from '../math';

import type {
    BorderRadius,
} from '../math';

/** State interface for a rectangle element, defining position, dimensions, and optional border radius. */
export interface RectState extends BaseElementState {
    /** The x-coordinate of the rectangle's top-left corner. */
    x: number;
    /** The y-coordinate of the rectangle's top-left corner. */
    y: number;
    /** The width of the rectangle. */
    width: number;
    /** The height of the rectangle. */
    height: number;
    /** The corner radius of the rectangle, uniform or per-corner. */
    borderRadius?: number | BorderRadius;
}

/** A rectangle shape with optional rounded corners via border radius. */
export class Rect extends Shape2D<RectState> {

    /** The x-coordinate of the rectangle's top-left corner. */
    public get x() {
        return this.getStateValue('x');
    }

    public set x(value) {
        this.setStateValue('x', value);
    }

    /** The y-coordinate of the rectangle's top-left corner. */
    public get y() {
        return this.getStateValue('y');
    }

    public set y(value) {
        this.setStateValue('y', value);
    }

    /** The width of the rectangle. */
    public get width() {
        return this.getStateValue('width');
    }

    public set width(value) {
        this.setStateValue('width', value);
    }

    /** The height of the rectangle. */
    public get height() {
        return this.getStateValue('height');
    }

    public set height(value) {
        this.setStateValue('height', value);
    }

    /** The corner radius of the rectangle, uniform or per-corner. */
    public get borderRadius() {
        return this.getStateValue('borderRadius');
    }

    public set borderRadius(value) {
        this.setStateValue('borderRadius', value);
    }

    constructor(options: Shape2DOptions<RectState>) {
        super('rect', options);
    }

    /** @internal Local-space bounding box of the rectangle. */
    public _getLocalBoundingBox(): Box {
        return new Box(
            this.y,
            this.x,
            this.y + this.height,
            this.x + this.width
        );
    }

    /** Renders the rectangle to the provided {@link Context}. */
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

            const borders = normalizeBorderRadius(borderRadius);

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

/** Factory function that creates a new `Rect` instance. */
export function createRect(...options: ConstructorParameters<typeof Rect>) {
    return new Rect(...options);
}

/** Type guard that checks whether a value is a `Rect` instance. */
export function elementIsRect(value: unknown): value is Rect {
    return value instanceof Rect;
}