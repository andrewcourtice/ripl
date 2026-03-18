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

/** An object whose values are unknown, suitable for generic iteration. */
export type IterableObject = Record<PropertyKey, unknown>;

/** Callback invoked for each item in a collection, receiving the value and its index. */
export type CollectionIteratee<TValue, TResult = void> = (value: TValue, index: number) => TResult;

/** Callback invoked for each entry in an object, receiving the key and value. */
export type ObjectIteratee<TKey, TValue, TResult = void> = (key: TKey, value: TValue) => TResult;

/** Reducer callback for folding over object entries into an accumulated result. */
export type ObjectReducer<TKey, TValue, TResult = void> = (accumulator: TResult, key: TKey, value: TValue) => TResult;

/** A property key or indexer function used to derive group identity from array items. */
export type ArrayGroupIdentity<TValue> = keyof TValue | Indexer<TValue>;

/** A shared key or predicate function used to match items between two arrays in a join. */
export type ArrayJoinPredicate<TLeft, TRight> = keyof (TLeft & TRight) | Predicate<TLeft, TRight>;

/** Result of an array join containing unmatched left items, matched pairs, and unmatched right items. */
export interface ArrayJoin<TLeft, TRight> {
    left: TLeft[];
    inner: [left: TLeft, right: TRight][];
    right: TRight[];
}

/** Creates an array of the given length by mapping each index through the iteratee. */
export function arrayMapRange<TResult>(length: number, iteratee: (index: number) => TResult): TResult[] {
    const output = new Array<TResult>(length);

    for (let i = 0; i < length; i++) {
        output[i] = iteratee(i);
    }

    return output;
}

function arrayJoinByPredicate<TLeft, TRight>(leftInput: TLeft[], rightInput: TRight[], predicate: Predicate<TLeft, TRight>): ArrayJoin<TLeft, TRight> {
    const left = new Set(leftInput);
    const right = new Set(rightInput);
    const inner = [] as [left: TLeft, right: TRight][];

    leftInput.forEach(valLeft => {
        const valRight = rightInput.find(valRight => predicate(valLeft, valRight));

        if (!typeIsNil(valRight)) {
            inner.push([valLeft, valRight]);
            left.delete(valLeft);
            right.delete(valRight);
        }
    });

    return {
        left: Array.from(left),
        inner,
        right: Array.from(right),
    };
}

function arrayJoinByKey<TLeft, TRight>(leftInput: TLeft[], rightInput: TRight[], key: PropertyKey): ArrayJoin<TLeft, TRight> {
    const left = new Set(leftInput);
    const inner = [] as [left: TLeft, right: TRight][];
    const rightIndex = new Map<unknown, TRight>();

    rightInput.forEach(valRight => {
        rightIndex.set((valRight as Record<PropertyKey, unknown>)[key], valRight);
    });

    leftInput.forEach(valLeft => {
        const leftKey = (valLeft as Record<PropertyKey, unknown>)[key];
        const valRight = rightIndex.get(leftKey);

        if (!typeIsNil(valRight)) {
            inner.push([valLeft, valRight]);
            left.delete(valLeft);
            rightIndex.delete(leftKey);
        }
    });

    return {
        left: Array.from(left),
        inner,
        right: Array.from(rightIndex.values()),
    };
}

/** Performs a full join between two arrays, returning entries (left-only), updates (matched), and exits (right-only). */
export function arrayJoin<TLeft, TRight>(leftInput: TLeft[], rightInput: TRight[], predicate: ArrayJoinPredicate<TLeft, TRight>): ArrayJoin<TLeft, TRight> {
    return typeIsFunction(predicate)
        ? arrayJoinByPredicate(leftInput, rightInput, predicate)
        : arrayJoinByKey(leftInput, rightInput, predicate as PropertyKey);
}

/** Groups array items by a property key or indexer function into a keyed record. */
export function arrayGroup<TValue>(input: TValue[], identity: ArrayGroupIdentity<TValue>): Record<PropertyKey, TValue[]> {
    const output = {} as Record<PropertyKey, TValue[]>;

    const groupIdentity = (typeIsFunction(identity)
        ? identity
        : (value: TValue) => value[identity]
    ) as Indexer<TValue>;

    for (let i = 0; i < input.length; i++) {
        const value = input[i];
        const group = groupIdentity(value);
        (output[group] ??= []).push(value);
    }

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

    for (let i = 0; i < leftInput.length; i++) {
        const valLeft = leftInput[i];
        const found = rightInput.find(valRight => compare(valLeft, valRight));
        const shouldInclude = includeMatches ? !typeIsNil(found) : typeIsNil(found);

        if (shouldInclude) {
            output.push(valLeft);
        }
    }

    return output;
}

