import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    isGradientString,
    parseGradient,
} from '../../src';

describe('Gradient', () => {

    describe('isGradientString', () => {

        test('Should detect a linear-gradient', () => {
            expect(isGradientString('linear-gradient(to right, red, blue)')).toBe(true);
        });

        test('Should detect a radial-gradient', () => {
            expect(isGradientString('radial-gradient(circle, red, blue)')).toBe(true);
        });

        test('Should detect a conic-gradient', () => {
            expect(isGradientString('conic-gradient(red, blue)')).toBe(true);
        });

        test('Should detect a repeating-linear-gradient', () => {
            expect(isGradientString('repeating-linear-gradient(red, blue)')).toBe(true);
        });

        test('Should detect a repeating-radial-gradient', () => {
            expect(isGradientString('repeating-radial-gradient(red, blue)')).toBe(true);
        });

        test('Should detect a repeating-conic-gradient', () => {
            expect(isGradientString('repeating-conic-gradient(red, blue)')).toBe(true);
        });

        test('Should not detect a plain color', () => {
            expect(isGradientString('rgb(255, 0, 0)')).toBe(false);
        });

        test('Should not detect a hex color', () => {
            expect(isGradientString('#FF0000')).toBe(false);
        });

    });

    describe('Parser - Linear', () => {

        test('Should parse a basic linear-gradient with default direction', () => {
            const gradient = parseGradient('linear-gradient(red, blue)');

            expect(gradient).toBeDefined();
            expect(gradient!.type).toBe('linear');
            expect(gradient!.repeating).toBe(false);

            if (gradient!.type === 'linear') {
                expect(gradient!.angle).toBe(180);
            }

            expect(gradient!.stops).toHaveLength(2);
            expect(gradient!.stops[0].color).toBe('red');
            expect(gradient!.stops[0].offset).toBe(0);
            expect(gradient!.stops[1].color).toBe('blue');
            expect(gradient!.stops[1].offset).toBe(1);
        });

        test('Should parse a linear-gradient with angle in degrees', () => {
            const gradient = parseGradient('linear-gradient(45deg, red, blue)');

            expect(gradient).toBeDefined();

            if (gradient!.type === 'linear') {
                expect(gradient!.angle).toBe(45);
            }
        });

        test('Should parse a linear-gradient with angle in turns', () => {
            const gradient = parseGradient('linear-gradient(0.25turn, red, blue)');

            expect(gradient).toBeDefined();

            if (gradient!.type === 'linear') {
                expect(gradient!.angle).toBe(90);
            }
        });

        test('Should parse a linear-gradient with direction keyword', () => {
            const gradient = parseGradient('linear-gradient(to right, red, blue)');

            expect(gradient).toBeDefined();

            if (gradient!.type === 'linear') {
                expect(gradient!.angle).toBe(90);
            }
        });

        test('Should parse a linear-gradient with percentage stops', () => {
            const gradient = parseGradient('linear-gradient(red 10%, green 50%, blue 90%)');

            expect(gradient).toBeDefined();
            expect(gradient!.stops).toHaveLength(3);
            expect(gradient!.stops[0].offset).toBeCloseTo(0.1);
            expect(gradient!.stops[1].offset).toBeCloseTo(0.5);
            expect(gradient!.stops[2].offset).toBeCloseTo(0.9);
        });

        test('Should parse a repeating-linear-gradient', () => {
            const gradient = parseGradient('repeating-linear-gradient(45deg, red 0%, blue 20%)');

            expect(gradient).toBeDefined();
            expect(gradient!.type).toBe('linear');
            expect(gradient!.repeating).toBe(true);
        });

        test('Should normalise stop offsets when some are missing', () => {
            const gradient = parseGradient('linear-gradient(red, green, blue)');

            expect(gradient).toBeDefined();
            expect(gradient!.stops).toHaveLength(3);
            expect(gradient!.stops[0].offset).toBe(0);
            expect(gradient!.stops[1].offset).toBeCloseTo(0.5);
            expect(gradient!.stops[2].offset).toBe(1);
        });

    });

    describe('Parser - Radial', () => {

        test('Should parse a basic radial-gradient', () => {
            const gradient = parseGradient('radial-gradient(red, blue)');

            expect(gradient).toBeDefined();
            expect(gradient!.type).toBe('radial');
            expect(gradient!.repeating).toBe(false);

            if (gradient!.type === 'radial') {
                expect(gradient!.shape).toBe('ellipse');
                expect(gradient!.position).toEqual([50, 50]);
            }
        });

        test('Should parse a radial-gradient with circle shape', () => {
            const gradient = parseGradient('radial-gradient(circle, red, blue)');

            expect(gradient).toBeDefined();

            if (gradient!.type === 'radial') {
                expect(gradient!.shape).toBe('circle');
            }
        });

        test('Should parse a radial-gradient with position', () => {
            const gradient = parseGradient('radial-gradient(circle at 25% 75%, red, blue)');

            expect(gradient).toBeDefined();

            if (gradient!.type === 'radial') {
                expect(gradient!.shape).toBe('circle');
                expect(gradient!.position).toEqual([25, 75]);
            }
        });

        test('Should parse a repeating-radial-gradient', () => {
            const gradient = parseGradient('repeating-radial-gradient(circle, red 0%, blue 20%)');

            expect(gradient).toBeDefined();
            expect(gradient!.type).toBe('radial');
            expect(gradient!.repeating).toBe(true);
        });

    });

    describe('Parser - Conic', () => {

        test('Should parse a basic conic-gradient', () => {
            const gradient = parseGradient('conic-gradient(red, blue)');

            expect(gradient).toBeDefined();
            expect(gradient!.type).toBe('conic');
            expect(gradient!.repeating).toBe(false);

            if (gradient!.type === 'conic') {
                expect(gradient!.angle).toBe(0);
                expect(gradient!.position).toEqual([50, 50]);
            }
        });

        test('Should parse a conic-gradient with from angle', () => {
            const gradient = parseGradient('conic-gradient(from 90deg, red, blue)');

            expect(gradient).toBeDefined();

            if (gradient!.type === 'conic') {
                expect(gradient!.angle).toBe(90);
            }
        });

        test('Should parse a conic-gradient with position', () => {
            const gradient = parseGradient('conic-gradient(from 0deg at 25% 75%, red, blue)');

            expect(gradient).toBeDefined();

            if (gradient!.type === 'conic') {
                expect(gradient!.position).toEqual([25, 75]);
            }
        });

        test('Should parse a repeating-conic-gradient', () => {
            const gradient = parseGradient('repeating-conic-gradient(red 0%, blue 25%)');

            expect(gradient).toBeDefined();
            expect(gradient!.type).toBe('conic');
            expect(gradient!.repeating).toBe(true);
        });

    });

    describe('Parser - Edge Cases', () => {

        test('Should return undefined for non-gradient strings', () => {
            expect(parseGradient('red')).toBeUndefined();
            expect(parseGradient('#FF0000')).toBeUndefined();
            expect(parseGradient('rgb(255, 0, 0)')).toBeUndefined();
        });

        test('Should handle rgb() colors in gradient stops', () => {
            const gradient = parseGradient('linear-gradient(rgb(255, 0, 0), rgb(0, 0, 255))');

            expect(gradient).toBeDefined();
            expect(gradient!.stops).toHaveLength(2);
            expect(gradient!.stops[0].color).toBe('rgb(255, 0, 0)');
            expect(gradient!.stops[1].color).toBe('rgb(0, 0, 255)');
        });

        test('Should handle rgba() colors in gradient stops', () => {
            const gradient = parseGradient('linear-gradient(rgba(255, 0, 0, 0.5), rgba(0, 0, 255, 0.5))');

            expect(gradient).toBeDefined();
            expect(gradient!.stops).toHaveLength(2);
            expect(gradient!.stops[0].color).toBe('rgba(255, 0, 0, 0.5)');
            expect(gradient!.stops[1].color).toBe('rgba(0, 0, 255, 0.5)');
        });

    });

});
