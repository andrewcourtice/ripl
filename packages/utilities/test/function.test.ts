import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    functionCache,
    functionIdentity,
    functionMemoize,
    functionProduce,
} from '../src';

describe('Function Utilities', () => {

    describe('functionIdentity', () => {
        test('Should return the input value', () => {
            expect(functionIdentity(42)).toBe(42);
            expect(functionIdentity('hello')).toBe('hello');
            const obj = { a: 1 };
            expect(functionIdentity(obj)).toBe(obj);
        });
    });

    describe('functionProduce', () => {
        test('Should wrap a non-function value in a producer', () => {
            const producer = functionProduce(42);
            expect(typeof producer).toBe('function');
            expect(producer()).toBe(42);
        });

        test('Should return the function as-is if already a function', () => {
            const fn = () => 42;
            const producer = functionProduce(fn);
            expect(producer).toBe(fn);
            expect(producer()).toBe(42);
        });
    });

    describe('functionCache', () => {
        test('Should cache the result of a function', () => {
            const fn = vi.fn(() => Math.random());
            const cached = functionCache(fn);

            const first = cached();
            const second = cached();

            expect(first).toBe(second);
            expect(fn).toHaveBeenCalledTimes(1);
        });

        test('Should support invalidation', () => {
            let counter = 0;
            const fn = vi.fn(() => ++counter);
            const cached = functionCache(fn);

            const first = cached();
            cached.invalidate();
            const second = cached();

            expect(first).toBe(1);
            expect(second).toBe(2);
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });

    describe('functionMemoize', () => {
        test('Should memoize based on first argument by default', () => {
            const fn = vi.fn((x: number) => x * 2);
            const memoized = functionMemoize(fn);

            expect(memoized(5)).toBe(10);
            expect(memoized(5)).toBe(10);
            expect(fn).toHaveBeenCalledTimes(1);

            expect(memoized(10)).toBe(20);
            expect(fn).toHaveBeenCalledTimes(2);
        });

        test('Should use custom resolver when provided', () => {
            const fn = vi.fn((a: number, b: number) => a + b);
            const memoized = functionMemoize(fn, (a, b) => `${a}-${b}`);

            expect(memoized(1, 2)).toBe(3);
            expect(memoized(1, 2)).toBe(3);
            expect(fn).toHaveBeenCalledTimes(1);

            expect(memoized(1, 3)).toBe(4);
            expect(fn).toHaveBeenCalledTimes(2);
        });
    });

});
