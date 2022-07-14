import {
    interpolateNumber,
} from './number';

import type {
    Interpolator,
} from './types';

export function interpolateDate(valueA: Date, valueB: Date): Interpolator<Date> {
    const date = new Date();
    const interpolator = interpolateNumber(valueA.getTime(), valueB.getTime());

    return position => {
        date.setTime(interpolator(position));
        return date;
    };
}