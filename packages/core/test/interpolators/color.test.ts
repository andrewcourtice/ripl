import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateColor,
} from '../../src';

describe('Interpolators', () => {

    describe('Color', () => {

        test('test() should return true for valid color strings', () => {
            expect(interpolateColor.test!('#ff0000')).toBe(true);
            expect(interpolateColor.test!('rgb(255, 0, 0)')).toBe(true);
            expect(interpolateColor.test!('rgba(255, 0, 0, 1)')).toBe(true);
        });

        test('test() should return false for non-color values', () => {
            expect(interpolateColor.test!(42)).toBe(false);
            expect(interpolateColor.test!('hello')).toBe(false);
            expect(interpolateColor.test!(null)).toBe(false);
        });

        test('Should return start color at position 0', () => {
            const interpolator = interpolateColor('#000000', '#ffffff');
            const result = interpolator(0);
            expect(result).toBe('rgba(0, 0, 0, 1)');
        });

        test('Should return end color at position 1', () => {
            const interpolator = interpolateColor('#000000', '#ffffff');
            const result = interpolator(1);
            expect(result).toBe('rgba(255, 255, 255, 1)');
        });

        test('Should interpolate to midpoint', () => {
            const interpolator = interpolateColor('#000000', '#ffffff');
            const result = interpolator(0.5);
            // serialiseRGBA does not round, so values like 127.5 are expected
            expect(result).toMatch(/^rgba\([\d.]+, [\d.]+, [\d.]+, [\d.]+\)$/);
            const match = result.match(/rgba\(([\d.]+), ([\d.]+), ([\d.]+)/);
            expect(match).toBeTruthy();
            const r = parseFloat(match![1]);
            expect(r).toBeCloseTo(127.5, 1);
        });

        test('Should interpolate between rgb colors', () => {
            const interpolator = interpolateColor('rgb(255, 0, 0)', 'rgb(0, 0, 255)');
            const result = interpolator(0.5);
            const match = result.match(/rgba\(([\d.]+), ([\d.]+), ([\d.]+)/);
            expect(match).toBeTruthy();
            const r = parseFloat(match![1]);
            const b = parseFloat(match![3]);
            expect(r).toBeCloseTo(127.5, 1);
            expect(b).toBeCloseTo(127.5, 1);
        });

        test('Should preserve alpha interpolation', () => {
            const interpolator = interpolateColor('rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.8)');
            const result = interpolator(0.5);
            expect(result).toBe('rgba(0, 0, 0, 0.5)');
        });

    });

});