/** Returns items from the left array that have a matching counterpart in the right array. */
export function arrayIntersection<TLeft, TRight = TLeft>(leftInput: TLeft[], rightInput: TRight[], predicate?: ArrayJoinPredicate<TLeft, TRight>): TLeft[] {
    return arrayFilterByMatch(leftInput, rightInput, predicate, true);
}

/** Returns items from the left array that have no matching counterpart in the right array. */
export function arrayDifference<TLeft, TRight = TLeft>(leftInput: TLeft[], rightInput: TRight[], predicate?: ArrayJoinPredicate<TLeft, TRight>): TLeft[] {
    return arrayFilterByMatch(leftInput, rightInput, predicate, false);
}

/** Returns a new array with duplicate values removed, preserving insertion order. */
export function arrayDedupe<TValue>(input: TValue[]): TValue[] {
    return [...new Set(input)];
}

/** Iterates over the enumerable properties of an object, invoking the iteratee for each key-value pair. */
export function objectForEach<TSource extends IterableObject>(input: TSource, iteratee: ObjectIteratee<keyof TSource, TSource[keyof TSource]>): void {
    for (const key in input) {
        iteratee(key, input[key]);
    }
}

/** Maps over the enumerable properties of an object, producing a new object with transformed values. */
export function objectMap<TSource extends IterableObject, TResult extends Record<keyof TSource, unknown> = Record<keyof TSource, unknown>>(input: TSource, iteratee: ObjectIteratee<Extract<keyof TSource, string>, TSource[keyof TSource], unknown>): TResult {
    const output = {} as Record<string, unknown>;

    for (const key in input) {
        output[key] = iteratee(key, input[key]);
    }

    return output as TResult;
}

/** Reduces the enumerable properties of an object into a single accumulated value. */
export function objectReduce<TSource extends IterableObject, TResult>(input: TSource, reducer: ObjectReducer<keyof TSource, TSource[keyof TSource], TResult>, initial: TResult): TResult {
    let output = initial;

    for (const key in input) {
        output = reducer(output, key, input[key]);
    }

    return output;
}

/** Iterates over each value in a `Set`, invoking the iteratee with the value and a running index. */
export function setForEach<TValue>(input: Set<TValue>, iteratee: CollectionIteratee<TValue>): void {
    let index = 0;

    for (const value of input) {
        iteratee(value, index++);
    }
}

/** Maps over a `Set`, producing a new `Set` with each value transformed by the iteratee. */
export function setMap<TValue, TResult>(input: Set<TValue>, iteratee: CollectionIteratee<TValue, TResult>): Set<TResult> {
    const output = new Set<TResult>();
    let index = 0;

    for (const value of input) {
        output.add(iteratee(value, index++));
    }

    return output;
}

/** Filters a `Set`, returning a new `Set` containing only values that satisfy the predicate. */
export function setFilter<TValue>(input: Set<TValue>, predicate: CollectionIteratee<TValue, boolean>): Set<TValue> {
    const output = new Set<TValue>();
    let index = 0;

    for (const value of input) {
        if (predicate(value, index++)) {
            output.add(value);
        }
    }

    return output;
}

/** Searches a `Set` for the first value that satisfies the predicate. */
export function setFind<TValue>(input: Set<TValue>, predicate: CollectionIteratee<TValue, boolean>): TValue | undefined {
    let index = 0;

    for (const value of input) {
        if (predicate(value, index++)) {
            return value;
        }
    }
}

/** Flat-maps over a `Set`, concatenating the arrays returned by the iteratee into a new `Set`. */
export function setFlatMap<TValue, TResult>(input: Set<TValue>, iteratee: CollectionIteratee<TValue, TResult[]>): Set<TResult> {
    const output = [] as TResult[];
    let index = 0;

    for (const value of input) {
        const result = iteratee(value, index++);

        for (let ri = 0; ri < result.length; ri++) {
            output.push(result[ri]);
        }
    }

    return new Set(output);
}
