import {
    createNumericIncludesMethod,
    createScale,
} from './_base';

import type {
    Scale,
} from './types';

export function scaleQuantize<TRange>(
    domain: number[],
    range: TRange[]
): Scale<number, TRange> {
    const [
        domainMin,
        domainMax,
    ] = domain;

    const domainLength = domainMax - domainMin;
    const rangeLength = range.length;
    const step = domainLength / rangeLength;

    return createScale({
        domain,
        range,
        convert: value => {
            const position = (value - domainMin) / domainLength;
            const index = Math.min(rangeLength - 1, Math.max(0, Math.floor(position * rangeLength)));
            return range[index];
        },
        invert: value => {
            const rangeIndex = range.indexOf(value);
            if (rangeIndex === -1) {
                return domainMin;
            }
            return domainMin + (rangeIndex * step);
        },
        includes: createNumericIncludesMethod(domain),
        ticks() {
            const ticks = [];
            for (let i = 0; i < rangeLength; i++) {
                ticks.push(domainMin + (i * step));
            }
            return ticks;
        },
    });
}
