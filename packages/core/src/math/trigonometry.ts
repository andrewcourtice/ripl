export type Point = [x: number, y: number];

export function degreesToRadians(degress: number): number {
    return degress * Math.PI / 180;
}

export function radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

export function getHypLength(sideA: number, sideB: number): number {
    return Math.sqrt(sideA ** 2 + sideB ** 2);
}

export function arePointsEqual([x1, y1]: Point, [x2, y2]: Point): boolean {
    return x1 === x2 && y1 === y2;
}

export function waypoint([x1, y1]: Point, [x2, y2]: Point, position: number): Point {
    const adj = x2 - x1;
    const opp = y2 - y1;
    const hyp = getHypLength(adj, opp);
    const theta = Math.atan(opp / adj);
    const distance = hyp * position;

    return [
        x1 + distance * Math.cos(theta),
        y1 + distance * Math.sin(theta),
    ];
}