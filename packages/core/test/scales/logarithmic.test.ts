import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleLog,
    scaleLogarithmic,
} from '../../src';

describe('Scale', () => {

    describe('Logarithmic Scale', () => {
        const domain = [1, 1000];
        const range = [0, 100];

        test('Should scale a domain to a range with base 10', () => {
            const scale = scaleLogarithmic(domain, range, {
                base: 10,
            });

            expect(scale(1)).toBe(0);
            expect(scale(1000)).toBe(100);
            expect(scale(10)).toBeCloseTo(33.33, 1);
        });

        test('Should scale with base 2', () => {
            const scale = scaleLogarithmic([1, 128], range, {
                base: 2,
            });

            expect(scale(1)).toBe(0);
            expect(scale(128)).toBe(100);
            expect(scale(8)).toBeCloseTo(42.857, 1);
        });

        test('Should scale with natural logarithm (base e)', () => {
            const scale = scaleLogarithmic([1, 100], range, {
                base: Math.E,
            });

            expect(scale(1)).toBe(0);
            expect(scale(100)).toBe(100);
        });

        test('Should clamp values outside the range', () => {
            const scale = scaleLogarithmic(domain, range, {
                base: 10,
                clamp: true,
            });

            expect(scale(0.1)).toBe(0);
            expect(scale(10000)).toBe(100);
        });

        test('Should return an inverse value', () => {
            const scale = scaleLogarithmic(domain, range, {
                base: 10,
            });

            expect(scale.inverse(0)).toBe(1);
            expect(scale.inverse(100)).toBeCloseTo(1000, 0);
            expect(scale.inverse(50)).toBeCloseTo(31.62, 1);
        });

        test('Should check if value is in domain', () => {
            const scale = scaleLogarithmic(domain, range, {
                base: 10,
            });

            expect(scale.includes(10)).toBe(true);
            expect(scale.includes(0.1)).toBe(false);
            expect(scale.includes(10000)).toBe(false);
        });

        test('Should generate logarithmic ticks', () => {
            const scale = scaleLogarithmic(domain, range, {
                base: 10,
            });
            const ticks = scale.ticks(4);

            expect(ticks).toHaveLength(4);
            expect(ticks[0]).toBe(1);
            expect(ticks[ticks.length - 1]).toBeCloseTo(1000, 0);
        });
    });

    describe('Log Scale (base 10 convenience)', () => {
        const domain = [1, 1000];
        const range = [0, 100];

        test('Should scale with base 10 by default', () => {
            const scale = scaleLog(domain, range);

            expect(scale(1)).toBe(0);
            expect(scale(1000)).toBe(100);
            expect(scale(10)).toBeCloseTo(33.33, 1);
        });

        test('Should return an inverse value', () => {
            const scale = scaleLog(domain, range);

            expect(scale.inverse(0)).toBe(1);
            expect(scale.inverse(100)).toBeCloseTo(1000, 0);
            expect(scale.inverse(50)).toBeCloseTo(31.62, 1);
        });
    });

});
