import {
    createNumericIncludesMethod,
    createScale,
    LinearScaleOptions,
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

export type LogarithmicScaleOptions = LinearScaleOptions & {
    base?: number;
}

function getLogScaleMethod(domain: number[], range: number[], base: number, options?: LinearScaleOptions): ScaleMethod {
    const {
        clamp,
    } = options || {};

    const [
        domainMin,
        domainMax,
    ] = domain;

    const [
        rangeMin,
        rangeMax,
    ] = range;

    const logBase = Math.log(base);
    const logDomainMin = Math.log(domainMin) / logBase;
    const logDomainMax = Math.log(domainMax) / logBase;
    const logDomainDelta = logDomainMax - logDomainMin;
    const interpolator = interpolateNumber(rangeMin, rangeMax);

    return (value: number) => {
        const logValue = Math.log(value) / logBase;
        const position = (logValue - logDomainMin) / logDomainDelta;
        const result = interpolator(position);

        return clamp
            ? numberClamp(result, rangeMin, rangeMax)
            : result;
    };
}

function getLogInverseMethod(domain: number[], range: number[], base: number, options?: LinearScaleOptions): ScaleMethod {
    const {
        clamp,
    } = options || {};

    const [
        domainMin,
        domainMax,
    ] = domain;

    const [
        rangeMin,
        rangeMax,
    ] = range;

    const logBase = Math.log(base);
    const logDomainMin = Math.log(domainMin) / logBase;
    const logDomainMax = Math.log(domainMax) / logBase;
    const rangeDelta = rangeMax - rangeMin;
    const interpolator = interpolateNumber(logDomainMin, logDomainMax);

    return (value: number) => {
        const position = (value - rangeMin) / rangeDelta;
        const logValue = interpolator(position);
        const result = Math.pow(base, logValue);

        return clamp
            ? numberClamp(result, domainMin, domainMax)
            : result;
    };
}

export function scaleLogarithmic(
    domain: number[],
    range: number[],
    options?: LogarithmicScaleOptions
): Scale<number> {
    const {
        base = 10,
        ...scaleOptions
    } = options || {};

    const convert = getLogScaleMethod(domain, range, base, scaleOptions);
    const invert = getLogInverseMethod(domain, range, base, scaleOptions);

    return createScale({
        domain,
        range,
        convert,
        invert,
        includes: createNumericIncludesMethod(domain),
        ticks(count: number = 10) {
            const [
                min,
                max,
            ] = domain;

            const logBase = Math.log(base);
            const logMin = Math.log(min) / logBase;
            const logMax = Math.log(max) / logBase;
            const step = (logMax - logMin) / (count - 1);
            const ticks = [];

            for (let i = 0; i < count; i++) {
                ticks.push(Math.pow(base, logMin + (step * i)));
            }

            return ticks;
        },
    });
}

export function scaleLog(
    domain: number[],
    range: number[],
    options?: LinearScaleOptions
): Scale<number> {
    return scaleLogarithmic(domain, range, {
        ...options,
        base: 10,
    });
}
