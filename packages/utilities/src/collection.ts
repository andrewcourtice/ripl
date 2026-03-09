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

export type IterableObject = Record<PropertyKey, unknown>;
export type IterationDirection = 1 | -1;
export type CollectionIteratee<TValue, TResult = void> = (value: TValue, index: number) => TResult;
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

function iterateCollection<TValue>(input: Iterable<TValue>, iteratee: CollectionIteratee<TValue, typeof BREAK | void>): void {
    let index = 0;

    for (const entry of input) {
        const result = iteratee(entry, index);

        if (result === BREAK) {
            break;
        }

        index += 1;
    }
}

export function arrayDedupe<TValue>(input: TValue[]) {
    return Array.from(new Set(input));
}

export function arrayForEach<TValue>(input: TValue[], iteratee: CollectionIteratee<TValue>): void {
    iterateCollection(input, iteratee);
}

export function arrayMap<TValue, TResult>(input: TValue[], iteratee: CollectionIteratee<TValue, TResult>): TResult[] {
    const output = new Array<TResult>(input.length);

    iterateCollection(input, (value, index) => {
        output[index] = iteratee(value, index);
    });

    return output;
}

export function arrayMapRange<TResult>(length: number, iteratee: (index: number) => TResult): TResult[] {
    return arrayMap(Array.from({ length }), (_, index) => iteratee(index));
}

export function arrayFlatMap<TValue, TResult>(input: TValue[], iteratee: CollectionIteratee<TValue, TResult[]>): TResult[] {
    const output = [] as TResult[];

    iterateCollection(input, (value, index) => {
        output.push(...iteratee(value, index));
    });

    return output;
}

export function arrayFilter<TValue>(input: TValue[], predicate: CollectionIteratee<TValue, boolean>): TValue[] {
    const output = [] as TValue[];

    iterateCollection(input, (value, index) => {
        if (predicate(value, index)) {
            output.push(value);
        }
    });

    return output;
}

export function arrayReduce<TValue, TResult>(input: TValue[], reducer: ArrayReducer<TValue, TResult>, initial: TResult): TResult {
    let output = initial;

    iterateCollection(input, (value, index) => {
        output = reducer(output, value, index);
    });

    return output;
}

export function arrayFind<TValue>(input: TValue[], predicate: CollectionIteratee<TValue, boolean>): TValue | undefined {
    let output: TValue | undefined;

    iterateCollection(input, (value, index) => {
        if (predicate(value, index)) {
            output = value;
            return BREAK;
        }
    });

    return output;
}

export function arrayJoin<TLeft, TRight>(leftInput: TLeft[], rightInput: TRight[], predicate: ArrayJoinPredicate<TLeft, TRight>): ArrayJoin<TLeft, TRight> {
    const left = new Set(leftInput);
    const right = new Set(rightInput);
    const inner = new Set<[left: TLeft, right: TRight]>();

    const compare = (typeIsFunction(predicate)
        ? predicate
        : (left: TLeft, right: TRight) => predicateKey(left as Record<PropertyKey, unknown>, right as Record<PropertyKey, unknown>, predicate as PropertyKey)
    ) as Predicate<TLeft, TRight>;

    iterateCollection(leftInput, valLeft => {
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

    iterateCollection(input, value => {
        const group = groupIdentity(value);
        output[group] = (output[group] || []).concat(value);
    });

    return output;
}

function resolveArrayCompare<TLeft, TRight>(predicate?: ArrayJoinPredicate<TLeft, TRight>): Predicate<TLeft, TRight> {
    if (typeIsNil(predicate)) {
        return (left, right) => (left as unknown) === (right as unknown);
    }

    if (typeIsFunction(predicate)) {
        return predicate;
    }

    return (left, right) => predicateKey(left as Record<PropertyKey, unknown>, right as Record<PropertyKey, unknown>, predicate as PropertyKey);
}

function arrayFilterByMatch<TLeft, TRight>(leftInput: TLeft[], rightInput: TRight[], predicate: ArrayJoinPredicate<TLeft, TRight> | undefined, includeMatches: boolean): TLeft[] {
    const output = [] as TLeft[];
    const compare = resolveArrayCompare(predicate);

    iterateCollection(leftInput, valLeft => {
        const found = arrayFind(rightInput, valRight => compare(valLeft, valRight));
        const shouldInclude = includeMatches ? !typeIsNil(found) : typeIsNil(found);

        if (shouldInclude) {
            output.push(valLeft);
        }
    });

    return output;
}

export function arrayIntersection<TLeft, TRight = TLeft>(leftInput: TLeft[], rightInput: TRight[], predicate?: ArrayJoinPredicate<TLeft, TRight>): TLeft[] {
    return arrayFilterByMatch(leftInput, rightInput, predicate, true);
}

export function arrayDifference<TLeft, TRight = TLeft>(leftInput: TLeft[], rightInput: TRight[], predicate?: ArrayJoinPredicate<TLeft, TRight>): TLeft[] {
    return arrayFilterByMatch(leftInput, rightInput, predicate, false);
}

export function objectForEach<TSource extends IterableObject>(input: TSource, iteratee: ObjectIteratee<keyof TSource, TSource[keyof TSource]>): void {
    for (const key in input) {
        iteratee(key, input[key]);
    }
}

export function objectMap<TSource extends IterableObject, TResult extends Record<keyof TSource, unknown> = Record<keyof TSource, unknown>>(input: TSource, iteratee: ObjectIteratee<Extract<keyof TSource, string>, TSource[keyof TSource], unknown>): TResult {
    const output = {} as Record<string, unknown>;

    for (const key in input) {
        output[key] = iteratee(key, input[key]);
    }

    return output as TResult;
}

export function objectReduce<TSource extends IterableObject, TResult>(input: TSource, reducer: ObjectReducer<keyof TSource, TSource[keyof TSource], TResult>, initial: TResult): TResult {
    let output = initial;

    for (const key in input) {
        output = reducer(output, key, input[key]);
    }

    return output;
}

export function setForEach<TValue>(input: Set<TValue>, iteratee: CollectionIteratee<TValue>): void {
    iterateCollection(input, iteratee);
}

export function setMap<TValue, TResult>(input: Set<TValue>, iteratee: CollectionIteratee<TValue, TResult>): Set<TResult> {
    const output = new Set<TResult>();

    iterateCollection(input, (value, index) => {
        output.add(iteratee(value, index));
    });

    return output;
}

export function setFilter<TValue>(input: Set<TValue>, predicate: CollectionIteratee<TValue, boolean>): Set<TValue> {
    const output = new Set<TValue>();

    iterateCollection(input, (value, index) => {
        if (predicate(value, index)) {
            output.add(value);
        }
    });

    return output;
}

export function setFind<TValue>(input: Set<TValue>, predicate: CollectionIteratee<TValue, boolean>): TValue | undefined {
    let output: TValue | undefined;

    iterateCollection(input, (value, index) => {
        if (predicate(value, index)) {
            output = value;
            return BREAK;
        }
    });

    return output;
}

export function setFlatMap<TValue, TResult>(input: Set<TValue>, iteratee: CollectionIteratee<TValue, TResult[]>): Set<TResult> {
    const output = [] as TResult[];

    iterateCollection(input, (value, index) => {
        output.push(...iteratee(value, index));
    });

    return new Set(output);
}
