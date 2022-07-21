import {
    TAU,
} from './constants';

export type Point = [x: number, y: number];

export function arePointsEqual([x1, y1]: Point, [x2, y2]: Point): boolean {
    return x1 === x2 && y1 === y2;
}

export function waypoint([x1, y1]: Point, [x2, y2]: Point, position: number): Point {
    return [
        x1 + (x2 - x1) * position,
        y1 + (y2 - y1) * position,
    ];
}

export function midpoint(pointA: Point, pointB: Point): Point {
    return waypoint(pointA, pointB, 0.5);
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
        const x = radius * Math.cos(i * angle - offset);
        const y = radius * Math.sin(i * angle - offset);

        return [
            cx + x,
            cy + y,
        ] as Point;
    });

    if (closePath) {
        points.push(points[0]);
    }

    return points;
}