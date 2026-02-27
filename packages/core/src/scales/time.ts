import {
    createScale,
    getLinearScaleMethod,
    LinearScaleOptions,
} from './_base';

import {
    arrayMap,
    arrayMapRange,
} from '@ripl/utilities';

import type {
    Scale,
} from './types';

export function scaleTime(
    domain: Date[],
    range: number[],
    options?: LinearScaleOptions
): Scale<Date, number> {
    const numericDomain = arrayMap(domain, date => date.getTime());
    const convert = getLinearScaleMethod(numericDomain, range, options);
    const invert = getLinearScaleMethod(range, numericDomain, options);

    return createScale({
        domain,
        range,
        convert: value => convert(value.getTime()),
        invert: value => new Date(invert(value)),
        includes: value => {
            const time = value.getTime();
            return time >= numericDomain[0] && time <= numericDomain[1];
        },
        ticks: (count: number = 10) => {
            const [
                min,
                max,
            ] = numericDomain;

            const step = (max - min) / (count - 1);

            return arrayMapRange(count, i => {
                return new Date(min + (step * i));
            });
        },
    });
}
