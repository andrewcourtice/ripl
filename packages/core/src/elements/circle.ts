import type {
    Context,
} from '../context';

import {
    BaseElementState,
    Shape,
    ShapeOptions,
} from '../core';

import {
    Box,
    TAU,
} from '../math';

export interface CircleState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
}

export class Circle extends Shape<CircleState> {

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

    constructor(options: ShapeOptions<CircleState>) {
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
            path.circle(this.cx, this.cy, this.radius);
        });
    }

}

export function createCircle(...options: ConstructorParameters<typeof Circle>) {
    return new Circle(...options);
}

export function elementIsCircle(value: unknown): value is Circle {
    return value instanceof Circle;
}