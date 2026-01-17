import {
    createScale,
} from './_base';

import {
    max,
} from '../math';

import type {
    Scale,
} from './types';

export interface BandScale<TDomain> extends Scale<TDomain> {
    bandwidth: number;
    step: number;
}

export type BandScaleOptions = {
    innerPadding?: number;
    outerPadding?: number;
    alignment?: number;
    round?: boolean;
};

export function scaleBand<TDomain>(
    domain: TDomain[],
    range: number[],
    options?: BandScaleOptions
): BandScale<TDomain> {
    const {
        innerPadding = 0,
        outerPadding = 0,
        alignment = 0.5,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        round,
    } = options || {};

    const [
        rangeMin,
        rangeMax,
    ] = range;

    const rangeLength = rangeMax - rangeMin;
    const domainLength = domain.length - innerPadding;
    const step = rangeLength / max(1, domainLength + outerPadding * 2);
    const bandwidth = step * (1 - innerPadding);
    const adjustedMin = rangeMin + (rangeLength - step * domainLength) * alignment;

    const scale = createScale({
        domain,
        range,
        convert: value => adjustedMin + (domain.indexOf(value) * step),
        invert: value => domain[Math.floor(value / step)],
    }) as BandScale<TDomain>;

    scale.bandwidth = bandwidth;
    scale.step = step;

    return scale;
}
