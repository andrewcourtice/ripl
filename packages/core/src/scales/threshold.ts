import {
    createNumericIncludesMethod,
    createScale,
} from './_base';

import type {
    Scale,
} from './types';

export function scaleThreshold<TRange>(
    domain: number[],
    range: TRange[]
): Scale<number, TRange> {
    const sortedDomain = domain.slice().sort((a, b) => a - b);

    return createScale({
        domain,
        range,
        convert: value => {
            const index = sortedDomain.findIndex(threshold => value < threshold);
            return index === -1 ? range[range.length - 1] : range[index];
        },
        invert: value => {
            const rangeIndex = range.indexOf(value);
            if (rangeIndex === -1 || rangeIndex === 0) {
                return sortedDomain[0];
            }
            return sortedDomain[rangeIndex - 1];
        },
        includes: createNumericIncludesMethod([sortedDomain[0], sortedDomain[sortedDomain.length - 1]]),
        ticks() {
            return sortedDomain.slice();
        },
    });
}
