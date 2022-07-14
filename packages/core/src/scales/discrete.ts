import {
    bindScale,
} from './_base';

import type {
    Scale,
} from './types';

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

    const scale = bindScale(domain, range, value => {
        return rangeMin + (domain.indexOf(value) * ratio);
    });

    scale.inverse = value => {
        return domain[Math.floor(value / rangeLength)];
    };

    return scale;
}