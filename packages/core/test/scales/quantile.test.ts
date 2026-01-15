import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleQuantile,
} from '../../src';

describe('Scale', () => {

    describe('Quantile Scale', () => {
        const domain = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const range = ['low', 'medium', 'high'];

        test('Should map domain values to quantile buckets', () => {
            const scale = scaleQuantile(domain, range);

            expect(scale(1)).toBe('low');
            expect(scale(2)).toBe('low');
            expect(scale(3)).toBe('low');
        });

        test('Should map middle values to middle bucket', () => {
            const scale = scaleQuantile(domain, range);

            expect(scale(4)).toBe('medium');
            expect(scale(5)).toBe('medium');
            expect(scale(6)).toBe('medium');
        });

        test('Should map high values to high bucket', () => {
            const scale = scaleQuantile(domain, range);

            expect(scale(7)).toBe('high');
            expect(scale(8)).toBe('high');
            expect(scale(9)).toBe('high');
            expect(scale(10)).toBe('high');
        });

        test('Should handle unsorted domain', () => {
            const unsortedDomain = [5, 2, 8, 1, 9, 3, 7, 4, 6, 10];
            const scale = scaleQuantile(unsortedDomain, range);

            expect(scale(1)).toBe('low');
            expect(scale(5)).toBe('medium');
            expect(scale(10)).toBe('high');
        });

        test('Should return an inverse value', () => {
            const scale = scaleQuantile(domain, range);

            expect(scale.inverse('low')).toBe(1);
            expect(scale.inverse('medium')).toBe(4);
            expect(scale.inverse('high')).toBe(7);
        });

        test('Should check if value is in domain', () => {
            const scale = scaleQuantile(domain, range);

            expect(scale.includes(5)).toBe(true);
            expect(scale.includes(0)).toBe(false);
            expect(scale.includes(15)).toBe(false);
        });

        test('Should generate ticks', () => {
            const scale = scaleQuantile(domain, range);
            const ticks = scale.ticks();

            expect(ticks).toHaveLength(range.length);
            expect(ticks[0]).toBe(1);
        });

        test('Should work with color ranges', () => {
            const colorRange = ['#ff0000', '#00ff00', '#0000ff'];
            const scale = scaleQuantile(domain, colorRange);

            expect(scale(1)).toBe('#ff0000');
            expect(scale(5)).toBe('#00ff00');
            expect(scale(9)).toBe('#0000ff');
        });
    });

});
