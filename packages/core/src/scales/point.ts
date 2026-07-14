import {
    clamp,
} from '../math';

import {
    createScale,
} from './_base';

import type {
    Scale,
} from './types';

/** Options for a point scale, controlling outer padding and alignment within the range. */
export interface PointScaleOptions {
    /** Space before the first and after the last point, as a fraction of the step. */
    padding?: number;
    /** Where to place the points within any slack range, 0 (start) to 1 (end). */
    alignment?: number;
}

/** A point scale that positions discrete domain values at evenly spaced points, exposing the step. */
export interface PointScale<TDomain = string> extends Scale<TDomain, number> {
    /** The distance between adjacent points, in range units. */
    step: number;
}

/**
 * Creates a point scale that maps discrete domain values to evenly spaced positions across the range
 * (the categorical analogue of a continuous axis — points, not bands). With zero padding the first
 * and last values sit exactly on the range endpoints. `inverse` returns the nearest domain value.
 */
export function scalePoint<TDomain = string>(
    domain: TDomain[],
    range: number[],
    options?: PointScaleOptions
): PointScale<TDomain> {
    const {
        padding = 0,
        alignment = 0.5,
    } = options || {};

    const [
        rangeMin,
        rangeMax,
    ] = range;

    const count = domain.length;
    const reach = rangeMax - rangeMin;
    const step = reach / Math.max(1, count - 1 + padding * 2);
    const start = rangeMin + (reach - step * (count - 1)) * alignment;

    const positions = new Map<TDomain, number>();

    domain.forEach((value, index) => {
        positions.set(value, start + step * index);
    });

    const scale = createScale({
        domain,
        range,
        convert: value => positions.get(value) ?? NaN,
        invert: value => {
            const index = clamp(Math.round((value - start) / step), 0, Math.max(0, count - 1));

            return domain[index];
        },
        includes: value => positions.has(value),
        ticks: () => domain.slice(),
    }) as PointScale<TDomain>;

    scale.step = step;

    return scale;
}
