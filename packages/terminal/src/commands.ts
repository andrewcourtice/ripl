import {
    estimateArcSteps,
    estimateEllipseSteps,
    flattenArc,
    flattenCubicBezier,
    flattenEllipse,
    flattenQuadBezier,
    normalizeArcSweep,
    normalizeEllipseSweep,
    rasterizeCircle,
    rasterizeCubicBezier,
    rasterizeEllipse,
    rasterizeLine,
    rasterizePolygon,
    rasterizePolyline,
    rasterizeQuadBezier,
} from './algorithms';

import type {
    PixelCallback,
    Vertex,
} from './algorithms';

import type {
    TerminalPathCommandType,
} from './path';

import type {
    TerminalTransform,
} from './transform';

import {
    TAU,
} from '@ripl/core';

/** Contour-building state passed to a command's `toContour` handler. */
export interface ContourContext {
    /** The logical-to-raster mapping in force for this pass. */
    transform: TerminalTransform;
    /** The contours built so far. */
    contours: Vertex[][];
    /** Closes the contour under construction and starts a new one. */
    flush(): void;
    /** Appends a raster-space point to the contour under construction. */
    append(point: Vertex): void;
}

/** Rasterization state passed to a command's `rasterize` handler. */
export interface RasterContext {
    /** The logical-to-raster mapping in force for this pass. */
    transform: TerminalTransform;
    /** Invoked for each rasterized pixel. */
    plot: PixelCallback;
}

/** A path command's two rendering passes: contour flattening (for fills) and outline rasterization. */
export interface TerminalCommandHandler {
    /** Flattens the command into raster-space contour points for the fill pass. */
    toContour(context: ContourContext, args: number[]): void;
    /** Draws the command's outline for the stroke pass. */
    rasterize(context: RasterContext, args: number[]): void;
}

/** Sweep beyond which an arc is treated as a full turn, matching the rasterizer's own tolerance. */
const FULL_TURN_EPSILON = 0.001;

/** Samples an arc in logical space, segmented for its raster-space size, and maps it to raster space. */
function traceArc(transform: TerminalTransform, args: number[]): Vertex[] {
    const sweep = normalizeArcSweep(args[3], args[4], !!args[5]);
    const steps = estimateArcSteps(transform.scalar(args[2]), sweep);
    const points = flattenArc(args[0], args[1], args[2], args[3], args[4], !!args[5], steps);

    return points.map(point => transform.point(point.x, point.y));
}

/** Samples an ellipse in logical space, segmented for its raster-space size, and maps it to raster space. */
function traceEllipse(transform: TerminalTransform, args: number[]): Vertex[] {
    const sweep = normalizeEllipseSweep(args[5], args[6], !!args[7]);
    const steps = estimateEllipseSteps(transform.scalar(args[2]), transform.scalar(args[3]), sweep);
    const points = flattenEllipse(args[0], args[1], args[2], args[3], args[4], args[5], args[6], !!args[7], steps);

    return points.map(point => transform.point(point.x, point.y));
}

/** Maps a rect's four corners into raster space, where a transform may have made it a parallelogram. */
function traceRect(transform: TerminalTransform, args: number[]): Vertex[] {
    return [
        transform.point(args[0], args[1]),
        transform.point(args[0] + args[2], args[1]),
        transform.point(args[0] + args[2], args[1] + args[3]),
        transform.point(args[0], args[1] + args[3]),
    ];
}

/** Whether an arc's sweep covers a full turn. */
function isFullTurn(startAngle: number, endAngle: number): boolean {
    return Math.abs(endAngle - startAngle) >= TAU - FULL_TURN_EPSILON;
}

/**
 * Dispatch table keyed by path command type, driving both rendering passes.
 *
 * Points are mapped through the composite {@link TerminalTransform} rather than a per-axis scale, so
 * a rotated or skewed transform survives. An affine map takes a bezier to a bezier, so those
 * commands transform their control points and flatten as before; arcs and ellipses are sampled in
 * logical space and mapped point by point, because an affine map takes a circle to an ellipse.
 */
