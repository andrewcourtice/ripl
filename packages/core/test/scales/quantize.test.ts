import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleQuantize,
} from '../../src';

describe('Scale', () => {

    describe('Quantize Scale', () => {
        const domain = [0, 100];
        const range = ['low', 'medium', 'high'];

        test('Should map domain values to uniform buckets', () => {
            const scale = scaleQuantize(domain, range);

            expect(scale(0)).toBe('low');
            expect(scale(20)).toBe('low');
            expect(scale(30)).toBe('low');
        });

        test('Should map middle values to middle bucket', () => {
            const scale = scaleQuantize(domain, range);

            expect(scale(40)).toBe('medium');
            expect(scale(50)).toBe('medium');
            expect(scale(60)).toBe('medium');
        });

        test('Should map high values to high bucket', () => {
            const scale = scaleQuantize(domain, range);

            expect(scale(70)).toBe('high');
            expect(scale(80)).toBe('high');
            expect(scale(100)).toBe('high');
        });

        test('Should handle boundary values correctly', () => {
            const scale = scaleQuantize(domain, range);

            expect(scale(33.33)).toBe('low');
            expect(scale(33.34)).toBe('medium');
            expect(scale(66.66)).toBe('medium');
            expect(scale(66.67)).toBe('high');
        });

        test('Should return an inverse value', () => {
            const scale = scaleQuantize(domain, range);

            expect(scale.inverse('low')).toBe(0);
            expect(scale.inverse('medium')).toBeCloseTo(33.33, 1);
            expect(scale.inverse('high')).toBeCloseTo(66.67, 1);
        });

        test('Should check if value is in domain', () => {
            const scale = scaleQuantize(domain, range);

            expect(scale.includes(50)).toBe(true);
            expect(scale.includes(-10)).toBe(false);
            expect(scale.includes(150)).toBe(false);
        });

        test('Should generate ticks', () => {
            const scale = scaleQuantize(domain, range);
            const ticks = scale.ticks();

            expect(ticks).toHaveLength(range.length);
            expect(ticks[0]).toBe(0);
            expect(ticks[1]).toBeCloseTo(33.33, 1);
            expect(ticks[2]).toBeCloseTo(66.67, 1);
        });

        test('Should work with color ranges', () => {
            const colorRange = ['#ff0000', '#ffff00', '#00ff00'];
            const scale = scaleQuantize(domain, colorRange);

            expect(scale(15)).toBe('#ff0000');
            expect(scale(50)).toBe('#ffff00');
            expect(scale(85)).toBe('#00ff00');
        });

        test('Should work with two buckets', () => {
            const scale = scaleQuantize(domain, ['negative', 'positive']);

            expect(scale(25)).toBe('negative');
            expect(scale(75)).toBe('positive');
        });
    });

});
