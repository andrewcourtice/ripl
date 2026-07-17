import {
    createScale,
} from './_base';

import type {
    Scale,
} from './types';

/** A band scale that divides a continuous range into uniform bands for categorical data, exposing bandwidth and step. */
export interface BandScale<TDomain = string> extends Scale<TDomain, number> {
    /** The width of each band, in range units, after inner padding is removed. */
    bandwidth: number;
    /** The distance between the start of adjacent bands, in range units (bandwidth plus inner padding). */
    step: number;
}

/** Options for a band scale, controlling padding between and around bands, alignment, and rounding. */
export type BandScaleOptions = {
    /** Padding between adjacent bands, as a fraction of the step (0–1). */
    innerPadding?: number;
    /** Padding before the first and after the last band, as a fraction of the step. */
    outerPadding?: number;
    /** Where to place the bands within any slack range, 0 (start) to 1 (end). */
    alignment?: number;
    /** Whether to round band positions and widths to whole pixels for crisp edges. */
    round?: boolean;
};

/** Creates a band scale that maps discrete domain values to evenly spaced bands within the range. */
export function scaleBand<TDomain = string>(
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
    const step = rangeLength / Math.max(1, domainLength + outerPadding * 2);
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
