import {
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

interpolateNumber.test = typeIsNumber;