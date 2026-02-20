import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateAny,
} from '../../src';

describe('Interpolators', () => {

    describe('Any', () => {

        test('test() should always return true', () => {
            expect(interpolateAny.test!('hello')).toBe(true);
            expect(interpolateAny.test!(42)).toBe(true);
            expect(interpolateAny.test!(null)).toBe(true);
            expect(interpolateAny.test!(undefined)).toBe(true);
            expect(interpolateAny.test!({})).toBe(true);
        });

        test('Should return valueA when position < 0.5', () => {
            const interpolator = interpolateAny('a', 'b');
            expect(interpolator(0)).toBe('a');
            expect(interpolator(0.25)).toBe('a');
            expect(interpolator(0.49)).toBe('a');
        });

        test('Should return valueB when position > 0.5', () => {
            const interpolator = interpolateAny('a', 'b');
            expect(interpolator(0.5)).toBe('a');
            expect(interpolator(0.51)).toBe('b');
            expect(interpolator(0.75)).toBe('b');
            expect(interpolator(1)).toBe('b');
        });

        test('Should work with non-string types', () => {
            const objA = { x: 1 };
            const objB = { x: 2 };
            const interpolator = interpolateAny(objA, objB);

            expect(interpolator(0)).toBe(objA);
            expect(interpolator(1)).toBe(objB);
        });

    });

});
