import {
    TAU,
} from './constants';

import {
    Box,
} from './structs';

import {
    matrixApplyToPoint,
} from './matrix';

import type {
    Matrix,
} from './matrix';

import {
    factory,
} from '../core/factory';

import {
    arrayMapRange,
    functionCache,
    numberClamp,
    typeIsArray,
} from '@ripl/utilities';

import type {
    BorderRadius,
    Point,
} from './types';

/** Converts degrees to radians. */
export function degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
}

/** Converts radians to degrees. */
export function radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

/** Tests whether two points have identical coordinates. */
export function arePointsEqual([x1, y1]: Point, [x2, y2]: Point): boolean {
    return x1 === x2 && y1 === y2;
}

/** Returns the midpoint between two points. */
export function getMidpoint(pointA: Point, pointB: Point): Point {
    return getWaypoint(pointA, pointB, 0.5);
}

/** Returns a point along the line segment between two points at the given normalized position (0–1). */
export function getWaypoint([x1, y1]: Point, [x2, y2]: Point, position: number): Point {
    return [
        x1 + (x2 - x1) * position,
        y1 + (y2 - y1) * position,
    ];
}

/** Computes the Euclidean distance from two points. */
export function getEuclideanDistance(dp: number, dq: number): number {
    return Math.sqrt(dp ** 2 + dq ** 2);
}

/** Returns the point at a given angle and distance from an optional center. */
export function getThetaPoint(angle: number, distance: number, cx?: number, cy?: number): Point {
    return [
        (cx || 0) + Math.cos(angle) * distance,
        (cy || 0) + Math.sin(angle) * distance,
    ];
}

/**
 * Returns the angular inset, in radians, that trims an arc at `radius` back from a gap of
 * `padWidth` logical pixels centred on the boundary angle — `asin(padWidth / (2 * radius))`.
 *
 * Applying it per radius (rather than insetting by a fixed angle) leaves the straight edge on a
 * line offset `padWidth / 2` from the radial centreline, so neighbouring segments face each other
 * with parallel edges a constant `padWidth` apart instead of a wedge that widens outward.
 *
 * Saturates at a quarter turn where the gap is at least as wide as the diameter — inside
 * `radius < padWidth / 2` nothing of the arc survives, and an infinite `padWidth` saturates like
 * any other over-wide gap. Returns `0` for a `padWidth` that is non-positive or `NaN`, and for a
 * `radius` that is negative or `NaN`.
 *
 * @param padWidth - The gap width, in logical pixels, held constant at every radius.
 * @param radius - The radius at which the inset is measured.
 * @returns The angular inset to apply at each end of the arc, in radians.
 */
export function getPadAngleAtRadius(padWidth: number, radius: number): number {
    if (!(padWidth > 0) || !(radius >= 0)) {
        return 0;
    }

    return Math.asin(Math.min(padWidth / (2 * radius), 1));
}

/**
 * Returns the smallest radius at which a sector of `span` radians still faces its neighbors with
 * edges a full `padWidth` apart — `(padWidth / 2) / sin(min(span, π) / 2)`.
 *
 * The straight edges a {@link getPadAngleAtRadius} inset produces are parallel lines offset
 * `padWidth / 2` from the radial centrelines, and parallel lines never meet: below this radius the
 * inset needed to reach them exceeds half the span, the sector collapses onto its mid-angle, and
 * the gap tapers away instead of holding its width. Flooring a sector's inner radius here is what
 * lets a gap run all the way to the center of a shape that has no hole.
 *
 * Returns `0` where no floor applies — a `padWidth` that is non-positive, `NaN` or infinite, a
 * `span` that is non-positive or `NaN`, and a full turn or wider, which has no neighbor to clear.
 *
 * @param padWidth - The gap width, in logical pixels, held constant at every radius.
 * @param span - The angular span of the sector, in radians.
 * @returns The radius at which the sector's straight edges converge, or `0` where none does.
 */
export function getPadInnerRadius(padWidth: number, span: number): number {
    if (!(padWidth > 0) || !Number.isFinite(padWidth) || !(span > 0) || span >= TAU) {
        return 0;
    }

    return padWidth / 2 / Math.sin(Math.min(span, Math.PI) / 2);
}

/** Generates the vertex points of a regular polygon centered at `(cx, cy)` with the given radius and number of sides. */
export function getPolygonPoints(
    sides: number,
    cx: number,
    cy: number,
    radius: number,
    closePath: boolean = true
): Point[] {
    const offset = TAU / 4;
    const angle = TAU / sides;

    const points = arrayMapRange(sides, i => {
        return getThetaPoint(i * angle - offset, radius, cx, cy);
    });

    if (closePath) {
        points.push(points[0]);
    }

    return points;
}

