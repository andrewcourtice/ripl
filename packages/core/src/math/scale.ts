import {
    clamp,
} from './number';

import {
    interpolateNumber,
} from './interpolate';

export type ScaleMethod<TInput = number, TOutput = number> = (value: TInput) => TOutput;

export interface Scale<TDomain = number, TRange = number> {
    (value: TDomain): TRange;
    domain: TDomain[];
    range: TRange[];
    inverse: ScaleMethod<TRange, TDomain>;
}

export function bindScale<TDomain = number, TRange = number>(domain: TDomain[], range: TRange[], method: ScaleMethod<TDomain, TRange>): Scale<TDomain, TRange> {
    const output = (value: TDomain) => method(value);

    output.domain = domain;
    output.range = range;
    output.inverse = () => {};

    return output;
}

function getLinearScaleMethod(domain: number[], range: number[], clampOutput?: boolean): ScaleMethod {
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

export function continuous(
    domain: number[],
    range: number[],
    clampOutput?: boolean
): Scale<number> {
    const method = getLinearScaleMethod(domain, range, clampOutput);
    const scale = bindScale(domain, range, method);

    scale.inverse = getLinearScaleMethod(range, domain, clampOutput);

    return scale;
}

// export function logarithmic(
//     domain: number[],
//     range: number[],
//     base?: number = 10
// ): Scale<number> {

// }

export function discrete<TDomain>(
    domain: TDomain[],
    range: number[]
): Scale<TDomain> {
    const [
        rangeMin,
        rangeMax,
    ] = range;

    const rangeLength = rangeMax - rangeMin;
    const domainLength = domain.length - 1;
    const ratio = rangeLength / domainLength;

    const scale = bindScale(domain, range, value => {
        return rangeMin + (domain.indexOf(value) * ratio);
    });

    scale.inverse = value => {
        return domain[Math.floor(value / rangeLength)];
    };

    return scale;
}