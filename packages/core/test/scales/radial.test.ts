import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleRadial,
} from '../../src';

describe('Scale', () => {

    describe('Radial Scale', () => {
        const domain = [0, 100];
        const range: [number, number] = [10, 90];

        test('Should map the domain endpoints and midpoint to the range', () => {
            const scale = scaleRadial(domain, range);

            expect(scale(0)).toBe(10);
            expect(scale(100)).toBe(90);
            expect(scale(50)).toBe(50);
        });

        test('Should clamp by default — values above the max map to the outer radius', () => {
            const scale = scaleRadial(domain, range);

            expect(scale(200)).toBe(90);
        });

        test('Should clamp by default — values below the min map to the inner radius', () => {
            const scale = scaleRadial(domain, range);

            expect(scale(-50)).toBe(10);
        });

        test('Should allow overshoot when clamping is disabled', () => {
            const scale = scaleRadial(domain, range, {
                clamp: false,
            });

            expect(scale(200)).toBeGreaterThan(90);
        });

        test('Should invert a radius back to its magnitude', () => {
            const scale = scaleRadial(domain, range);

            expect(scale.inverse(50)).toBe(50);
            expect(scale.inverse(10)).toBe(0);
            expect(scale.inverse(90)).toBe(100);
        });

        test('Should treat a single-value domain as [0, value]', () => {
            const scale = scaleRadial([100], range);

            expect(scale.domain).toEqual([0, 100]);
            expect(scale(0)).toBe(10);
            expect(scale(100)).toBe(90);
        });

        test('Should produce ticks that lie within the domain', () => {
            const scale = scaleRadial(domain, range);
            const ticks = scale.ticks();

            expect(ticks.length).toBeGreaterThan(0);

            for (const tick of ticks) {
                expect(tick).toBeGreaterThanOrEqual(domain[0]);
                expect(tick).toBeLessThanOrEqual(domain[1]);
            }
        });

    });

});
