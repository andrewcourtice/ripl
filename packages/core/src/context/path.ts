/* eslint-disable @typescript-eslint/no-unused-vars */

import type {
    ContextElement,
} from './types';

import type {
    BorderRadius,
    Point,
} from '../math';

import {
    stringUniqueId,
} from '@ripl/utilities';

/** A virtual path element used to record drawing commands; subclassed by Canvas and SVG implementations. */
export class ContextPath implements ContextElement {

    /** Unique identifier for this path, used for SVG element diffing between frames. */
    public readonly id: string;

    constructor(id: string = `path-${stringUniqueId()}`) {
        this.id = id;
    }

    /** Adds an arc centred at `(x, y)` with the given radius, sweeping from `startAngle` to `endAngle`. */
    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        // do nothing
    }

    /** Adds an arc tangent to the lines from the current point to `(x1, y1)` and from `(x1, y1)` to `(x2, y2)`, with the given radius. */
    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        // do nothing
    }

    /** Adds a full circle centred at `(x, y)` with the given radius. */
    public circle(x: number, y: number, radius: number): void {
        // do nothing
    }

    /** Adds a cubic Bézier curve to `(x, y)` using control points `(cp1x, cp1y)` and `(cp2x, cp2y)`. */
    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        // do nothing
    }

    /** Closes the current sub-path with a straight line back to its start point. */
    public closePath(): void {
        // do nothing
    }

    /** Adds an ellipse centred at `(x, y)` with the given radii and rotation, sweeping from `startAngle` to `endAngle`. */
    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        // do nothing
    }

    /** Adds a straight line from the current point to `(x, y)`. */
    public lineTo(x: number, y: number): void {
        // do nothing
    }

    /** Moves the current point to `(x, y)` without drawing, beginning a new sub-path. */
    public moveTo(x: number, y: number): void {
        // do nothing
    }

    /** Adds a quadratic Bézier curve to `(x, y)` using control point `(cpx, cpy)`. */
    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        // do nothing
    }

    /** Adds a rectangle with its top-left corner at `(x, y)` and the given width and height. */
    public rect(x: number, y: number, width: number, height: number): void {
        // do nothing
    }

    /** Adds a rectangle with rounded corners at `(x, y)` with the given width, height, and corner radii. */
    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        // do nothing
    }

    /** Adds a connected series of straight line segments through the given points. */
    public polyline(points: Point[]): void {
        points.forEach(([x, y], index) => !index
            ? this.moveTo(x,y)
            : this.lineTo(x, y)
        );
    }

    /** Appends the drawing commands of another path to this path. */
    public addPath(path: ContextPath): void {
        // do nothing
    }

}