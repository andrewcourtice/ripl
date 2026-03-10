import {
    createNumericIncludesMethod,
    createScale,
    getLinearTicks,
    LinearScaleOptions,
    padDomain,
} from './_base';

import {
    clamp as numberClamp,
} from '../math';

import {
    interpolateNumber,
} from '../interpolators';

import type {
    Scale,
    ScaleMethod,
} from './types';

/** Options for a power scale, adding a configurable exponent to the base linear scale options. */
export interface PowerScaleOptions extends LinearScaleOptions {
    exponent?: number;
};

function getPowerScaleMethod(domain: number[], range: number[], exponent: number, options?: LinearScaleOptions): ScaleMethod {
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
        const normalized = (value - domainMin) / domainDelta;
        const position = normalized ** exponent;
        const result = interpolator(position);

        return clamp
            ? numberClamp(result, rangeMin, rangeMax)
            : result;
    };
}

function getPowerInverseMethod(domain: number[], range: number[], exponent: number, options?: LinearScaleOptions): ScaleMethod {
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

    const rangeDelta = rangeMax - rangeMin;
    const interpolator = interpolateNumber(domainMin, domainMax);

    return (value: number) => {
        const normalized = (value - rangeMin) / rangeDelta;
        const position = normalized ** (1 / exponent);
        const result = interpolator(position);

        return clamp
            ? numberClamp(result, domainMin, domainMax)
            : result;
    };
}

/** Creates a power scale that maps a numeric domain to a range using an exponential transformation. */
export function scalePower(
    domain: number[],
    range: number[],
    options?: PowerScaleOptions
): Scale<number> {
    const {
        exponent = 1,
        ...scaleOptions
    } = options || {};

    const convert = getPowerScaleMethod(domain, range, exponent, scaleOptions);
    const invert = getPowerInverseMethod(domain, range, exponent, scaleOptions);

    return createScale({
        domain,
        range,
        convert,
        invert,
        includes: createNumericIncludesMethod(domain),
        ticks: (count: number = 10) => getLinearTicks(domain, count),
    });
}

/** Shortcut for a power scale with exponent 0.5 (square root). */
export const scaleSqrt = (
    domain: number[],
    range: number[],
    options?: LinearScaleOptions
): Scale<number> => {
    return scalePower(domain, range, {
        ...options,
        exponent: 0.5,
    });
};
