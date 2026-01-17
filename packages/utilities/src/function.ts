import {
    typeIsFunction,
} from './type';

import type {
    AnyFunction,
} from './types';

export type CachedFunction<TValue extends AnyFunction> = {
    (...args: Parameters<TValue>): ReturnType<TValue>;
    invalidate(): void;
};

export type MemoizedFunction<TValue extends AnyFunction, TKey> = {
    (...args: Parameters<TValue>): ReturnType<TValue>;
    cache: Map<TKey, ReturnType<TValue>>;
};

export type MemoizeResolver<TValue extends AnyFunction, TKey> = (...args: Parameters<TValue>) => TKey;

export function functionIdentity<TValue>(value: TValue) {
    return value;
}

export function functionProduce<TValue>(value: TValue | (() => TValue)): () => TValue {
    return typeIsFunction(value) ? value : () => value;
}

export function functionCache<TValue extends AnyFunction>(value: TValue): CachedFunction<TValue> {
    let valid = false;
    let result: ReturnType<TValue>;

    const output: CachedFunction<TValue> = (...args) => {
        if (!valid) {
            result = value(...args);
        }

        valid = true;

        return result;
    };

    output.invalidate = () => valid = false;

    return output;
}

export function functionMemoize<TValue extends AnyFunction, TKey = Parameters<TValue>[0]>(value: TValue, resolver: MemoizeResolver<TValue, TKey> = (...args) => args[0]){
    const cache = new Map<TKey, ReturnType<TValue>>();

    const output: MemoizedFunction<TValue, TKey> = (...args) => {
        const key = resolver(...args);

        if (!cache.has(key)) {
            cache.set(key, value(...args));
        }

        return cache.get(key)!;
    };

    output.cache = cache;

    return output;
}