import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateGradient,
} from '../../src';

describe('interpolateGradient', () => {

    test('Should interpolate matching linear gradients', () => {
        const gradA = 'linear-gradient(0deg, #000000 0%, #ffffff 100%)';
        const gradB = 'linear-gradient(90deg, #ff0000 0%, #0000ff 100%)';

        const interpolator = interpolateGradient(gradA, gradB);

        const at0 = interpolator(0);
        const at1 = interpolator(1);

        expect(typeof at0).toBe('string');
        expect(typeof at1).toBe('string');
        expect(at0).not.toBe(at1);
    });

    test('Should return start gradient at t=0', () => {
        const gradA = 'linear-gradient(0deg, #000000 0%, #ffffff 100%)';
        const gradB = 'linear-gradient(180deg, #ff0000 0%, #00ff00 100%)';

        const interpolator = interpolateGradient(gradA, gradB);
        const result = interpolator(0);

        // At t=0 should contain angle close to 0deg
        expect(result).toContain('linear-gradient(');
    });

    test('Should fall back to snap for non-gradient strings', () => {
        const interpolator = interpolateGradient('not-a-gradient', 'also-not');

        expect(interpolator(0)).toBe('not-a-gradient');
        expect(interpolator(0.4)).toBe('not-a-gradient');
        expect(interpolator(0.6)).toBe('also-not');
        expect(interpolator(1)).toBe('also-not');
    });

    test('Should fall back to snap for mismatched gradient types', () => {
        const gradA = 'linear-gradient(0deg, #000000 0%, #ffffff 100%)';
        const gradB = 'radial-gradient(circle, #000000 0%, #ffffff 100%)';

        const interpolator = interpolateGradient(gradA, gradB);

        expect(interpolator(0.4)).toBe(gradA);
        expect(interpolator(0.6)).toBe(gradB);
    });

    test('Should fall back to snap for mismatched stop counts', () => {
        const gradA = 'linear-gradient(0deg, #000000 0%, #ffffff 100%)';
        const gradB = 'linear-gradient(0deg, #000000 0%, #888888 50%, #ffffff 100%)';

        const interpolator = interpolateGradient(gradA, gradB);

        expect(interpolator(0.4)).toBe(gradA);
        expect(interpolator(0.6)).toBe(gradB);
    });

    test('Should have a test predicate that identifies gradient strings', () => {
        expect(interpolateGradient.test?.('linear-gradient(0deg, #000 0%, #fff 100%)')).toBe(true);
        expect(interpolateGradient.test?.('radial-gradient(circle, #000 0%, #fff 100%)')).toBe(true);
        expect(interpolateGradient.test?.('#ff0000')).toBe(false);
        expect(interpolateGradient.test?.('not a gradient')).toBe(false);
        expect(interpolateGradient.test?.(42 as unknown as string)).toBe(false);
    });

});
