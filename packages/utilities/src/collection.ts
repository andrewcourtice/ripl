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
export type CollectionIteratee<TValue, TResult = void> = (value: TValue, index: number) => TResult;
export type ObjectIteratee<TKey, TValue, TResult = void> = (key: TKey, value: TValue) => TResult;
export type ObjectReducer<TKey, TValue, TResult = void> = (accumulator: TResult, key: TKey, value: TValue) => TResult;

export type ArrayGroupIdentity<TValue> = keyof TValue | Indexer<TValue>;
export type ArrayJoinPredicate<TLeft, TRight> = keyof (TLeft & TRight) | Predicate<TLeft, TRight>;

export interface ArrayJoin<TLeft, TRight> {
    left: TLeft[];
    inner: [left: TLeft, right: TRight][];
    right: TRight[];
}

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

export function arrayJoin<TLeft, TRight>(leftInput: TLeft[], rightInput: TRight[], predicate: ArrayJoinPredicate<TLeft, TRight>): ArrayJoin<TLeft, TRight> {
    return typeIsFunction(predicate)
        ? arrayJoinByPredicate(leftInput, rightInput, predicate)
        : arrayJoinByKey(leftInput, rightInput, predicate as PropertyKey);
}

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
    let index = 0;

    for (const value of input) {
        iteratee(value, index++);
    }
}

export function setMap<TValue, TResult>(input: Set<TValue>, iteratee: CollectionIteratee<TValue, TResult>): Set<TResult> {
    const output = new Set<TResult>();
    let index = 0;

    for (const value of input) {
        output.add(iteratee(value, index++));
    }

    return output;
}

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

export function setFind<TValue>(input: Set<TValue>, predicate: CollectionIteratee<TValue, boolean>): TValue | undefined {
    let index = 0;

    for (const value of input) {
        if (predicate(value, index++)) {
            return value;
        }
    }
}

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
