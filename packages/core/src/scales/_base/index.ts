import {
    clamp as numberClamp,
} from '../../math';

import {
    interpolateNumber,
} from '../../interpolators';

import {
    arrayMapRange,
    numberNice,
} from '@ripl/utilities';

import type {
    Scale,
    ScaleMethod,
} from '../types';

/** Low-level options for constructing a scale, providing conversion, inversion, inclusion, and tick generation callbacks. */
export interface ScaleBindingOptions<TDomain, TRange> {
    readonly domain: TDomain[];
    readonly range: TRange[];
    convert: ScaleMethod<TDomain, TRange>;
    invert: ScaleMethod<TRange, TDomain>;
    includes?(value: TDomain): boolean;
    ticks?(count?: number): TDomain[];
}

/** Options shared by linear-based scales (continuous, logarithmic, power, etc.). */
export interface LinearScaleOptions {
    clamp?: boolean;
    padToTicks?: boolean | number;
}

/** Expands a numeric domain to "nice" tick-aligned boundaries and returns `[min, max, step]`. */
export function padDomain(domain: number[], count: number = 10) {
    let [
        min,
        max,
    ] = domain;

    const extent = max - min;
    const step = numberNice(extent / (count - 1));

    min = Math.min(min, Math.floor(min / step) * step);
    max = Math.max(max, Math.ceil(max / step) * step);

    return [
        min,
        max,
        step,
    ];
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