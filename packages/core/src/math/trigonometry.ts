export function degreesToRadians(degress: number): number {
    return degress * Math.PI / 180;
}

export function radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

export function getHypLength(sideA: number, sideB: number): number {
    return Math.sqrt(sideA ** 2 + sideB ** 2);
}

export function arePointsEqual([x1, y1]: [x: number, y: number], [x2, y2]: [x: number, y: number]) {
    return x1 === x2 && y1 === y2;
}