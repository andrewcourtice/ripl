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