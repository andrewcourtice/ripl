import {
    ContextPath,
    radiansToDegrees,
} from '@ripl/core';

import type {
    BorderRadius,
} from '@ripl/core';

import {
    Skia,
} from '@shopify/react-native-skia';

import type {
    SkPath,
} from '@shopify/react-native-skia';

import {
    rotationMatrixAbout,
} from './transform';

const TWO_PI = Math.PI * 2;
const FULL_CIRCLE_EPSILON = 1e-6;

/** Whether the angular span from `startAngle` to `endAngle` covers a full turn (a complete circle/ellipse). */
function isFullSweep(startAngle: number, endAngle: number): boolean {
    return Math.abs(endAngle - startAngle) >= TWO_PI - FULL_CIRCLE_EPSILON;
}

/**
 * Converts a canvas-style arc span into the signed sweep (in degrees) Skia's `arcToOval` expects,
 * where a positive sweep is clockwise. Mirrors the Canvas 2D `arc`/`ellipse` winding rules: without
 * `counterclockwise` the sweep is normalized positive, and with it the sweep is normalized negative.
 */
function resolveSweepDegrees(startAngle: number, endAngle: number, counterclockwise?: boolean): number {
    let sweep = endAngle - startAngle;

    if (counterclockwise) {
        if (sweep > 0) {
            sweep = (sweep % TWO_PI) - TWO_PI;
        }
    } else if (sweep < 0) {
        sweep = (sweep % TWO_PI) + TWO_PI;
    }

    return radiansToDegrees(sweep);
}

/**
 * A {@link ContextPath} backed by a native Skia {@link SkPath}. Each Ripl path primitive records the
 * equivalent Skia path command, so an element's traced geometry can be filled, stroked, or clipped by
 * {@link ReactNativeSkiaContext}. The underlying path is exposed as {@link ReactNativeSkiaPath.skia}.
 */
export class ReactNativeSkiaPath extends ContextPath {

    /** The native Skia path recording this element's geometry. */
    public readonly skia: SkPath;

    constructor(id?: string) {
        super(id);
        this.skia = Skia.Path.Make();
    }

    /** Adds an arc centered at `(x, y)`, connecting from the current point unless the path is empty. */
    public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        const oval = Skia.XYWHRect(x - radius, y - radius, radius * 2, radius * 2);

        if (isFullSweep(startAngle, endAngle) && this.skia.isEmpty()) {
            this.skia.addOval(oval, counterclockwise);
            return;
        }

        this.skia.arcToOval(
            oval,
            radiansToDegrees(startAngle),
            resolveSweepDegrees(startAngle, endAngle, counterclockwise),
            this.skia.isEmpty()
        );
    }

    /** Adds an arc tangent to the lines from the current point to `(x1, y1)` and from `(x1, y1)` to `(x2, y2)`. */
    public arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
        this.skia.arcToTangent(x1, y1, x2, y2, radius);
    }

    /** Adds a full circle centered at `(x, y)` with the given radius as a new sub-path. */
    public circle(x: number, y: number, radius: number): void {
        this.skia.addCircle(x, y, radius);
    }

    /** Adds a cubic Bézier curve to `(x, y)` using control points `(cp1x, cp1y)` and `(cp2x, cp2y)`. */
    public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
        this.skia.cubicTo(cp1x, cp1y, cp2x, cp2y, x, y);
    }

    /** Closes the current sub-path with a straight line back to its start point. */
    public closePath(): void {
        this.skia.close();
    }

    /** Adds an ellipse centered at `(x, y)` with the given radii and rotation, sweeping from `startAngle` to `endAngle`. */
    public ellipse(x: number, y: number, radiusX: number, radiusY: number, rotation: number, startAngle: number, endAngle: number, counterclockwise?: boolean): void {
        const oval = Skia.XYWHRect(x - radiusX, y - radiusY, radiusX * 2, radiusY * 2);
        const full = isFullSweep(startAngle, endAngle);

        if (!rotation) {
            if (full) {
                this.skia.addOval(oval, counterclockwise);
                return;
            }

            this.skia.arcToOval(
                oval,
                radiansToDegrees(startAngle),
                resolveSweepDegrees(startAngle, endAngle, counterclockwise),
                this.skia.isEmpty()
            );

            return;
        }

        // Skia arcs are axis-aligned, so a rotated ellipse is built on a sub-path and rotated about
        // its center before being appended.
        const sub = Skia.Path.Make();

        if (full) {
            sub.addOval(oval, counterclockwise);
        } else {
            sub.arcToOval(oval, radiansToDegrees(startAngle), resolveSweepDegrees(startAngle, endAngle, counterclockwise), true);
        }

        sub.transform(rotationMatrixAbout(rotation, x, y));
        this.skia.addPath(sub);
    }

    /** Adds a straight line from the current point to `(x, y)`. */
    public lineTo(x: number, y: number): void {
        this.skia.lineTo(x, y);
    }

    /** Moves the current point to `(x, y)` without drawing, beginning a new sub-path. */
    public moveTo(x: number, y: number): void {
        this.skia.moveTo(x, y);
    }

    /** Adds a quadratic Bézier curve to `(x, y)` using control point `(cpx, cpy)`. */
    public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
        this.skia.quadTo(cpx, cpy, x, y);
    }

    /** Adds a rectangle with its top-left corner at `(x, y)` and the given width and height. */
    public rect(x: number, y: number, width: number, height: number): void {
        this.skia.addRect(Skia.XYWHRect(x, y, width, height));
    }

    /** Adds a rectangle with rounded corners, using a uniform Skia rounded rect when all radii match and a per-corner rect otherwise. */
    public roundRect(x: number, y: number, width: number, height: number, radii?: BorderRadius): void {
        const rect = Skia.XYWHRect(x, y, width, height);

        if (!radii) {
            this.skia.addRect(rect);
            return;
        }

        const [topLeft, topRight, bottomRight, bottomLeft] = radii;

        if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
            this.skia.addRRect(Skia.RRectXY(rect, topLeft, topLeft));
            return;
        }

        this.skia.addRRect({
            rect,
            topLeft: Skia.Point(topLeft, topLeft),
            topRight: Skia.Point(topRight, topRight),
            bottomRight: Skia.Point(bottomRight, bottomRight),
            bottomLeft: Skia.Point(bottomLeft, bottomLeft),
        });
    }

    /** Appends the drawing commands of another Skia-backed path to this path. */
    public addPath(path: ContextPath): void {
        if (path instanceof ReactNativeSkiaPath) {
            this.skia.addPath(path.skia);
        }
    }

}
