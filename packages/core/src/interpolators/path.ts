import {
    BorderRadius,
    fractional,
    getPolygonPoints,
    getWaypoint,
    normaliseBorderRadius,
    Point,
    TAU,
} from '../math';

import {
    interpolateNumber,
} from './number';

import {
    arrayMap,
} from '@ripl/utilities';

import type {
    Interpolator,
} from './types';

function extrapolatePointSet(setA: Point[], setB: Point[]): Point[][] {
    const sets = [setA, setB];

    if (setA.length === setB.length) {
        return sets;
    }

    // Determine the greater set
    const [
        src,
        dest,
    ] = sets.slice().sort((sa, sb) => sb.length - sa.length);

    const destLength = dest.length;
    const srcLength = src.length;
    const pointCount = srcLength - destLength;
    const partitionCount = destLength - 1;
    const pointsPerPartition = Math.floor(pointCount / partitionCount);

    const extrapolated = dest.slice();

    Array.from({ length: partitionCount }, (_, pcIndex) => {
        const insertionIndex = pcIndex * (pointsPerPartition + 1);
        const points = Array.from({ length: pointsPerPartition }, (_, pppIndex) => {
            return getWaypoint(dest[pcIndex], dest[pcIndex + 1], (1 / pointsPerPartition) * pppIndex);
        });

        extrapolated.splice(insertionIndex, 0, ...points);
    });

    const remainder = srcLength - extrapolated.length;

    if (remainder) {
        const points = Array.from({ length: remainder }, () => extrapolated[0]);
        extrapolated.splice(0, 0, ...points);
    }

    return [
        src,
        extrapolated,
    ].sort(() => sets.indexOf(dest) - sets.indexOf(src));
}

export function interpolatePoints(setA: Point[], setB: Point[]): Interpolator<Point[]> {
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
}

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

export function interpolateBorderRadius(radiusA: number | BorderRadius, radiusB: number | BorderRadius): Interpolator<BorderRadius> {
    const nRadiusA = normaliseBorderRadius(radiusA);
    const nRadiusB = normaliseBorderRadius(radiusB);
    const interpolators = arrayMap(nRadiusA, (value, index) => interpolateNumber(value, nRadiusB[index]));

    return position => arrayMap(interpolators, ib => ib(position)) as BorderRadius;
}