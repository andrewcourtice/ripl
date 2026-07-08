import {
    fractional,
    getPolygonPoints,
    getWaypoint,
    normaliseBorderRadius,
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
    typeIsArray,
    typeIsNumber,
} from '@ripl/utilities';

import type {
    Interpolator,
    InterpolatorFactory,
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

/** Interpolator factory that transitions between two point arrays, extrapolating additional points where set lengths differ. */
export const interpolatePoints: InterpolatorFactory<Point[]> = (setA, setB) => {
    const [
        extSetA,
        extSetB,
    ] = extrapolatePointSet(setA, setB);

    const interpolators = extSetA.map((pointA, index) => {
        const pointB = extSetB[index];

        return [
            interpolateNumber(pointA[0], pointB[0]),
            interpolateNumber(pointA[1], pointB[1]),
        ];
    });

    return position => interpolators.map(([ix, iy]) => [
        ix(position),
        iy(position),
    ]);
};

interpolatePoints.test = value => typeIsArray(value) && value.every(point => typeIsPoint(point));

/** Creates an interpolator that returns the point along a polyline at the given normalised position. */
export function interpolateWaypoint(points: Point[]): Interpolator<Point> {
    const lastIndex = points.length - 1;

    return position => {
        if (position === 1) {
            return points[lastIndex];
        }

        const offset = lastIndex * position;
        const lowerBound = Math.floor(offset);
        const upperBound = Math.ceil(offset);

        return getWaypoint(points[lowerBound], points[upperBound], fractional(offset));
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

/** Creates an interpolator that traces a point around a circle of the given centre and radius. */
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
    const nRadiusA = normaliseBorderRadius(radiusA);
    const nRadiusB = normaliseBorderRadius(radiusB);
    const interpolators = nRadiusA.map((value, index) => interpolateNumber(value, nRadiusB[index]));

    return position => interpolators.map(ib => ib(position)) as BorderRadius;
};

interpolateBorderRadius.test = value => typeIsNumber(value) || (
    typeIsArray(value)
    && value.length <= 4
    && value.every(typeIsNumber)
);