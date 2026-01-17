import {
    predicateKey,
} from './predicate';

import {
    typeIsFunction,
    typeIsNil,
} from './type';

import type {
    Indexer,
    Predicate,
} from './types';

export type IterableObject = Record<PropertyKey, any>;
export type IterationDirection = 1 | -1;
export type ArrayIteratee<TValue, TResult = void> = (value: TValue, index: number) => TResult;
export type ArrayReducer<TValue, TResult = void> = (accumulator: TResult, value: TValue, index: number) => TResult;
export type ObjectIteratee<TKey, TValue, TResult = void> = (key: TKey, value: TValue) => TResult;
export type ObjectReducer<TKey, TValue, TResult = void> = (accumulator: TResult, key: TKey, value: TValue) => TResult;
export type SetIteratee<TValue, TResult = void> = (value: TValue) => TResult;

export type ArrayGroupIdentity<TValue> = keyof TValue | Indexer<TValue>;
export type ArrayJoinPredicate<TLeft, TRight> = keyof (TLeft & TRight) | Predicate<TLeft, TRight>;

export interface ArrayJoin<TLeft, TRight> {
    left: TLeft[];
    inner: [left: TLeft, right: TRight][];
    right: TRight[];
}

const BREAK = Symbol('break');

function iterateArray<TValue>(input: TValue[], iteratee: ArrayIteratee<TValue, typeof BREAK | void>, direction: IterationDirection = 1): void {
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

export function arrayDedupe<TValue>(input: TValue[]) {
    return Array.from(new Set(input));
}

export function arrayForEach<TValue>(input: TValue[], iteratee: ArrayIteratee<TValue>, direction: IterationDirection = 1): void {
    iterateArray(input, iteratee, direction);
}

export function arrayMap<TValue, TResult>(input: TValue[], iteratee: ArrayIteratee<TValue, TResult>, direction: IterationDirection = 1): TResult[] {
    const output = new Array<TResult>(input.length);

    iterateArray(input, (value, index) => {
        output[index] = iteratee(value, index);
    }, direction);

    return output;
}

export function arrayMapRange<TResult>(length: number, iteratee: (index: number) => TResult): TResult[] {
    return arrayMap(Array.from({ length }), (_, index) => iteratee(index));
}

export function arrayFlatMap<TValue, TResult>(input: TValue[], iteratee: ArrayIteratee<TValue, TResult[]>, direction: IterationDirection = 1): TResult[] {
    const output = [] as TResult[];

    iterateArray(input, (value, index) => {
        output.push(...iteratee(value, index));
    }, direction);

    return output;
}

export function arrayFilter<TValue>(input: TValue[], predicate: ArrayIteratee<TValue, boolean>): TValue[] {
    const output = [] as TValue[];

    iterateArray(input, (value, index) => {
        if (predicate(value, index)) {
            output.push(value);
        }
    });

    return output;
}

export function arrayReduce<TValue, TResult>(input: TValue[], reducer: ArrayReducer<TValue, TResult>, initial: TResult, direction: IterationDirection = 1): TResult {
    let output = initial;

    iterateArray(input, (value, index) => {
        output = reducer(output, value, index);
    }, direction);

    return output;
}

export function arrayFind<TValue>(input: TValue[], predicate: ArrayIteratee<TValue, boolean>, direction: IterationDirection = 1): TValue | undefined {
    let output: TValue | undefined;

    iterateArray(input, (value, index) => {
        if (predicate(value, index)) {
            output = value;
            return BREAK;
        }
    }, direction);

    return output;
}

export function arrayJoin<TLeft, TRight>(leftInput: TLeft[], rightInput: TRight[], predicate: ArrayJoinPredicate<TLeft, TRight>): ArrayJoin<TLeft, TRight> {
    const left = new Set(leftInput);
    const right = new Set(rightInput);
    const inner = new Set<[left: TLeft, right: TRight]>();

    const compare = (typeIsFunction(predicate)
        ? predicate
        : (left, right) => predicateKey(left, right, predicate)
    ) as Predicate<TLeft, TRight>;

    iterateArray(leftInput, valLeft => {
        const valRight = arrayFind(rightInput, valRight => compare(valLeft, valRight));

        if (!typeIsNil(valRight)) {
            inner.add([valLeft, valRight]);
            left.delete(valLeft);
            right.delete(valRight);
        }
    });

    return {
        left: Array.from(left),
        inner: Array.from(inner),
        right: Array.from(right),
    };
}

export function arrayGroup<TValue>(input: TValue[], identity: ArrayGroupIdentity<TValue>): Record<PropertyKey, TValue[]> {
    const output = {} as Record<PropertyKey, TValue[]>;

    const groupIdentity = (typeIsFunction(identity)
        ? identity
        : value => value[identity]
    ) as Indexer<TValue>;

    iterateArray(input, value => {
        const group = groupIdentity(value);
        output[group] = (output[group] || []).concat(value);
    });

    return output;
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

export function objectReduce<TSource extends IterableObject, TResult>(input: TSource, reducer: ObjectReducer<keyof TSource, TSource[keyof TSource], TResult>, initial: TResult): TResult {
    let output = initial;

    for (const key in input) {
        output = reducer(output, key, input[key]);
    }

    return output;
}

export function setForEach<TValue>(input: Set<TValue>, iteratee: ArrayIteratee<TValue>, direction: IterationDirection = 1): void {
    arrayForEach(Array.from(input), iteratee, direction);
}

export function setMap<TValue, TResult>(input: Set<TValue>, iteratee: ArrayIteratee<TValue, TResult>, direction: IterationDirection = 1): Set<TResult> {
    return new Set(arrayMap(Array.from(input), iteratee, direction));
}

export function setFind<TValue>(input: Set<TValue>, predicate: ArrayIteratee<TValue, boolean>, direction: IterationDirection = 1): TValue | undefined {
    return arrayFind(Array.from(input), predicate, direction);
}

export function setFlatMap<TValue, TResult>(input: Set<TValue>, iteratee: ArrayIteratee<TValue, TResult[]>, direction: IterationDirection = 1): Set<TResult> {
    return new Set(arrayFlatMap(Array.from(input), iteratee, direction));
}
