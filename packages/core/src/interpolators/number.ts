import type {
    Interpolator,
} from './types';

export function interpolateNumber(valueA: number, valueB: number): Interpolator {
    const valueDelta = valueB - valueA;
    return position => valueA + valueDelta * position;
}