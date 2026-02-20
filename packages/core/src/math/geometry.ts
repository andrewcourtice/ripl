import {
    TAU,
} from './constants';

import {
    Box,
} from './structs';

import {
    arrayForEach,
    functionCache,
    typeIsArray,
} from '@ripl/utilities';

import type {
    BorderRadius,
    Point,
} from './types';

export function degreesToRadians(degrees: number): number {
    return degrees * Math.PI / 180;
}

export function radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

export function arePointsEqual([x1, y1]: Point, [x2, y2]: Point): boolean {
    return x1 === x2 && y1 === y2;
}

export function getMidpoint(pointA: Point, pointB: Point): Point {
    return getWaypoint(pointA, pointB, 0.5);
}

export function getWaypoint([x1, y1]: Point, [x2, y2]: Point, position: number): Point {
    return [
        x1 + (x2 - x1) * position,
        y1 + (y2 - y1) * position,
    ];
}

export function getHypLength(sideA: number, sideB: number): number {
    return Math.sqrt(sideA ** 2 + sideB ** 2);
}

export function getThetaPoint(angle: number, distance: number, cx?: number, cy?: number): Point {
    return [
        (cx || 0) + Math.cos(angle) * distance,
        (cy || 0) + Math.sin(angle) * distance,
    ];
}

export function getPolygonPoints(
    sides: number,
    cx: number,
    cy: number,
    radius: number,
    closePath: boolean = true
): Point[] {
    const offset = TAU / 4;
    const angle = TAU / sides;

    const points = Array.from({ length: sides }, (_, i) => {
        return getThetaPoint(i * angle - offset, radius, cx, cy);
    });

    if (closePath) {
        points.push(points[0]);
    }

    return points;
}

export function getContainingBox<TValue>(value: TValue[], identity: (value: TValue) => Box): Box {
    let top = 0,
        left = 0,
        bottom = 0,
        right = 0;

    arrayForEach(value, item => {
        const box = identity(item);

        top = Math.min(top, box.top);
        left = Math.min(left, box.left);
        bottom = Math.max(bottom, box.bottom);
        right = Math.max(right, box.right);
    });

    return new Box(top, left, bottom, right);
}

export function isPointInBox([x, y]: Point, { left, top, bottom, right }: Box) {
    return x >= left
        && x <= right
        && y >= top
        && y <= bottom;
}

export function normaliseBorderRadius(borderRadius: number | BorderRadius): BorderRadius {
    return typeIsArray(borderRadius)
        ? borderRadius
        : [
            borderRadius,
            borderRadius,
            borderRadius,
            borderRadius,
        ];
}

export function typeIsPoint(value: unknown): value is Point {
    return typeIsArray(value) && value.length === 2;
}

export type PathPoint = {
    x: number;
    y: number;
    angle: number;
};

const getRefPathElement = functionCache(() => {
    return document.createElementNS('http://www.w3.org/2000/svg', 'path');
});

export function getPathLength(pathData: string): number {
    const pathEl = getRefPathElement();
    pathEl.setAttribute('d', pathData);

    return pathEl.getTotalLength();
}

export function samplePathPoint(pathData: string, distance: number): PathPoint {
    const pathEl = getRefPathElement();

    pathEl.setAttribute('d', pathData);

    const totalLength = pathEl.getTotalLength();
    const clampedDistance = Math.max(0, Math.min(distance, totalLength));
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