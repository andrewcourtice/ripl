import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateColor,
    parseColor,
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

            expect(interpolator(0.5)).toBe('rgba(128, 128, 128, 1)');
        });

        test('Should interpolate between rgb colors', () => {
            const interpolator = interpolateColor('rgb(255, 0, 0)', 'rgb(0, 0, 255)');

            expect(interpolator(0.5)).toBe('rgba(128, 0, 128, 1)');
        });

        // Named colors had no parser, so the factory fell back to a hard step at the halfway point.
        test('Should interpolate between named colors', () => {
            const interpolator = interpolateColor('red', 'blue');
            const result = interpolator(0.5);

            expect(result).toBe('rgba(128, 0, 128, 1)');
        });

        // 3D-C1: fractional channels serialized straight back out, so nothing downstream could
        // read an interpolated colour — a shaded surface fell back to its material grey.
        test('Should emit a colour it can parse back', () => {
            const interpolator = interpolateColor('#ff0000', '#0000ff');

            for (let position = 0; position <= 1; position += 0.01) {
                expect(parseColor(interpolator(position))).toBeDefined();
            }
        });

        test('Should preserve alpha interpolation', () => {
            const interpolator = interpolateColor('rgba(0, 0, 0, 0.2)', 'rgba(0, 0, 0, 0.8)');
            const result = interpolator(0.5);
            expect(result).toBe('rgba(0, 0, 0, 0.5)');
        });

    });

});
