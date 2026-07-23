import type {
    OneOrMore,
} from './types';

/** Normalizes a single value or array into a guaranteed array. */
export function valueOneOrMore<TValue>(value: OneOrMore<TValue>): TValue[] {
    return ([] as TValue[]).concat(value);
}