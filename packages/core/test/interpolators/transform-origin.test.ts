import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateTransformOrigin,
} from '../../src/interpolators/transform-origin';

describe('Interpolators', () => {

    describe('Transform Origin', () => {

        test('test identifies numeric values', () => {
            expect(interpolateTransformOrigin.test!(0)).toBe(true);
            expect(interpolateTransformOrigin.test!(50)).toBe(true);
            expect(interpolateTransformOrigin.test!(-10)).toBe(true);
        });

        test('test identifies percentage strings', () => {
            expect(interpolateTransformOrigin.test!('0%')).toBe(true);
            expect(interpolateTransformOrigin.test!('50%')).toBe(true);
            expect(interpolateTransformOrigin.test!('100%')).toBe(true);
            expect(interpolateTransformOrigin.test!('-25%')).toBe(true);
        });

        test('test identifies plain numeric strings', () => {
            expect(interpolateTransformOrigin.test!('0')).toBe(true);
            expect(interpolateTransformOrigin.test!('50')).toBe(true);
            expect(interpolateTransformOrigin.test!('-10.5')).toBe(true);
        });

        test('test rejects non-origin values', () => {
            expect(interpolateTransformOrigin.test!('red')).toBe(false);
            expect(interpolateTransformOrigin.test!('45deg')).toBe(false);
            expect(interpolateTransformOrigin.test!(true)).toBe(false);
            expect(interpolateTransformOrigin.test!(null)).toBe(false);
        });

        test('interpolates between two numbers', () => {
            const interpolator = interpolateTransformOrigin(0, 100);

            expect(interpolator(0)).toBe(0);
            expect(interpolator(0.5)).toBe(50);
            expect(interpolator(1)).toBe(100);
        });

        test('interpolates between two percentage strings', () => {
            const interpolator = interpolateTransformOrigin('0%', '100%');

            expect(interpolator(0)).toBe('0%');
            expect(interpolator(0.5)).toBe('50%');
            expect(interpolator(1)).toBe('100%');
        });

        test('interpolates between number and percentage, returns percentage', () => {
            const interpolator = interpolateTransformOrigin(0, '50%');

            expect(interpolator(0)).toBe('0%');
            expect(interpolator(1)).toBe('50%');
        });

        test('interpolates between two plain numeric strings as numbers', () => {
            const interpolator = interpolateTransformOrigin('0', '200');

            expect(interpolator(0)).toBe(0);
            expect(interpolator(0.5)).toBe(100);
            expect(interpolator(1)).toBe(200);
        });

    });

});
