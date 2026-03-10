import type {
    Context,
} from '../context';

import {
    BaseElementState,
    Shape2D,
    Shape2DOptions,
} from '../core';

import {
    Box,
    getPolygonPoints,
    max,
} from '../math';

/** State interface for a regular polygon element, defining center, radius, and number of sides. */
export interface PolygonState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
    sides: number;
}

/** A regular polygon shape with a configurable number of sides. */
export class Polygon extends Shape2D<PolygonState> {

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

    public get sides() {
        return this.getStateValue('sides');
    }

    public set sides(value) {
        this.setStateValue('sides', max(value, 3));
    }

    constructor(options: Shape2DOptions<PolygonState>) {
        super('polygon', options);
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
            const points = getPolygonPoints(
                this.sides,
                this.cx,
                this.cy,
                this.radius
            );

            path.polyline(points);
            path.closePath();
        });
    }

}

/** Factory function that creates a new `Polygon` instance. */
export function createPolygon(...options: ConstructorParameters<typeof Polygon>) {
    return new Polygon(...options);
}

/** Type guard that checks whether a value is a `Polygon` instance. */
export function elementIsPolygon(value: unknown): value is Polygon {
    return value instanceof Polygon;
}