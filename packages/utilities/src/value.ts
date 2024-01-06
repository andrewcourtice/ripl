import {
    OneOrMore,
} from './types';

export function valueOneOrMore<TValue>(value: OneOrMore<TValue>): TValue[] {
    return ([] as TValue[]).concat(value);
}