import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scalePoint,
} from '../../src';

describe('Scale', () => {

    describe('Point Scale', () => {

        test('Should place the first and last points on the range endpoints', () => {
            const scale = scalePoint(['a', 'b', 'c'], [0, 100]);

            expect(scale('a')).toBe(0);
            expect(scale('b')).toBe(50);
            expect(scale('c')).toBe(100);
        });

        test('Should expose the step between points', () => {
            const scale = scalePoint(['a', 'b', 'c'], [0, 100]);

            expect(scale.step).toBe(50);
        });

        test('Should apply outer padding', () => {
            const scale = scalePoint(['a', 'b', 'c'], [0, 90], {
                padding: 0.5,
            });

            expect(scale.step).toBeCloseTo(30, 5);
            expect(scale('a')).toBeCloseTo(15, 5);
            expect(scale('c')).toBeCloseTo(75, 5);
        });

        test('Should invert to the nearest domain value', () => {
            const scale = scalePoint(['a', 'b', 'c'], [0, 100]);

            expect(scale.inverse(0)).toBe('a');
            expect(scale.inverse(48)).toBe('b');
            expect(scale.inverse(100)).toBe('c');
        });

        test('Should report domain membership', () => {
            const scale = scalePoint(['a', 'b'], [0, 100]);

            expect(scale.includes('a')).toBe(true);
            expect(scale.includes('z')).toBe(false);
        });

    });

});
