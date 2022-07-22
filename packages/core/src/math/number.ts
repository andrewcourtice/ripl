import {
    arrayForEach,
} from '@ripl/utilities';

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

export function getExtent<TValue>(values: TValue[], accessor: (value: TValue) => number): [min: number, max: number] {
    let min = accessor(values[0]);
    let max = accessor(values[0]);

    arrayForEach(values, item => {
        const value = accessor(item);

        min = Math.min(min, value);
        max = Math.max(max, value);
    });

    return [
        min,
        max,
    ];
}

export function getTotal<TValue>(values: TValue[], accessor: (value: TValue) => number): number {
    let total = 0;

    arrayForEach(values, item => {
        total += accessor(item);
    });

    return total;
}