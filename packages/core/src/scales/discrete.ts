import {
    createScale,
} from './_base';

import type {
    Scale,
} from './types';

/** Creates a discrete (ordinal) scale that maps domain values to corresponding range values by index. */
export function scaleDiscrete<TDomain>(
    domain: TDomain[],
    range: number[]
): Scale<TDomain> {
    const [
        rangeMin,
        rangeMax,
    ] = range;

    const rangeLength = rangeMax - rangeMin;
    const domainLength = domain.length - 1;
    const ratio = rangeLength / domainLength;

    return createScale({
        domain,
        range,
        convert: value => rangeMin + (domain.indexOf(value) * ratio),
        invert: value => domain[Math.floor(value / rangeLength)],
    });
}