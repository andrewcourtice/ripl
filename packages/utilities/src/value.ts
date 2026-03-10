import {
    OneOrMore,
} from './types';

/** Normalises a single value or array into a guaranteed array. */
export function valueOneOrMore<TValue>(value: OneOrMore<TValue>): TValue[] {
    return ([] as TValue[]).concat(value);
}