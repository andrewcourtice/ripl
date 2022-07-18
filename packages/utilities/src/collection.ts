export type IterableObject = Record<PropertyKey, any>;
export type ArrayIteratee<TValue, TResult = void> = (value: TValue, index: number) => TResult;
export type ObjectIteratee<TKey, TValue, TResult = void> = (key: TKey, value: TValue) => TResult;
export type SetIteratee<TValue, TResult = void> = (value: TValue) => TResult;

const BREAK = Symbol('break');

function iterateArray<TValue>(input: TValue[], iteratee: ArrayIteratee<TValue, typeof BREAK | void>, direction: 1 | -1 = 1): void {
    const maxIndex = input.length - 1;
    const endIndex = direction === 1 ? maxIndex : 0;
    let index = direction === 1 ? 0 : maxIndex;

    for (index; index * direction <= endIndex; index += direction) {
        const result = iteratee(input[index], index);

        if (result === BREAK) {
            break;
        }
    }
}

export function arrayForEach<TValue>(input: TValue[], iteratee: ArrayIteratee<TValue>, direction: 1 | -1 = 1): void {
    iterateArray(input, iteratee, direction);
}

export function arrayMap<TValue, TResult>(input: TValue[], iteratee: ArrayIteratee<TValue, TResult>, direction: 1 | -1 = 1): TResult[] {
    const output = new Array<TResult>(length);

    iterateArray(input, (value, index) => {
        output[index] = iteratee(value, index);
    }, direction);

    return output;
}

export function arrayFind<TValue>(input: TValue[], predicate: ArrayIteratee<TValue, boolean>, direction: 1 | -1 = 1): TValue | undefined {
    let match: TValue | undefined;

    iterateArray(input, (value, index) => {
        if (predicate(value, index)) {
            match = value;
            return BREAK;
        }
    }, direction);

    return match;
}

export function objectForEach<TSource extends IterableObject>(input: TSource, iteratee: ObjectIteratee<keyof TSource, TSource[keyof TSource]>): void {
    for (const key in input) {
        iteratee(key, input[key]);
    }
}

export function objectMap<TSource extends IterableObject, TResult extends Record<keyof TSource, any>>(input: TSource, iteratee: ObjectIteratee<keyof TSource, TSource[keyof TSource], any>): TResult {
    const output = {} as TResult;

    for (const key in input) {
        output[key] = iteratee(key, input[key]);
    }

    return output;
}

export function setForEach<TValue>(input: Set<TValue>, iteratee: ArrayIteratee<TValue>, direction: 1 | -1 = 1): void {
    arrayForEach(Array.from(input), iteratee, direction);
}

export function setMap<TValue, TResult>(input: Set<TValue>, iteratee: ArrayIteratee<TValue, TResult>, direction: 1 | -1 = 1): Set<TResult> {
    return new Set(arrayMap(Array.from(input), iteratee, direction));
}

export function setFind<TValue>(input: Set<TValue>, predicate: ArrayIteratee<TValue, boolean>, direction: 1 | -1 = 1): TValue | undefined {
    return arrayFind(Array.from(input), predicate, direction);
}