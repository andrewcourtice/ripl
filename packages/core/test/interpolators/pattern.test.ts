import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolatePattern,
    parsePattern,
} from '../../src';

describe('interpolatePattern', () => {

    test('Should interpolate colors and size between matching-type patterns', () => {
        const patternA = 'pattern(diagonal, #000000, #ffffff, 4)';
        const patternB = 'pattern(diagonal, #ff0000, #0000ff, 16)';

        const interpolator = interpolatePattern(patternA, patternB);

        const at0 = parsePattern(interpolator(0))!;
        const atHalf = parsePattern(interpolator(0.5))!;
        const at1 = parsePattern(interpolator(1))!;

        // Type is preserved and the tile size eases from 4 to 16 through an intermediate value.
        expect(at0.type).toBe('diagonal');
        expect(at0.size).toBe(4);
        expect(at1.size).toBe(16);
        expect(atHalf.size).toBeGreaterThan(4);
        expect(atHalf.size).toBeLessThan(16);

        // The foreground color is a genuine intermediate, not either endpoint.
        expect(atHalf.foreground).not.toBe(at0.foreground);
        expect(atHalf.foreground).not.toBe(at1.foreground);
    });

    test('Should fall back to snap for non-pattern strings', () => {
        const interpolator = interpolatePattern('not-a-pattern', 'also-not');

        expect(interpolator(0)).toBe('not-a-pattern');
        expect(interpolator(0.4)).toBe('not-a-pattern');
        expect(interpolator(0.6)).toBe('also-not');
        expect(interpolator(1)).toBe('also-not');
    });

    test('Should fall back to snap for mismatched tile types', () => {
        const patternA = 'pattern(diagonal, #000000, #ffffff, 8)';
        const patternB = 'pattern(dots, #000000, #ffffff, 8)';

        const interpolator = interpolatePattern(patternA, patternB);

        expect(interpolator(0.4)).toBe(patternA);
        expect(interpolator(0.6)).toBe(patternB);
    });

    test('Should have a test predicate that identifies pattern strings', () => {
        expect(interpolatePattern.test?.('pattern(diagonal, #1a6, #fff, 8)')).toBe(true);
        expect(interpolatePattern.test?.('pattern(dots)')).toBe(true);
        expect(interpolatePattern.test?.('#ff0000')).toBe(false);
        expect(interpolatePattern.test?.('linear-gradient(0deg, #000 0%, #fff 100%)')).toBe(false);
        expect(interpolatePattern.test?.(42 as unknown as string)).toBe(false);
    });

});
