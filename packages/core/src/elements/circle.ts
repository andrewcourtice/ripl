import type {
    Context,
} from '../context';

import {
    Shape2D,
} from '../core';

import type {
    BaseElementState,
    Shape2DOptions,
} from '../core';

import {
    Box,
} from '../math';

/** State interface for a circle element, defining center coordinates and radius. */
export interface CircleState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
}

/** A circle shape rendered at a center point with a given radius. */
export class Circle extends Shape2D<CircleState> {

    public get cx() {
        return this.getStateValue('cx');
    }

    public set cx(value) {
        this.setStateValue('cx', value);
    }

    public get cy() {
        return this.getStateValue('cy');
    }

    public set cy(value) {
        this.setStateValue('cy', value);
    }

    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    constructor(options: Shape2DOptions<CircleState>) {
        super('circle', options);
    }

    public getBoundingBox(): Box {
        return new Box(
            this.cy - this.radius,
            this.cx - this.radius,
            this.cy + this.radius,
            this.cx + this.radius
        );
    }

    public render(context: Context) {
        return super.render(context, path => {
            path.circle(this.cx, this.cy, Math.max(0, this.radius));
        });
    }

}

/** Factory function that creates a new `Circle` instance. */
export function createCircle(...options: ConstructorParameters<typeof Circle>) {
    return new Circle(...options);
}

/** Type guard that checks whether a value is a `Circle` instance. */
export function elementIsCircle(value: unknown): value is Circle {
    return value instanceof Circle;
}
