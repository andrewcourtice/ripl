import {
    getLinearTicks,
    createNumericIncludesMethod,
    createScale,
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

export type PowerScaleOptions = LinearScaleOptions & {
    exponent?: number;
}

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
        const position = Math.pow(normalized, exponent);
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
        const position = Math.pow(normalized, 1 / exponent);
        const result = interpolator(position);

        return clamp
            ? numberClamp(result, domainMin, domainMax)
            : result;
    };
}

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

export function scaleSqrt(
    domain: number[],
    range: number[],
    options?: LinearScaleOptions
): Scale<number> {
    return scalePower(domain, range, {
        ...options,
        exponent: 0.5,
    });
}
