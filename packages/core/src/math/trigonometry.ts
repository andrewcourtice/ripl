export function degreesToRadians(degress: number): number {
    return degress * Math.PI / 180;
}

export function radiansToDegrees(radians: number): number {
    return radians * 180 / Math.PI;
}

export function getHypLength(sideA: number, sideB: number): number {
    return Math.sqrt(sideA ** 2 + sideB ** 2);
}