import {
    interpolateNumber,
} from '../../interpolators';

import {
    arrayMapRange,
    numberClamp,
    numberNice,
} from '@ripl/utilities';

import type {
    Scale,
    ScaleMethod,
} from '../types';

/** Low-level options for constructing a scale, providing conversion, inversion, inclusion, and tick generation callbacks. */
export interface ScaleBindingOptions<TDomain, TRange> {
    /** The input domain the scale maps from. */
    readonly domain: TDomain[];
    /** The output range the scale maps to. */
    readonly range: TRange[];
    /** Maps a domain value to its corresponding range value. */
    convert: ScaleMethod<TDomain, TRange>;
    /** Maps a range value back to its corresponding domain value. */
    invert: ScaleMethod<TRange, TDomain>;
    /** Tests whether a value falls within the domain. Defaults to a strict `domain.includes` check. */
    includes?(value: TDomain): boolean;
    /** Generates tick values across the domain. Defaults to returning a copy of the domain. */
    ticks?(count?: number): TDomain[];
}

/** Options shared by linear-based scales (continuous, logarithmic, power, etc.). */
export interface LinearScaleOptions {
    /** Constrains mapped values to the range bounds, so out-of-domain inputs never overshoot. */
    clamp?: boolean;
    /** Expands the mapping domain to tick-aligned boundaries. `true` uses ~10 ticks; a number sets the target tick count. */
    padToTicks?: boolean | number;
    /**
     * Expand the domain to round, tick-aligned boundaries at construction. `true` uses ~10 ticks; a
     * number sets the target tick count. This is a construction-time option by design; scales stay
     * plain callable objects with no chained `.nice()` method.
     */
    nice?: boolean | number;
}

/** Expands a numeric domain to "nice" tick-aligned boundaries and returns `[min, max, step]`. */
export function padDomain(domain: number[], count: number = 10) {
    let [
        min,
        max,
    ] = domain;

    const extent = max - min;
    const step = numberNice(extent / (count - 1));

    // A zero/non-finite step means nothing to round to; dividing by it yielded `NaN` tick labels.
    if (!step || !isFinite(step)) {
        return [
            min,
            max,
            step,
        ];
    }

    min = Math.min(min, Math.floor(min / step) * step);
    max = Math.max(max, Math.ceil(max / step) * step);

    return [
        min,
        max,
        step,
    ];
}

/** Resolves a `nice` option to a target tick count (defaults to 10 when `true`). */
export function resolveNiceCount(nice: boolean | number | undefined): number | undefined {
    if (!nice) {
        return undefined;
    }

    return nice === true ? 10 : nice;
}

/** Returns the domain expanded to round, tick-aligned `[min, max]` boundaries. */
export function niceDomain(domain: number[], count: number = 10): number[] {
    const [
        min,
        max,
    ] = padDomain(domain, count);

    return [
        min,
        max,
    ];
}

/**
 * Builds a value → first-index lookup over a categorical domain, so a scale converts in O(1)
 * instead of rescanning the domain per datum. First index wins, matching `Array.prototype.indexOf`.
 *
 * @param domain - The categorical domain to index.
 * @returns A function returning a value's index in the domain, or `-1` when it is absent.
 */
export function createDomainIndex<TDomain>(domain: TDomain[]): (value: TDomain) => number {
    const index = new Map<TDomain, number>();

    domain.forEach((value, position) => {
        if (!index.has(value)) {
            index.set(value, position);
        }
    });

    // `indexOf` compares with `===`, which never matches `NaN`; the map would, so exclude it.
    return value => (typeof value === 'number' && Number.isNaN(value) ? -1 : index.get(value) ?? -1);
}

/** Assembles a `Scale` object from explicit conversion, inversion, and tick functions. */
export function createScale<TDomain = number, TRange = number>(options: ScaleBindingOptions<TDomain, TRange>): Scale<TDomain, TRange> {
    const {
        domain,
        range,
        convert,
        invert,
        includes = value => domain.includes(value),
        ticks = () => domain.slice(),
    } = options;

    const scale = (value: TDomain) => convert(value);

    scale.domain = domain;
    scale.range = range;
    scale.inverse = invert;
    scale.ticks = ticks;
    scale.includes = includes;

    return scale;
}

/** Creates a linear mapping function from a numeric domain to a numeric range, with optional clamping and tick-padding. */
export function getLinearScaleMethod(domain: number[], range: number[], options?: LinearScaleOptions): ScaleMethod {
    const {
        clamp,
        padToTicks = false,
    } = options || {};

    const [
        domainMin,
        domainMax,
    ] = padToTicks
        ? padDomain(domain, +padToTicks)
        : domain;

    const [
        rangeMin,
        rangeMax,
    ] = range;

    const domainDelta = domainMax - domainMin;
    const interpolator = interpolateNumber(rangeMin, rangeMax);

    return (value: number) => {
        // `(value - min) / 0` is non-finite and rendered a stray mark, so collapse onto the range start.
        if (domainDelta === 0) {
            return rangeMin;
        }

        const position = (value - domainMin) / domainDelta;
        const result = interpolator(position);

        return clamp
            ? numberClamp(result, rangeMin, rangeMax)
            : result;
    };
}

/** Creates an `includes` predicate that tests whether a value falls within the numeric domain. */
export function createNumericIncludesMethod(domain: number[]) {
    const [
        min,
        max,
    ] = domain;

    return (value: number) => value >= min && value <= max;
}

/** Generates an array of evenly spaced, "nice" tick values across the domain. */
export function getLinearTicks(domain: number[], count: number = 10) {
    const [
        min,
        max,
        step,
    ] = padDomain(domain, count);

    if (!step || !isFinite(step) || min === max) {
        return [min];
    }

    const length = Math.floor((max - min) / step) + 1;

    return arrayMapRange(length, i => {
        return min + (step * i);
    });
}