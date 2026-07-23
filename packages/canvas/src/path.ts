import {
    ContextPath,
    TAU,
} from '@ripl/core';

import type {
    BorderRadius,
} from '@ripl/core';

/** Canvas-specific path implementation backed by a native `Path2D` object. */
export class CanvasPath extends ContextPath {

    /** The underlying native `Path2D` object accumulating this path's drawing commands. */
    public readonly ref: Path2D;

    constructor(id?: string) {
        super(id);
        this.ref = new Path2D();
    }

    /** Adds an arc centered at `(x, y)` with the given radius to the path. */
    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        return this.ref.arc(x, y, radius, startAngle, endAngle, counterclockwise);
    }

    /** Adds an arc connecting two tangents defined by the given points to the path. */
    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        return this.ref.arcTo(x1, y1, x2, y2, radius);
    }

    /** Adds a full circle centered at `(x, y)` to the path. */
    public circle(x: number, y: number, radius: number): void {
        this.arc(x, y, radius, 0, TAU);
    }

    /** Adds a cubic Bézier curve to the path. */
    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        return this.ref.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    /** Closes the current sub-path with a straight line back to its start. */
    public closePath(): void {
        return this.ref.closePath();
    }

    /** Adds an elliptical arc centered at `(x, y)` to the path. */
    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        return this.ref.ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, counterclockwise);
    }

    /** Adds a straight line from the current point to `(x, y)`. */
    public lineTo(x: number, y: number): void {
        return this.ref.lineTo(x, y);
    }

    /** Moves the current point to `(x, y)` without adding a line. */
    public moveTo(x: number, y: number): void {
        return this.ref.moveTo(x, y);
    }

    /** Adds a quadratic Bézier curve to the path. */
    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        return this.ref.quadraticCurveTo(cpx, cpy, x, y);
    }

    /** Adds a rectangle to the path. */
    public rect(x: number, y: number, width: number, height: number): void {
        return this.ref.rect(x, y, width, height);
    }

    /** Adds a rounded rectangle to the path, using the given corner radii. */
    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        return this.ref.roundRect(x, y, width, height, radii);
    }

    /** Appends another path's commands to this path. */
    public addPath(path: ContextPath): void {
        if (path instanceof CanvasPath) {
            this.ref.addPath(path.ref);
        }
    }

}
