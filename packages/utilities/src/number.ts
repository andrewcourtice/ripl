import {
    typeIsNumber,
} from './type';

/** Computes the sum of an array of numbers, or of values mapped through an optional iteratee. */
export function numberSum<TValue = number>(values: TValue[], iteratee?: (value: TValue) => number) {
    return values.reduce((total, value) => {
        const output = typeIsNumber(value)
            ? value
            : iteratee?.(value);

        return total + (output ?? 0);
    }, 0);
}

/** Computes the greatest common divisor of two integers using the Euclidean algorithm. */
export function numberGCD(valueA: number, valueB: number) {
    while (valueB !== 0) {
        const temp = valueB;

        valueB = valueA % valueB;
        valueA = temp;
    }

    return valueA;
}

/**
 * Rounds a number to at most `precision` decimal places, stripping any trailing zeros.
 *
 * Unlike `Number.prototype.toFixed` (which returns a fixed-width string), this returns a `number`
 * so integers stay integers (`roundTo(5, 2) === 5`) and fractional values are capped
 * (`roundTo(1.005, 2) === 1.01`, `roundTo(3.14159, 2) === 3.14`). Non-finite values pass through
 * unchanged. Used as the default precision cap for chart labels, axes, and tooltips.
 */
export function roundTo(value: number, precision: number = 2): number {
    if (!Number.isFinite(value)) {
        return value;
    }

    const factor = 10 ** Math.max(0, Math.trunc(precision));

    return Math.round(value * factor) / factor;
}

/** Rounds a value to a "nice" human-readable number (1, 2, 5, or 10 scaled by the appropriate power of ten). */
export function numberNice(value: number, round: boolean = false) {
    const exponent = Math.floor(Math.log10(value));
    const factor = 10 ** exponent;
    const fraction = value / factor;

    let niceFraction: number;

    if (round) {
        if (fraction < 1.5) niceFraction = 1;
        else if (fraction < 3) niceFraction = 2;
        else if (fraction < 7) niceFraction = 5;
        else niceFraction = 10;
    } else if (fraction <= 1) {
        niceFraction = 1;
    } else if (fraction <= 2) {
        niceFraction = 2;
    } else if (fraction <= 5) {
        niceFraction = 5;
    } else {
        niceFraction = 10;
    }

    return niceFraction * factor;
}