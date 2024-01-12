import {
    clamp,
} from '../../math';

import {
    interpolateNumber,
} from '../../interpolators';

import {
    Scale,
    ScaleMethod,
} from '../types';

export interface ScaleBindingOptions<TDomain, TRange> {
    readonly domain: TDomain[];
    readonly range: TRange[];
    convert: ScaleMethod<TDomain, TRange>;
    invert: ScaleMethod<TRange, TDomain>;
}

export function createScale<TDomain = number, TRange = number>(options: ScaleBindingOptions<TDomain, TRange>): Scale<TDomain, TRange> {
    const {
        domain,
        range,
        convert,
        invert,
    } = options;

    const scale = (value: TDomain) => convert(value);

    scale.domain = domain;
    scale.range = range;
    scale.inverse = invert;

    return scale;
}

export function getLinearScaleMethod(domain: number[], range: number[], clampOutput?: boolean): ScaleMethod {
    const [
        domainMin,
        domainMax,
    ] = domain;

    const [
        rangeMin,
        rangeMax,
    ] = range;

    const domainDelta = domainMax - domainMin;
    const interpolator = interpolateNumber(rangeMin, rangeMax);

    return (value: number) => {
        const position = (value - domainMin) / domainDelta;
        const result = interpolator(position);

        return clampOutput
            ? clamp(result, rangeMin, rangeMax)
            : result;
    };
}