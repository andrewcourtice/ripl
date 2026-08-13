import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateNumber,
    interpolateNumbers,
} from '../../src';

describe('Interpolators', () => {

    describe('Number', () => {

        test('Interpolate between 2 numbers about a given position', () => {
            const interpolator = interpolateNumber(-5, 5);

            expect(interpolator(0)).toBe(-5);
            expect(interpolator(0.5)).toBe(0);
            expect(interpolator(1)).toBe(5);
        });

    });

    describe('Numbers', () => {

        test('Should interpolate two arrays of equal length element-wise', () => {
            const interpolator = interpolateNumbers([0, 10], [10, 30]);

            expect(interpolator(0)).toEqual([0, 10]);
            expect(interpolator(0.5)).toEqual([5, 20]);
            expect(interpolator(1)).toEqual([10, 30]);
        });

        test('Should repeat the shorter array to fill the target length', () => {
            const interpolator = interpolateNumbers([0, 10], [4, 4, 4, 4]);

            expect(interpolator(0.5)).toEqual([2, 7, 2, 7]);
        });

        test('Should settle on the original arrays at the endpoints', () => {
            const interpolator = interpolateNumbers([0, 10], [4, 4, 4, 4]);

            expect(interpolator(0)).toEqual([0, 10]);
            expect(interpolator(1)).toEqual([4, 4, 4, 4]);
        });

        test('Should snap when either array is empty', () => {
            const interpolator = interpolateNumbers([], [1, 2]);

            expect(interpolator(0.25)).toEqual([]);
            expect(interpolator(0.75)).toEqual([1, 2]);
        });

        test('Should identify arrays of numbers', () => {
            expect(interpolateNumbers.test!([1, 2, 3])).toBe(true);
            expect(interpolateNumbers.test!([1, 2, 3, 4, 5, 6])).toBe(true);
            expect(interpolateNumbers.test!([[0, 0], [1, 1]])).toBe(false);
            expect(interpolateNumbers.test!('hello')).toBe(false);
            expect(interpolateNumbers.test!(5)).toBe(false);
        });

    });

});