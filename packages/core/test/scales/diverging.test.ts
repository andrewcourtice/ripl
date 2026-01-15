import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleDiverging,
} from '../../src';

describe('Scale', () => {

    describe('Diverging Scale', () => {
        const domain = [-10, 10];
        const range = [0, 100];

        test('Should scale a domain to a range with automatic midpoint', () => {
            const scale = scaleDiverging(domain, range);

            expect(scale(-10)).toBe(0);
            expect(scale(0)).toBe(50);
            expect(scale(10)).toBe(100);
        });

        test('Should scale with custom midpoint', () => {
            const scale = scaleDiverging(domain, range, {
                midpoint: -5,
            });

            expect(scale(-10)).toBe(0);
            expect(scale(-5)).toBe(50);
            expect(scale(10)).toBe(100);
        });

        test('Should scale lower half independently', () => {
            const scale = scaleDiverging(domain, range);

            expect(scale(-5)).toBe(25);
            expect(scale(-10)).toBe(0);
        });

        test('Should scale upper half independently', () => {
            const scale = scaleDiverging(domain, range);

            expect(scale(5)).toBe(75);
            expect(scale(10)).toBe(100);
        });

        test('Should clamp values outside the range', () => {
            const scale = scaleDiverging(domain, range, {
                clamp: true,
            });

            expect(scale(-20)).toBe(0);
            expect(scale(20)).toBe(100);
        });

        test('Should return an inverse value for lower half', () => {
            const scale = scaleDiverging(domain, range);

            expect(scale.inverse(0)).toBe(-10);
            expect(scale.inverse(25)).toBe(-5);
        });

        test('Should return an inverse value for upper half', () => {
            const scale = scaleDiverging(domain, range);

            expect(scale.inverse(75)).toBe(5);
            expect(scale.inverse(100)).toBe(10);
        });

        test('Should check if value is in domain', () => {
            const scale = scaleDiverging(domain, range);

            expect(scale.includes(0)).toBe(true);
            expect(scale.includes(-20)).toBe(false);
            expect(scale.includes(20)).toBe(false);
        });

        test('Should generate ticks', () => {
            const scale = scaleDiverging(domain, range);
            const ticks = scale.ticks(5);

            expect(ticks).toHaveLength(5);
            expect(ticks[0]).toBe(-10);
            expect(ticks[ticks.length - 1]).toBe(10);
        });
    });

});
