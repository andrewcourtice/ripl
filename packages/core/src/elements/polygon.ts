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
    getPolygonPoints,
    max,
} from '../math';

export interface PolygonState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
    sides: number;
}

export class Polygon extends Shape<PolygonState> {

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

    constructor(options: ShapeOptions<PolygonState>) {
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

export function createPolygon(...options: ConstructorParameters<typeof Polygon>) {
    return new Polygon(...options);
}

export function elementIsPolygon(value: unknown): value is Polygon {
    return value instanceof Polygon;
}