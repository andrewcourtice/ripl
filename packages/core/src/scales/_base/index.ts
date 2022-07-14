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

export function bindScale<TDomain = number, TRange = number>(domain: TDomain[], range: TRange[], method: ScaleMethod<TDomain, TRange>): Scale<TDomain, TRange> {
    const output = (value: TDomain) => method(value);

    output.domain = domain;
    output.range = range;
    output.inverse = () => {};

    return output;
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