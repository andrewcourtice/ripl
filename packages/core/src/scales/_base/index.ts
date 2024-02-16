import {
    clamp as numberClamp,
} from '../../math';

import {
    interpolateNumber,
} from '../../interpolators';

import {
    numberNice,
} from '@ripl/utilities';

import type {
    Scale,
    ScaleMethod,
} from '../types';

export interface ScaleBindingOptions<TDomain, TRange> {
    readonly domain: TDomain[];
    readonly range: TRange[];
    convert: ScaleMethod<TDomain, TRange>;
    invert: ScaleMethod<TRange, TDomain>;
    includes?(value: TDomain): boolean;
    ticks?(count?: number): TDomain[];
}

export interface LinearScaleOptions {
    clamp?: boolean;
    padToTicks?: boolean | number;
}

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