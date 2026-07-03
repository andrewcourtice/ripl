
/** Returns the minimum of the provided numbers. */
export function numberMin(...values: number[]): number {
    return Math.min(...values);
}

/** Returns the maximum of the provided numbers. */
export function numberMax(...values: number[]): number {
    return Math.max(...values);
}

/** Returns the minimum numeric value extracted from an array via the accessor. */
export function numberMinOf<TValue>(values: TValue[], accessor: (value: TValue) => number) {
    return numberMin(...values.map(accessor));
}

/** Returns the maximum numeric value extracted from an array via the accessor. */
export function numberMaxOf<TValue>(values: TValue[], accessor: (value: TValue) => number) {
    return numberMax(...values.map(accessor));
}

/** Constrains a value to the inclusive range between lower and upper bounds. */
export function numberClamp(value: number, lower: number, upper: number): number {
    const trueLower = numberMin(lower, upper);
    const trueUpper = numberMax(lower, upper);

    return numberMin(trueUpper, numberMax(trueLower, value));
}

/** Returns the fractional part of a number (e.g. `numberFractional(3.7)` → `0.7`). */
export function numberFractional(value: number): number {
    return value - Math.floor(value);
}

/** Computes the `[min, max]` extent of an array using the given numeric accessor. */
export function numberExtent<TValue>(values: TValue[], accessor: (value: TValue) => number): [min: number, max: number] {
    let min = accessor(values[0]);
    let max = accessor(values[0]);

    values.forEach(item => {
        const value = accessor(item);

        min = Math.min(min, value);
        max = Math.max(max, value);
    });

    return [
        min,
        max,
    ];
}

/** Sums all numeric values extracted from an array via the accessor. */
export function numberTotal<TValue>(values: TValue[], accessor: (value: TValue) => number): number {
    let total = 0;

    values.forEach(item => {
        total += accessor(item);
    });

    return total;
}
