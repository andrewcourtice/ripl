import {
    getPolygonPoints,
    getWaypoint,
    normalizeBorderRadius,
    TAU,
    typeIsPoint,
} from '../math';

import type {
    BorderRadius,
    Point,
} from '../math';

import {
    interpolateNumber,
} from './number';

import {
    numberFractional,
    typeIsArray,
    typeIsNil,
    typeIsNumber,
} from '@ripl/utilities';

import type {
    Interpolator,
    InterpolatorFactory,
    PredicatedFunction,
} from './types';

function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
}

function lcm(a: number, b: number): number {
    return (a / gcd(a, b)) * b;
}

function distributePoints(points: Point[], multiplier: number): Point[] {
    const segmentCount = points.length - 1;
    const result: Point[] = [];

    for (let i = 0; i < segmentCount; i++) {
        result.push(points[i]);

        for (let si = 1; si < multiplier; si++) {
            result.push(getWaypoint(points[i], points[i + 1], si / multiplier));
        }
    }

    result.push(points[segmentCount]);
    return result;
}

function extrapolatePointSet(setA: Point[], setB: Point[]): Point[][] {
    const setALength = setA.length;
    const setBLength = setB.length;

    if (setALength === setBLength) {
        return [setA, setB];
    }

    const segmentsA = setALength - 1;
    const segmentsB = setBLength - 1;

    if (segmentsA === 0) {
        return [Array.from({ length: setBLength }, () => setA[0]), setB];
    }

    if (segmentsB === 0) {
        return [setA, Array.from({ length: setALength }, () => setB[0])];
    }

    const targetSegments = lcm(segmentsA, segmentsB);

    return [
        distributePoints(setA, targetSegments / segmentsA),
        distributePoints(setB, targetSegments / segmentsB),
    ];
}

/** Options controlling how {@link interpolatePoints} reconciles two point sets. */
export interface InterpolatePointsOptions {
    /**
     * Reconciles the two sets by **identity**: given the source (`setA`) and target (`setB`) point
     * arrays, returns for each target point the index of the source point it continues from, or `-1`
     * for a point that has no predecessor (an "entering" point).
     *
     * When provided, the interpolator matches points by this correspondence instead of upsampling
     * both sets to a common resolution with straight-line waypoints. That blind upsampling makes a
     * curved renderer (monotoneX, catmullRom, …) drawn through the densely collinear points look
     * **linear** for the whole morph; matching by identity keeps the sparse real points, so the
     * curve is preserved while a point is added or removed.
     */
    resolveKeys?: (setA: Point[], setB: Point[]) => number[];
}

/** The {@link interpolatePoints} factory: a point-array interpolator factory that also accepts {@link InterpolatePointsOptions}. */
export interface InterpolatePointsFactory extends PredicatedFunction {
    /** Creates an interpolator that morphs point array `setA` into `setB`, optionally keyed via {@link InterpolatePointsOptions}. */
    (setA: Point[], setB: Point[], options?: InterpolatePointsOptions): Interpolator<Point[]>;
}

/**
 * Builds the "from" array (length of `setB`) for a keyed morph: surviving target points start at
 * their matched source point; entering points (`-1`) start at the nearest matched neighbor's Y but
 * the target's own X — keeping X strictly monotonic so curve tangent maths never divides by zero.
 */
function buildKeyedFromSet(setA: Point[], setB: Point[], map: number[]): Point[] {
    const nearestMatchedY = (index: number): number | undefined => {
        for (let offset = 1; offset < setB.length; offset++) {
            const left = map[index - offset];

            if (left !== undefined && left >= 0 && left < setA.length) {
                return setA[left][1];
            }

            const right = map[index + offset];

            if (right !== undefined && right >= 0 && right < setA.length) {
                return setA[right][1];
            }
        }

        return undefined;
    };

    return setB.map((target, index) => {
        const sourceIndex = map[index];

        if (sourceIndex >= 0 && sourceIndex < setA.length) {
            return setA[sourceIndex];
        }

        return [target[0], nearestMatchedY(index) ?? target[1]] as Point;
    });
}

