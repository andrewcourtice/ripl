import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    degreesToRadians,
} from '../../src/math';

type Rotation = number | string;
type TransformOrigin = number | string;

function resolveRotation(value: Rotation): number {
    if (typeof value === 'number') {
        return value;
    }

    const trimmed = value.trim();

    if (trimmed.endsWith('deg')) {
        return degreesToRadians(parseFloat(trimmed));
    }

    if (trimmed.endsWith('rad')) {
        return parseFloat(trimmed);
    }

    return parseFloat(trimmed) || 0;
}

function resolveTransformOrigin(value: TransformOrigin, dimension: number): number {
    if (typeof value === 'number') {
        return value;
    }

    const trimmed = value.trim();

    if (trimmed.endsWith('%')) {
        return (parseFloat(trimmed) / 100) * dimension;
    }

    return parseFloat(trimmed) || 0;
}

describe('Transform Helpers', () => {

    describe('resolveRotation', () => {

        test('returns number values unchanged (radians)', () => {
            expect(resolveRotation(0)).toBe(0);
            expect(resolveRotation(Math.PI)).toBe(Math.PI);
            expect(resolveRotation(-1.5)).toBe(-1.5);
        });

        test('parses degree strings to radians', () => {
            expect(resolveRotation('0deg')).toBe(0);
            expect(resolveRotation('180deg')).toBeCloseTo(Math.PI, 10);
            expect(resolveRotation('90deg')).toBeCloseTo(Math.PI / 2, 10);
            expect(resolveRotation('-45deg')).toBeCloseTo(-Math.PI / 4, 10);
        });

        test('parses radian strings', () => {
            expect(resolveRotation('0rad')).toBe(0);
            expect(resolveRotation('3.14159rad')).toBeCloseTo(Math.PI, 4);
            expect(resolveRotation('-1.5708rad')).toBeCloseTo(-Math.PI / 2, 3);
        });

        test('parses plain numeric strings as radians', () => {
            expect(resolveRotation('0')).toBe(0);
            expect(resolveRotation('1.5708')).toBeCloseTo(Math.PI / 2, 3);
        });

        test('handles whitespace in strings', () => {
            expect(resolveRotation('  90deg  ')).toBeCloseTo(Math.PI / 2, 10);
            expect(resolveRotation('  1.5rad  ')).toBeCloseTo(1.5, 10);
        });

        test('returns 0 for unparseable strings', () => {
            expect(resolveRotation('abc')).toBe(0);
        });

    });

    describe('resolveTransformOrigin', () => {

        test('returns number values unchanged', () => {
            expect(resolveTransformOrigin(0, 100)).toBe(0);
            expect(resolveTransformOrigin(50, 100)).toBe(50);
            expect(resolveTransformOrigin(-10, 200)).toBe(-10);
        });

        test('resolves percentage strings relative to dimension', () => {
            expect(resolveTransformOrigin('50%', 200)).toBe(100);
            expect(resolveTransformOrigin('0%', 200)).toBe(0);
            expect(resolveTransformOrigin('100%', 200)).toBe(200);
            expect(resolveTransformOrigin('25%', 400)).toBe(100);
        });

        test('parses plain numeric strings as pixel values', () => {
            expect(resolveTransformOrigin('50', 200)).toBe(50);
            expect(resolveTransformOrigin('0', 100)).toBe(0);
        });

        test('handles whitespace in strings', () => {
            expect(resolveTransformOrigin('  50%  ', 200)).toBe(100);
            expect(resolveTransformOrigin('  25  ', 100)).toBe(25);
        });

        test('returns 0 for unparseable strings', () => {
            expect(resolveTransformOrigin('abc', 100)).toBe(0);
        });

    });

});
