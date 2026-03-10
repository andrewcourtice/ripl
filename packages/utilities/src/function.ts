import {
    typeIsFunction,
} from './type';

import type {
    AnyFunction,
} from './types';

/** A function wrapper that caches its result after the first invocation until explicitly invalidated. */
export type CachedFunction<TValue extends AnyFunction> = {
    (...args: Parameters<TValue>): ReturnType<TValue>;
    invalidate(): void;
};

/** A function wrapper that caches results per unique key, exposing the underlying cache `Map`. */
export type MemoizedFunction<TValue extends AnyFunction, TKey> = {
    (...args: Parameters<TValue>): ReturnType<TValue>;
    cache: Map<TKey, ReturnType<TValue>>;
};

/** Derives a cache key from the arguments of a memoized function. */
export type MemoizeResolver<TValue extends AnyFunction, TKey> = (...args: Parameters<TValue>) => TKey;

/** Returns the value it receives unchanged — useful as a default transform or placeholder. */
export function functionIdentity<TValue>(value: TValue) {
    return value;
}

/** Wraps a value or factory function into a consistent factory that always returns the value. */
export function functionProduce<TValue>(value: TValue | (() => TValue)): () => TValue {
    return typeIsFunction(value) ? value : () => value;
}

/** Wraps a function so its result is computed once and then returned from cache on subsequent calls until `invalidate()` is called. */
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

/** Memoizes a function by caching results keyed by the resolver (defaults to the first argument). */
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