/** Interpolator factory that transitions between two point arrays. By default it extrapolates additional points where set lengths differ; pass `resolveKeys` to match points by identity instead (preserving curved renderers across add/remove). */
export const interpolatePoints: InterpolatePointsFactory = (setA, setB, options?: InterpolatePointsOptions) => {
    const resolveKeys = options?.resolveKeys;

    // Keyed morph: a from-array the length of setB, matched point-for-point (no LCM upsampling).
    // Otherwise fall back to the default extrapolation that equalises differing lengths.
    const [
        extSetA,
        extSetB,
    ] = !typeIsNil(resolveKeys)
        ? [buildKeyedFromSet(setA, setB, resolveKeys(setA, setB)), setB]
        : extrapolatePointSet(setA, setB);

    const interpolators = extSetA.map((pointA, index) => {
        const pointB = extSetB[index];

        return [
            interpolateNumber(pointA[0], pointB[0]),
            interpolateNumber(pointA[1], pointB[1]),
        ];
    });

    // Settle on the original (un-extrapolated) sets at the endpoints so a completed morph
    // commits the clean target points rather than the LCM-upsampled set. Without this the
    // element would retain the inflated point array and each subsequent morph would compound
    // the point count (lcm of ever-growing lengths), exhausting memory.
    return position => {
        if (position <= 0) {
            return setA;
        }

        if (position >= 1) {
            return setB;
        }

        return interpolators.map(([ix, iy]) => [
            ix(position),
            iy(position),
        ]);
    };
};

/** Reports whether this factory can interpolate the given value (an array of {@link Point} tuples). */
interpolatePoints.test = value => typeIsArray(value) && value.every(point => typeIsPoint(point));

/** Creates an interpolator that returns the point along a polyline at the given normalized position. */
export function interpolateWaypoint(points: Point[]): Interpolator<Point> {
    const lastIndex = points.length - 1;

    return position => {
        if (position === 1) {
            return points[lastIndex];
        }

        const offset = lastIndex * position;
        const lowerBound = Math.floor(offset);
        const upperBound = Math.ceil(offset);

        return getWaypoint(points[lowerBound], points[upperBound], numberFractional(offset));
    };
}

/** Creates an interpolator that progressively reveals a path from start to end as position advances from 0 to 1. */
export function interpolatePath(points: Point[]): Interpolator<Point[]> {
    const lastIndex = points.length - 1;
    const getWaypoint = interpolateWaypoint(points);

    return position => {
        if (position === 1) {
            return points;
        }

        return points.slice(0, Math.ceil(lastIndex * position)).concat([
            getWaypoint(position),
        ]);
    };
}

/** Creates an interpolator that traces a point around the vertices of a regular polygon. */
export function interpolatePolygonPoint(
    sides: number,
    cx: number,
    cy: number,
    radius: number,
    closePath: boolean = true
): Interpolator<Point> {
    const points = getPolygonPoints(sides, cx, cy, radius, closePath);
    return interpolateWaypoint(points);
}

/** Creates an interpolator that traces a point around a circle of the given center and radius. */
export function interpolateCirclePoint(
    cx: number,
    cy: number,
    radius: number
): Interpolator<Point> {
    const offset = TAU / 4;

    return position => [
        cx + radius * Math.cos(position * TAU - offset),
        cy + radius * Math.sin(position * TAU - offset),
    ];
}

/** Interpolator factory that transitions between two border-radius values (single number or four-corner tuple). */
export const interpolateBorderRadius: InterpolatorFactory<BorderRadius, number | BorderRadius> = (radiusA, radiusB) => {
    const nRadiusA = normalizeBorderRadius(radiusA);
    const nRadiusB = normalizeBorderRadius(radiusB);
    const interpolators = nRadiusA.map((value, index) => interpolateNumber(value, nRadiusB[index]));

    return position => interpolators.map(ib => ib(position)) as BorderRadius;
};

/** Reports whether this factory can interpolate the given value (a number or a tuple of up to four corner radii). */
interpolateBorderRadius.test = value => typeIsNumber(value) || (
    typeIsArray(value)
    && value.length <= 4
    && value.every(typeIsNumber)
);