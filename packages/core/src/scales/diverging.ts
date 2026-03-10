import {
    createNumericIncludesMethod,
    createScale,
    getLinearScaleMethod,
    LinearScaleOptions,
} from './_base';

import {
    arrayMapRange,
} from '@ripl/utilities';

import type {
    Scale,
} from './types';

/** Options for a diverging scale, adding a midpoint to the base linear scale options. */
export interface DivergingScaleOptions extends LinearScaleOptions {
    midpoint?: number;
};

/** Creates a diverging scale that maps values below and above a midpoint to separate sub-ranges. */
export function scaleDiverging(
    domain: number[],
    range: number[],
    options?: DivergingScaleOptions
): Scale<number> {
    const {
        midpoint,
        ...scaleOptions
    } = options || {};

    const [
        domainMin,
        domainMax,
    ] = domain;

    const [
        rangeMin,
        rangeMax,
    ] = range;

    const mid = midpoint ?? (domainMin + domainMax) / 2;
    const rangeMid = (rangeMin + rangeMax) / 2;

    const lowerScale = getLinearScaleMethod([domainMin, mid], [rangeMin, rangeMid], scaleOptions);
    const upperScale = getLinearScaleMethod([mid, domainMax], [rangeMid, rangeMax], scaleOptions);

    const lowerInverse = getLinearScaleMethod([rangeMin, rangeMid], [domainMin, mid], scaleOptions);
    const upperInverse = getLinearScaleMethod([rangeMid, rangeMax], [mid, domainMax], scaleOptions);

    return createScale({
        domain,
        range,
        convert: value => value <= mid ? lowerScale(value) : upperScale(value),
        invert: value => value <= rangeMid ? lowerInverse(value) : upperInverse(value),
        includes: createNumericIncludesMethod(domain),
        ticks: (count: number = 10) => {
            const step = (domainMax - domainMin) / (count - 1);

            return arrayMapRange(count, i => {
                return domainMin + (step * i);
            });
        },
    });
}
