import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    resolveRotation,
    resolveTransformOrigin,
} from '../../src';

describe('Context Base Helpers', () => {

    // ── resolveRotation ──────────────────────────────────────────

    describe('resolveRotation', () => {

        test('Should return number values unchanged', () => {
            expect(resolveRotation(1.5)).toBe(1.5);
            expect(resolveRotation(0)).toBe(0);
            expect(resolveRotation(-3.14)).toBe(-3.14);
        });

        test('Should convert degrees string to radians', () => {
            expect(resolveRotation('180deg')).toBeCloseTo(Math.PI, 5);
            expect(resolveRotation('90deg')).toBeCloseTo(Math.PI / 2, 5);
            expect(resolveRotation('0deg')).toBeCloseTo(0, 5);
            expect(resolveRotation('360deg')).toBeCloseTo(Math.PI * 2, 5);
        });

        test('Should parse radians string directly', () => {
            expect(resolveRotation('1.5rad')).toBeCloseTo(1.5, 5);
            expect(resolveRotation('3.14159rad')).toBeCloseTo(3.14159, 5);
        });

        test('Should parse bare number string', () => {
            expect(resolveRotation('2.5')).toBeCloseTo(2.5, 5);
        });

        test('Should return 0 for invalid string', () => {
            expect(resolveRotation('abc')).toBe(0);
            expect(resolveRotation('')).toBe(0);
        });

        test('Should trim whitespace', () => {
            expect(resolveRotation('  90deg  ')).toBeCloseTo(Math.PI / 2, 5);
        });

    });

    // ── resolveTransformOrigin ───────────────────────────────────

    describe('resolveTransformOrigin', () => {

        test('Should return number values unchanged', () => {
            expect(resolveTransformOrigin(50, 200)).toBe(50);
            expect(resolveTransformOrigin(0, 100)).toBe(0);
        });

        test('Should convert percentage string to pixel value', () => {
            expect(resolveTransformOrigin('50%', 200)).toBe(100);
            expect(resolveTransformOrigin('100%', 300)).toBe(300);
            expect(resolveTransformOrigin('0%', 400)).toBe(0);
            expect(resolveTransformOrigin('25%', 200)).toBe(50);
        });

        test('Should parse bare number string', () => {
            expect(resolveTransformOrigin('75', 200)).toBe(75);
        });

        test('Should return 0 for invalid string', () => {
            expect(resolveTransformOrigin('abc', 200)).toBe(0);
            expect(resolveTransformOrigin('', 200)).toBe(0);
        });

        test('Should trim whitespace', () => {
            expect(resolveTransformOrigin('  50%  ', 200)).toBe(100);
        });

    });

});
