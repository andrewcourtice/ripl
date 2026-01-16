import {
    createNumericIncludesMethod,
    createScale,
} from './_base';

import {
    arrayMapRange,
} from '@ripl/utilities';

import type {
    Scale,
} from './types';

export function scaleQuantile<TRange>(
    domain: number[],
    range: TRange[]
): Scale<number, TRange> {
    const sortedDomain = domain.slice().sort((a, b) => a - b);
    const rangeLength = range.length;
    const quantileSize = sortedDomain.length / rangeLength;

    return createScale({
        domain,
        range,
        convert: value => {
            const index = sortedDomain.findIndex(d => d >= value);
            const position = index === -1 ? sortedDomain.length - 1 : index;
            const quantileIndex = Math.min(rangeLength - 1, Math.floor((position + 1) / quantileSize));

            return range[quantileIndex];
        },
        invert: value => {
            const rangeIndex = range.indexOf(value);

            if (rangeIndex === -1) {
                return sortedDomain[0];
            }

            const position = Math.floor(rangeIndex * quantileSize);

            return sortedDomain[position];
        },
        includes: createNumericIncludesMethod([sortedDomain[0], sortedDomain[sortedDomain.length - 1]]),
        ticks: () => arrayMapRange(rangeLength, i => {
            const position = Math.floor(i * quantileSize);
            return sortedDomain[position];
        }),
    });
}
