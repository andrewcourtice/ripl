import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleTime,
} from '../../src';

describe('Scale', () => {

    describe('Time Scale', () => {
        const domain = [new Date('2024-01-01'), new Date('2024-12-31')];
        const range = [0, 1000];

        test('Should scale a date domain to a range', () => {
            const scale = scaleTime(domain, range);

            expect(scale(domain[0])).toBe(range[0]);
            expect(scale(domain[1])).toBe(range[1]);
        });

        test('Should scale a mid-point date', () => {
            const scale = scaleTime(domain, range);
            const midDate = new Date('2024-07-01');
            const result = scale(midDate);

            expect(result).toBeGreaterThan(range[0]);
            expect(result).toBeLessThan(range[1]);
        });

        test('Should clamp values outside the range', () => {
            const scale = scaleTime(domain, range, {
                clamp: true,
            });

            expect(scale(new Date('2023-01-01'))).toBe(range[0]);
            expect(scale(new Date('2025-01-01'))).toBe(range[1]);
        });

        test('Should return an inverse value', () => {
            const scale = scaleTime(domain, range);

            expect(scale.inverse(range[0])).toEqual(domain[0]);
            expect(scale.inverse(range[1])).toEqual(domain[1]);
        });

        test('Should check if value is in domain', () => {
            const scale = scaleTime(domain, range);

            expect(scale.includes(new Date('2024-06-15'))).toBe(true);
            expect(scale.includes(new Date('2023-01-01'))).toBe(false);
        });

        test('Should generate ticks', () => {
            const scale = scaleTime(domain, range);
            const ticks = scale.ticks(5);

            expect(ticks).toHaveLength(5);
            expect(ticks[0]).toEqual(domain[0]);
            expect(ticks[ticks.length - 1]).toEqual(domain[1]);
        });
    });

});
