import {
    interpolateNumber,
} from './number';

import {
    typeIsDate,
} from '@ripl/utilities';

import type {
    InterpolatorFactory,
} from './types';

/** Interpolator factory that interpolates between two `Date` instances by lerping their timestamps. */
export const interpolateDate: InterpolatorFactory<Date> = (valueA, valueB) => {
    const date = new Date();
    const interpolator = interpolateNumber(valueA.getTime(), valueB.getTime());

    return position => {
        date.setTime(interpolator(position));
        return date;
    };
};

interpolateDate.test = typeIsDate;