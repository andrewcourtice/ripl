/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
    ContextElement,
} from './types';

import {
    BorderRadius,
    Point,
} from '../math';

import {
    stringUniqueId,
} from '@ripl/utilities';

/** A virtual path element used to record drawing commands; subclassed by Canvas and SVG implementations. */
export class ContextPath implements ContextElement {

    public readonly id: string;

    constructor(id: string = `path-${stringUniqueId()}`) {
        this.id = id;
    }

    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        // do nothing
    }

    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        // do nothing
    }

    public circle(x: number, y: number, radius: number): void {
        // do nothing
    }

    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        // do nothing
    }

    public closePath(): void {
        // do nothing
    }

    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        // do nothing
    }

    public lineTo(x: number, y: number): void {
        // do nothing
    }

    public moveTo(x: number, y: number): void {
        // do nothing
    }

    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        // do nothing
    }

    public rect(x: number, y: number, width: number, height: number): void {
        // do nothing
    }

    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        // do nothing
    }

    public polyline(points: Point[]): void {
        points.forEach(([x, y], index) => !index
            ? this.moveTo(x,y)
            : this.lineTo(x, y)
        );
    }

    public addPath(path: ContextPath): void {
        // do nothing
    }

}