export const TERMINAL_COMMAND_HANDLERS: Record<TerminalPathCommandType, TerminalCommandHandler> = {
    moveTo: {
        toContour({ transform, flush, append }, args) {
            flush();
            append(transform.point(args[0], args[1]));
        },
        rasterize() {
            // No pixels to draw for moveTo.
        },
    },
    lineTo: {
        toContour({ transform, append }, args) {
            append(transform.point(args[0], args[1]));
            append(transform.point(args[2], args[3]));
        },
        rasterize({ transform, plot }, args) {
            const from = transform.point(args[0], args[1]);
            const to = transform.point(args[2], args[3]);

            rasterizeLine(from.x, from.y, to.x, to.y, plot);
        },
    },
    arc: {
        toContour({ transform, append }, args) {
            traceArc(transform, args).forEach(append);
        },
        rasterize({ transform, plot }, args) {
            // The midpoint circle is pixel-exact but assumes a circle, which only survives a
            // rotation-free uniform scale.
            if (transform.uniform && isFullTurn(args[3], args[4])) {
                const center = transform.point(args[0], args[1]);

                rasterizeCircle(center.x, center.y, transform.scalar(args[2]), plot);
                return;
            }

            rasterizePolyline(traceArc(transform, args), plot);
        },
    },
    ellipse: {
        toContour({ transform, contours, flush }, args) {
            flush();
            contours.push(traceEllipse(transform, args));
        },
        rasterize({ transform, plot }, args) {
            if (transform.axisAligned) {
                const center = transform.point(args[0], args[1]);

                rasterizeEllipse(center.x, center.y, transform.scalar(args[2]), transform.scalar(args[3]), args[4], args[5], args[6], !!args[7], plot);
                return;
            }

            rasterizePolyline(traceEllipse(transform, args), plot);
        },
    },
    bezierCurveTo: {
        toContour({ transform, append }, args) {
            const [from, cp1, cp2, to] = [
                transform.point(args[0], args[1]),
                transform.point(args[2], args[3]),
                transform.point(args[4], args[5]),
                transform.point(args[6], args[7]),
            ];

            flattenCubicBezier(from.x, from.y, cp1.x, cp1.y, cp2.x, cp2.y, to.x, to.y).forEach(append);
        },
        rasterize({ transform, plot }, args) {
            const [from, cp1, cp2, to] = [
                transform.point(args[0], args[1]),
                transform.point(args[2], args[3]),
                transform.point(args[4], args[5]),
                transform.point(args[6], args[7]),
            ];

            rasterizeCubicBezier(from.x, from.y, cp1.x, cp1.y, cp2.x, cp2.y, to.x, to.y, plot);
        },
    },
    quadraticCurveTo: {
        toContour({ transform, append }, args) {
            const [from, control, to] = [
                transform.point(args[0], args[1]),
                transform.point(args[2], args[3]),
                transform.point(args[4], args[5]),
            ];

            flattenQuadBezier(from.x, from.y, control.x, control.y, to.x, to.y).forEach(append);
        },
        rasterize({ transform, plot }, args) {
            const [from, control, to] = [
                transform.point(args[0], args[1]),
                transform.point(args[2], args[3]),
                transform.point(args[4], args[5]),
            ];

            rasterizeQuadBezier(from.x, from.y, control.x, control.y, to.x, to.y, plot);
        },
    },
    rect: {
        toContour({ transform, contours, flush }, args) {
            flush();
            contours.push(traceRect(transform, args));
        },
        rasterize({ transform, plot }, args) {
            rasterizePolygon(traceRect(transform, args), plot);
        },
    },
    closePath: {
        toContour({ flush }) {
            flush();
        },
        rasterize({ transform, plot }, args) {
            const from = transform.point(args[0], args[1]);
            const to = transform.point(args[2], args[3]);

            rasterizeLine(from.x, from.y, to.x, to.y, plot);
        },
    },
};
