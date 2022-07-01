import {
    clamp,
} from './number';

export type ScaleCalculator<TValue> = (value: TValue) => number;
export interface Scale<TDomain = number> {
    (value: TDomain, clamp?: boolean): number;
    domain: TDomain[];
    range: number[];
}

export function scale<TDomain = number>(domain: TDomain[], range: number[], calculator: ScaleCalculator<TDomain>): Scale<TDomain> {
    const [
        min,
        max,
    ] = range;

    const output = (value: TDomain, clampOutput?: boolean) => {
        let result = calculator(value);

        if (clampOutput) {
            result = clamp(result, min, max);
        }

        return result;
    };

    output.domain = domain;
    output.range = range;

    return output;
}


export function continuous(
    domain: number[],
    range: number[]
): Scale<number> {
    const [
        domainMin,
        domainMax,
    ] = domain;

    const [
        rangeMin,
        rangeMax,
    ] = range;

    const domainLength = domainMax - domainMin;
    const rangeLength = rangeMax - rangeMin;

    return scale(domain, range, value => {
        return (value - domainMin) * rangeLength / domainLength + rangeMin;
    });
}

export function discrete<TDomain>(
    domain: TDomain[],
    range: number[]
): Scale<TDomain> {
    const [
        rangeMin,
        rangeMax,
    ] = range;

    const rangeLength = rangeMax - rangeMin;
    const domainLength = domain.length;
    const step = rangeLength / domainLength;

    return scale(domain, range, value => {
        return rangeMin + (domain.indexOf(value) * step);
    });
}