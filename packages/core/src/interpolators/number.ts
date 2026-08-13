import {
    typeIsArray,
    typeIsNumber,
} from '@ripl/utilities';

import type {
    InterpolatorFactory,
} from './types';

/** Interpolator factory that linearly interpolates between two numbers. */
export const interpolateNumber: InterpolatorFactory<number> = (valueA, valueB) => {
    const valueDelta = valueB - valueA;
    return position => valueA + valueDelta * position;
};

/** Reports whether this factory can interpolate the given value (numbers only). */
interpolateNumber.test = typeIsNumber;

/**
 * Interpolator factory that transitions between two numeric arrays element-wise.
 *
 * The result takes the target's length, the shorter array repeating to fill it — a line dash pattern
 * already repeats, so `[4, 4]` and `[4, 4, 4, 4]` describe the same dashes. An empty array on either
 * side has nothing to pair with and falls back to a discrete swap.
 */
export const interpolateNumbers: InterpolatorFactory<number[]> = (valueA, valueB) => {
    if (!(valueA.length && valueB.length)) {
        return position => position > 0.5 ? valueB : valueA;
    }

    const interpolators = valueB.map((value, index) => interpolateNumber(valueA[index % valueA.length], value));

    // Settle on the original arrays at the endpoints, else each transition compounds the padded length.
    return position => {
        if (position <= 0) {
            return valueA;
        }

        if (position >= 1) {
            return valueB;
        }

        return interpolators.map(interpolate => interpolate(position));
    };
};

/** Reports whether this factory can interpolate the given value (an array of numbers). */
interpolateNumbers.test = value => typeIsArray(value) && value.every(typeIsNumber);