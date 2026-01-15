import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scalePower,
    scaleSqrt,
} from '../../src';

describe('Scale', () => {

    describe('Power Scale', () => {
        const domain = [0, 100];
        const range = [0, 1000];

        test('Should scale a domain to a range with power 2', () => {
            const scale = scalePower(domain, range, {
                exponent: 2,
            });

            expect(scale(0)).toBe(0);
            expect(scale(100)).toBe(1000);
            expect(scale(50)).toBe(250);
        });

        test('Should scale with default exponent 1 (linear)', () => {
            const scale = scalePower(domain, range);

            expect(scale(0)).toBe(0);
            expect(scale(50)).toBe(500);
            expect(scale(100)).toBe(1000);
        });

        test('Should scale with square root (exponent 0.5)', () => {
            const scale = scalePower(domain, range, {
                exponent: 0.5,
            });

            expect(scale(0)).toBe(0);
            expect(scale(100)).toBe(1000);
            expect(scale(25)).toBeCloseTo(500, 0);
        });

        test('Should clamp values outside the range', () => {
            const scale = scalePower(domain, range, {
                exponent: 2,
                clamp: true,
            });

            expect(scale(-10)).toBeCloseTo(10, 0);
            expect(scale(150)).toBe(1000);
        });

        test('Should return an inverse value', () => {
            const scale = scalePower(domain, range, {
                exponent: 2,
            });

            expect(scale.inverse(0)).toBe(0);
            expect(scale.inverse(1000)).toBe(100);
            expect(scale.inverse(250)).toBeCloseTo(50, 0);
        });

        test('Should check if value is in domain', () => {
            const scale = scalePower(domain, range, {
                exponent: 2,
            });

            expect(scale.includes(50)).toBe(true);
            expect(scale.includes(-10)).toBe(false);
            expect(scale.includes(150)).toBe(false);
        });

        test('Should generate ticks', () => {
            const scale = scalePower(domain, range, {
                exponent: 2,
            });
            const ticks = scale.ticks(5);

            expect(ticks.length).toBeGreaterThan(0);
            expect(ticks[0]).toBeLessThanOrEqual(domain[0]);
            expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(domain[1]);
        });
    });

    describe('Square Root Scale', () => {
        const domain = [0, 100];
        const range = [0, 1000];

        test('Should scale with square root (convenience function)', () => {
            const scale = scaleSqrt(domain, range);

            expect(scale(0)).toBe(0);
            expect(scale(100)).toBe(1000);
            expect(scale(25)).toBeCloseTo(500, 0);
        });

        test('Should return an inverse value', () => {
            const scale = scaleSqrt(domain, range);

            expect(scale.inverse(0)).toBe(0);
            expect(scale.inverse(1000)).toBe(100);
            expect(scale.inverse(500)).toBeCloseTo(25, 0);
        });
    });

});
