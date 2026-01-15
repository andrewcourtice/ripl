import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleThreshold,
} from '../../src';

describe('Scale', () => {

    describe('Threshold Scale', () => {
        const domain = [0, 50, 100];
        const range = ['low', 'medium', 'high', 'very-high'];

        test('Should map values below first threshold', () => {
            const scale = scaleThreshold(domain, range);

            expect(scale(-10)).toBe('low');
            expect(scale(0)).toBe('medium');
        });

        test('Should map values to correct buckets', () => {
            const scale = scaleThreshold(domain, range);

            expect(scale(25)).toBe('medium');
            expect(scale(50)).toBe('high');
            expect(scale(75)).toBe('high');
            expect(scale(100)).toBe('very-high');
        });

        test('Should map values above last threshold', () => {
            const scale = scaleThreshold(domain, range);

            expect(scale(150)).toBe('very-high');
            expect(scale(1000)).toBe('very-high');
        });

        test('Should handle boundary values correctly', () => {
            const scale = scaleThreshold(domain, range);

            expect(scale(49.99)).toBe('medium');
            expect(scale(50)).toBe('high');
            expect(scale(99.99)).toBe('high');
            expect(scale(100)).toBe('very-high');
        });

        test('Should handle unsorted thresholds', () => {
            const unsortedDomain = [100, 0, 50];
            const scale = scaleThreshold(unsortedDomain, range);

            expect(scale(-10)).toBe('low');
            expect(scale(25)).toBe('medium');
            expect(scale(75)).toBe('high');
            expect(scale(150)).toBe('very-high');
        });

        test('Should return an inverse value', () => {
            const scale = scaleThreshold(domain, range);

            expect(scale.inverse('low')).toBe(0);
            expect(scale.inverse('medium')).toBe(0);
            expect(scale.inverse('high')).toBe(50);
            expect(scale.inverse('very-high')).toBe(100);
        });

        test('Should check if value is in domain', () => {
            const scale = scaleThreshold(domain, range);

            expect(scale.includes(50)).toBe(true);
            expect(scale.includes(75)).toBe(true);
        });

        test('Should generate ticks', () => {
            const scale = scaleThreshold(domain, range);
            const ticks = scale.ticks();

            expect(ticks).toHaveLength(domain.length);
            expect(ticks).toEqual([0, 50, 100]);
        });

        test('Should work with color ranges', () => {
            const colorRange = ['green', 'yellow', 'orange', 'red'];
            const scale = scaleThreshold(domain, colorRange);

            expect(scale(-10)).toBe('green');
            expect(scale(25)).toBe('yellow');
            expect(scale(75)).toBe('orange');
            expect(scale(150)).toBe('red');
        });

        test('Should work with single threshold', () => {
            const scale = scaleThreshold([50], ['low', 'high']);

            expect(scale(25)).toBe('low');
            expect(scale(75)).toBe('high');
        });
    });

});
