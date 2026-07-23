import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleSymlog,
} from '../../src';

describe('Scale', () => {

    describe('Symlog Scale', () => {
        const domain = [-100, 100];
        const range = [0, 200];

        test('Should map zero to the range midpoint for a symmetric domain', () => {
            const scale = scaleSymlog(domain, range);

            expect(scale(0)).toBeCloseTo(100, 6);
        });

        test('Should map the domain endpoints to the range endpoints', () => {
            const scale = scaleSymlog(domain, range);

            expect(scale(-100)).toBeCloseTo(0, 6);
            expect(scale(100)).toBeCloseTo(200, 6);
        });

        test('Should be symmetric about zero', () => {
            const scale = scaleSymlog(domain, range);

            const belowMid = 100 - scale(-40);
            const aboveMid = scale(40) - 100;

            expect(belowMid).toBeCloseTo(aboveMid, 6);
        });

        test('Should be monotonically increasing across the domain', () => {
            const scale = scaleSymlog(domain, range);

            let previous = -Infinity;

            for (let value = -100; value <= 100; value += 10) {
                const mapped = scale(value);

                expect(mapped).toBeGreaterThan(previous);

                previous = mapped;
            }
        });

        test('Should invert convert for negative, zero and positive values', () => {
            const scale = scaleSymlog(domain, range);

            for (const value of [-100, -37, -1, 0, 1, 37, 100]) {
                expect(scale.inverse(scale(value))).toBeCloseTo(value, 6);
            }
        });

        test('A larger constant widens the near-zero linear region', () => {
            const tightScale = scaleSymlog(domain, range, {
                constant: 1,
            });

            const wideScale = scaleSymlog(domain, range, {
                constant: 100,
            });

            // With a larger constant the mapping stays closer to linear near zero, so a small value
            // remains closer to the midpoint instead of being pushed outward by log compression.
            const tightDeviation = Math.abs(tightScale(1) - 100);
            const wideDeviation = Math.abs(wideScale(1) - 100);

            expect(wideDeviation).toBeLessThan(tightDeviation);
        });

    });

});
