import {
    typeIsNumber,
} from '@ripl/utilities';

import type {
    InterpolatorFactory,
} from './types';

export const interpolateNumber: InterpolatorFactory<number> = (valueA, valueB) => {
    const valueDelta = valueB - valueA;
    return position => valueA + valueDelta * position;
};

interpolateNumber.test = typeIsNumber;