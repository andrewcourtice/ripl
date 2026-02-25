import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateRotation,
} from '../../src/interpolators/rotation';

describe('Interpolators', () => {

    describe('Rotation', () => {

        test('test identifies numeric values', () => {
            expect(interpolateRotation.test!(0)).toBe(true);
            expect(interpolateRotation.test!(1.5)).toBe(true);
            expect(interpolateRotation.test!(-3.14)).toBe(true);
        });

        test('test identifies degree strings', () => {
            expect(interpolateRotation.test!('0deg')).toBe(true);
            expect(interpolateRotation.test!('45deg')).toBe(true);
            expect(interpolateRotation.test!('-90deg')).toBe(true);
            expect(interpolateRotation.test!('180.5deg')).toBe(true);
        });

        test('test identifies radian strings', () => {
            expect(interpolateRotation.test!('0rad')).toBe(true);
            expect(interpolateRotation.test!('1.5708rad')).toBe(true);
            expect(interpolateRotation.test!('-3.14rad')).toBe(true);
        });

        test('test identifies plain numeric strings', () => {
            expect(interpolateRotation.test!('0')).toBe(true);
            expect(interpolateRotation.test!('1.5')).toBe(true);
        });

        test('test rejects non-rotation values', () => {
            expect(interpolateRotation.test!('red')).toBe(false);
            expect(interpolateRotation.test!('50%')).toBe(false);
            expect(interpolateRotation.test!(true)).toBe(false);
            expect(interpolateRotation.test!(null)).toBe(false);
        });

        test('interpolates between two numbers (radians)', () => {
            const interpolator = interpolateRotation(0, Math.PI);

            expect(interpolator(0)).toBe(0);
            expect(interpolator(0.5)).toBeCloseTo(Math.PI / 2, 10);
            expect(interpolator(1)).toBeCloseTo(Math.PI, 10);
        });

        test('interpolates between two degree strings', () => {
            const interpolator = interpolateRotation('0deg', '180deg');

            expect(interpolator(0)).toBe('0deg');
            expect(interpolator(0.5)).toBe('90deg');
            expect(interpolator(1)).toBe('180deg');
        });

        test('interpolates between number and degree string, returns degree string', () => {
            const interpolator = interpolateRotation(0, '90deg');

            expect(interpolator(0)).toBe('0deg');
            expect(interpolator(1)).toBe('90deg');
        });

        test('interpolates between two radian strings', () => {
            const interpolator = interpolateRotation('0rad', '3.141592653589793rad');

            const result = interpolator(0.5);
            expect(typeof result).toBe('string');
            expect(parseFloat(result as string)).toBeCloseTo(Math.PI / 2, 5);
            expect((result as string).endsWith('rad')).toBe(true);
        });

        test('interpolates between number and radian string, returns radian string', () => {
            const interpolator = interpolateRotation(0, '1.5708rad');

            const result = interpolator(1);
            expect(typeof result).toBe('string');
            expect((result as string).endsWith('rad')).toBe(true);
        });

    });

});
