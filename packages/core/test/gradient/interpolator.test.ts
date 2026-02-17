import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateGradient,
    parseGradient,
} from '../../src';

describe('Gradient Interpolator', () => {

    describe('Test predicate', () => {

        test('Should match a linear-gradient string', () => {
            expect(interpolateGradient.test!('linear-gradient(red, blue)')).toBe(true);
        });

        test('Should match a radial-gradient string', () => {
            expect(interpolateGradient.test!('radial-gradient(red, blue)')).toBe(true);
        });

        test('Should match a conic-gradient string', () => {
            expect(interpolateGradient.test!('conic-gradient(red, blue)')).toBe(true);
        });

        test('Should not match a plain color', () => {
            expect(interpolateGradient.test!('rgb(255, 0, 0)')).toBe(false);
        });

        test('Should not match a hex color', () => {
            expect(interpolateGradient.test!('#FF0000')).toBe(false);
        });

    });

    describe('Same-signature interpolation', () => {

        test('Should interpolate between two linear-gradients with same stop count', () => {
            const interpolator = interpolateGradient(
                'linear-gradient(0deg, #FF0000, #0000FF)',
                'linear-gradient(90deg, #00FF00, #FFFF00)'
            );

            const atStart = interpolator(0);
            const atEnd = interpolator(1);

            const startGradient = parseGradient(atStart);
            const endGradient = parseGradient(atEnd);

            expect(startGradient).toBeDefined();
            expect(endGradient).toBeDefined();

            if (startGradient?.type === 'linear') {
                expect(startGradient.angle).toBeCloseTo(0);
            }

            if (endGradient?.type === 'linear') {
                expect(endGradient.angle).toBeCloseTo(90);
            }
        });

        test('Should interpolate at midpoint', () => {
            const interpolator = interpolateGradient(
                'linear-gradient(0deg, #FF0000, #0000FF)',
                'linear-gradient(90deg, #00FF00, #FFFF00)'
            );

            const atMid = interpolator(0.5);
            const midGradient = parseGradient(atMid);

            expect(midGradient).toBeDefined();

            if (midGradient?.type === 'linear') {
                expect(midGradient.angle).toBeCloseTo(45);
            }
        });

        test('Should interpolate radial-gradient positions', () => {
            const interpolator = interpolateGradient(
                'radial-gradient(circle at 0% 0%, red, blue)',
                'radial-gradient(circle at 100% 100%, green, yellow)'
            );

            const atMid = interpolator(0.5);
            const midGradient = parseGradient(atMid);

            expect(midGradient).toBeDefined();

            if (midGradient?.type === 'radial') {
                expect(midGradient.position[0]).toBeCloseTo(50);
                expect(midGradient.position[1]).toBeCloseTo(50);
            }
        });

        test('Should interpolate conic-gradient angles', () => {
            const interpolator = interpolateGradient(
                'conic-gradient(from 0deg, red, blue)',
                'conic-gradient(from 180deg, green, yellow)'
            );

            const atMid = interpolator(0.5);
            const midGradient = parseGradient(atMid);

            expect(midGradient).toBeDefined();

            if (midGradient?.type === 'conic') {
                expect(midGradient.angle).toBeCloseTo(90);
            }
        });

        test('Should interpolate stop offsets', () => {
            const interpolator = interpolateGradient(
                'linear-gradient(red 0%, blue 100%)',
                'linear-gradient(red 20%, blue 80%)'
            );

            const atMid = interpolator(0.5);
            const midGradient = parseGradient(atMid);

            expect(midGradient).toBeDefined();
            expect(midGradient!.stops[0].offset).toBeCloseTo(0.1);
            expect(midGradient!.stops[1].offset).toBeCloseTo(0.9);
        });

    });

    describe('Differing-signature snap', () => {

        test('Should snap between different gradient types', () => {
            const interpolator = interpolateGradient(
                'linear-gradient(red, blue)',
                'radial-gradient(red, blue)'
            );

            expect(interpolator(0)).toBe('linear-gradient(red, blue)');
            expect(interpolator(0.4)).toBe('linear-gradient(red, blue)');
            expect(interpolator(0.6)).toBe('radial-gradient(red, blue)');
            expect(interpolator(1)).toBe('radial-gradient(red, blue)');
        });

        test('Should snap between gradients with different stop counts', () => {
            const interpolator = interpolateGradient(
                'linear-gradient(red, blue)',
                'linear-gradient(red, green, blue)'
            );

            expect(interpolator(0)).toBe('linear-gradient(red, blue)');
            expect(interpolator(0.4)).toBe('linear-gradient(red, blue)');
            expect(interpolator(0.6)).toBe('linear-gradient(red, green, blue)');
            expect(interpolator(1)).toBe('linear-gradient(red, green, blue)');
        });

        test('Should snap between repeating and non-repeating', () => {
            const interpolator = interpolateGradient(
                'linear-gradient(red, blue)',
                'repeating-linear-gradient(red, blue)'
            );

            expect(interpolator(0)).toBe('linear-gradient(red, blue)');
            expect(interpolator(0.6)).toBe('repeating-linear-gradient(red, blue)');
        });

        test('Should snap between different radial shapes', () => {
            const interpolator = interpolateGradient(
                'radial-gradient(circle, red, blue)',
                'radial-gradient(ellipse, red, blue)'
            );

            expect(interpolator(0)).toBe('radial-gradient(circle, red, blue)');
            expect(interpolator(0.6)).toBe('radial-gradient(ellipse, red, blue)');
        });

    });

});