/** Computes the smallest axis-aligned bounding box that contains all boxes extracted from the array. */
export function getContainingBox<TValue>(value: TValue[], identity: (value: TValue) => Box): Box {
    if (!value.length) {
        return Box.empty();
    }

    let top = Infinity,
        left = Infinity,
        bottom = -Infinity,
        right = -Infinity;

    value.forEach(item => {
        const box = identity(item);

        top = Math.min(top, box.top);
        left = Math.min(left, box.left);
        bottom = Math.max(bottom, box.bottom);
        right = Math.max(right, box.right);
    });

    return new Box(top, left, bottom, right);
}

/**
 * Transforms a box by an affine matrix and returns the axis-aligned bounding box of the result.
 * Returns the box unchanged when `matrix` is `null` (the identity case). Because it re-fits an AABB
 * around the transformed corners, a rotated box yields a conservative (enlarged) bounding box.
 */
export function transformBox(box: Box, matrix: Matrix | null): Box {
    if (!matrix) {
        return box;
    }

    const corners: Point[] = [
        [box.left, box.top],
        [box.right, box.top],
        [box.right, box.bottom],
        [box.left, box.bottom],
    ];

    let top = Infinity,
        left = Infinity,
        bottom = -Infinity,
        right = -Infinity;

    corners.forEach(corner => {
        const [x, y] = matrixApplyToPoint(matrix, corner);

        top = Math.min(top, y);
        left = Math.min(left, x);
        bottom = Math.max(bottom, y);
        right = Math.max(right, x);
    });

    return new Box(top, left, bottom, right);
}

/** Tests whether a point lies within the given bounding box (inclusive). */
export function isPointInBox([x, y]: Point, { left, top, bottom, right }: Box) {
    return x >= left
        && x <= right
        && y >= top
        && y <= bottom;
}

/** Normalizes a border radius value into a four-corner tuple, expanding a single number to all corners. */
export function normalizeBorderRadius(borderRadius: number | BorderRadius): BorderRadius {
    return typeIsArray(borderRadius)
        ? borderRadius
        : [
            borderRadius,
            borderRadius,
            borderRadius,
            borderRadius,
        ];
}

/** Type guard that checks whether a value is a `Point` (a two-element array). */
export function typeIsPoint(value: unknown): value is Point {
    return typeIsArray(value) && value.length === 2;
}

/** A sampled point on an SVG path with position and tangent angle. */
export type PathPoint = {
    /** The x-coordinate of the sampled point. */
    x: number;
    /** The y-coordinate of the sampled point. */
    y: number;
    /** The tangent angle of the path at the sampled point, in radians. */
    angle: number;
};

const getRefPathElement = functionCache(() => {
    return factory.createElementNS('http://www.w3.org/2000/svg', 'path') as SVGPathElement;
});

/**
 * Computes the total length of an SVG path from its `d` attribute string.
 *
 * Measured by a real SVG `<path>` element, so this needs a DOM. Off-platform (e.g. under
 * `@ripl/node`) the element is a stub and this returns `0` rather than throwing.
 */
export function getPathLength(pathData: string): number {
    const pathEl = getRefPathElement();
    pathEl.setAttribute('d', pathData);

    return pathEl.getTotalLength();
}

/**
 * Samples a point and tangent angle at the given distance along an SVG path.
 *
 * Measured by a real SVG `<path>` element, so this needs a DOM. Off-platform (e.g. under
 * `@ripl/node`) the element is a stub and this returns the origin rather than throwing.
 */
export function samplePathPoint(pathData: string, distance: number): PathPoint {
    const pathEl = getRefPathElement();

    pathEl.setAttribute('d', pathData);

    const totalLength = pathEl.getTotalLength();
    const clampedDistance = numberClamp(distance, 0, totalLength);
    const point = pathEl.getPointAtLength(clampedDistance);

    const delta = 0.5;
    const pointBefore = pathEl.getPointAtLength(Math.max(0, clampedDistance - delta));
    const pointAfter = pathEl.getPointAtLength(Math.min(totalLength, clampedDistance + delta));
    const angle = Math.atan2(pointAfter.y - pointBefore.y, pointAfter.x - pointBefore.x);

    return {
        x: point.x,
        y: point.y,
        angle,
    };
}