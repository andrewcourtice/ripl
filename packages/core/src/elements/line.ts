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
    max,
    min,
} from '../math';

/** State interface for a line element, defining start and end coordinates. */
export interface LineState extends BaseElementState {
    /** The x-coordinate of the line's start point. */
    x1: number;
    /** The y-coordinate of the line's start point. */
    y1: number;
    /** The x-coordinate of the line's end point. */
    x2: number;
    /** The y-coordinate of the line's end point. */
    y2: number;
}

/** A straight line segment between two points. */
export class Line extends Shape2D<LineState> {

    /** The x-coordinate of the line's start point. */
    public get x1() {
        return this.getStateValue('x1');
    }

    public set x1(value) {
        this.setStateValue('x1', value);
    }

    /** The y-coordinate of the line's start point. */
    public get y1() {
        return this.getStateValue('y1');
    }

    public set y1(value) {
        this.setStateValue('y1', value);
    }

    /** The x-coordinate of the line's end point. */
    public get x2() {
        return this.getStateValue('x2');
    }

    public set x2(value) {
        this.setStateValue('x2', value);
    }

    /** The y-coordinate of the line's end point. */
    public get y2() {
        return this.getStateValue('y2');
    }

    public set y2(value) {
        this.setStateValue('y2', value);
    }

    constructor(options: Shape2DOptions<LineState>) {
        super('line', options);
    }

    /** Returns the axis-aligned bounding box of the line. */
    public getLocalBoundingBox(): Box {
        return new Box(
            min(this.y1, this.y2),
            min(this.x1, this.x2),
            max(this.y1, this.y2),
            max(this.x1, this.x2)
        );
    }

    /** Renders the line to the provided {@link Context}. */
    public render(context: Context) {
        return super.render(context, path => {
            path.moveTo(this.x1, this.y1);
            path.lineTo(this.x2, this.y2);
        });
    }

}

/** Factory function that creates a new `Line` instance. */
export function createLine(...options: ConstructorParameters<typeof Line>) {
    return new Line(...options);
}

/** Type guard that checks whether a value is a `Line` instance. */
export function elementIsLine(value: unknown): value is Line {
    return value instanceof Line;
}