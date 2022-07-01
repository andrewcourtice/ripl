export function min(...values: number[]): number {
    return Math.min(...values);
}

export function max(...values: number[]): number {
    return Math.max(...values);
}

export function clamp(value: number, lower: number, upper: number): number {
    const trueLower = min(lower, upper);
    const trueUpper = max(lower, upper);

    return min(trueUpper, max(trueLower, value));
}

export function fractional(value: number): number {
    return value - Math.floor(value);
}