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
    } else {
        if (fraction <= 1) niceFraction = 1;
        else if (fraction <= 2) niceFraction = 2;
        else if (fraction <= 5) niceFraction = 5;
        else niceFraction = 10;
    }

    return niceFraction * factor;
}