import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleBand,
} from '../../src';

describe('Scale', () => {

    describe('Band Scale', () => {
        const domain = ['A', 'B', 'C', 'D'];
        const range = [0, 100];

        test('Should scale a domain to a range', () => {
            const scale = scaleBand(domain, range);

            expect(scale(domain[0])).toBe(0);
            expect(scale(domain[3])).toBe(75);
        });

        test('Should return bandwidth', () => {
            const scale = scaleBand(domain, range);

            expect(scale.bandwidth).toBe(25);
        });

        test('Should return step', () => {
            const scale = scaleBand(domain, range);

            expect(scale.step).toBe(25);
        });

        test('Should apply inner padding', () => {
            const scale = scaleBand(domain, range, {
                innerPadding: 0.2,
            });

            expect(scale.step).toBeCloseTo(26.32, 1);
            expect(scale.bandwidth).toBeCloseTo(21.05, 1);
        });

        test('Should apply outer padding', () => {
            const scale = scaleBand(domain, range, {
                outerPadding: 0.5,
            });

            const step = 100 / (domain.length + 0.5 * 2);

            expect(scale.step).toBe(step);
            expect(scale.bandwidth).toBe(step);
        });

        test('Should apply alignment', () => {
            const scale = scaleBand(domain, range, {
                outerPadding: 0.5,
                alignment: 0,
            });

            expect(scale(domain[0])).toBe(0);
        });

        test('Should return an inverse value', () => {
            const scale = scaleBand(domain, range);

            expect(scale.inverse(0)).toBe(domain[0]);
            expect(scale.inverse(75)).toBe(domain[3]);
        });
    });

});
