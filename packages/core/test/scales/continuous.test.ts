import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleContinuous,
} from '../../src';

describe('Scale', () => {

    describe('Linear Scale', () => {
        const domain = [-5, 10];
        const range = [30, 500];

        test('Should scale a domain to a range', () => {
            const scale = scaleContinuous(domain, range);

            expect(scale(domain[0])).toBe(range[0]);
            expect(scale(domain[1])).toBe(range[1]);
        });

        test('Should clamp values outside the range', () => {
            const scale = scaleContinuous(domain, range, {
                clamp: true,
            });

            expect(scale(-10)).toBe(range[0]);
            expect(scale(15)).toBe(range[1]);
        });

        test('Should return an inverse value', () => {
            const scale = scaleContinuous(domain, range);

            expect(scale.inverse(range[0])).toBe(domain[0]);
            expect(scale.inverse(range[1])).toBe(domain[1]);
        });

        test('Should nice the domain at construction when requested', () => {
            const scale = scaleContinuous([2, 97], [0, 100], {
                nice: true,
            });

            // Domain expands outward to round, tick-aligned boundaries.
            expect(scale.domain[0]).toBe(0);
            expect(scale.domain[1]).toBe(100);
            expect(scale(0)).toBe(0);
            expect(scale(100)).toBe(100);
        });

        test('Should leave the domain untouched without the nice option', () => {
            const scale = scaleContinuous([2, 97], [0, 100]);

            expect(scale.domain).toEqual([2, 97]);
        });

        test('Should invert consistently with padToTicks over a descending range', () => {
            // A y-axis maps data (ascending) to pixels (descending, top < bottom). `inverse` must be
            // the true inverse of `convert` and must never return NaN — regression for a bug where the
            // invert method re-padded the *range*, producing a negative step over a descending range.
            const scale = scaleContinuous([0, 100], [560, 40], {
                padToTicks: 10,
            });

            for (const value of [0, 25, 50, 75, 100]) {
                const inverted = scale.inverse(scale(value));

                expect(Number.isNaN(inverted)).toBe(false);
                expect(inverted).toBeCloseTo(value, 6);
            }
        });

    });

    describe('Degenerate domain', () => {
        const range = [300, 20];

        test('Should produce a single finite tick rather than NaN', () => {
            const scale = scaleContinuous([0, 0], range);
            const ticks = scale.ticks(10);

            // `padDomain` used to divide the bounds by a zero step, so a zero-width domain emitted a
            // single `NaN` tick. Rendered as an axis label that read "NaN".
            expect(ticks.length).toBe(1);
            ticks.forEach(tick => expect(Number.isNaN(tick)).toBe(false));
        });

        test('Should map every value to the range start rather than NaN', () => {
            const scale = scaleContinuous([0, 0], range);

            // `(value - min) / 0` is NaN at the bound and +/-Infinity either side of it. There is no
            // meaningful distribution across a zero-width domain, so collapse onto the range start.
            expect(scale(0)).toBe(range[0]);
            expect(Number.isFinite(scale(5))).toBe(true);
            expect(Number.isFinite(scale(-5))).toBe(true);
        });

        test('Should stay finite for a non-zero repeated value', () => {
            const scale = scaleContinuous([7, 7], range);

            expect(scale(7)).toBe(range[0]);
            scale.ticks(10).forEach(tick => expect(Number.isNaN(tick)).toBe(false));
        });

        test('Should stay finite when padded to ticks', () => {
            const scale = scaleContinuous([0, 0], range, {
                padToTicks: 10,
            });

            expect(Number.isFinite(scale(0))).toBe(true);
            scale.ticks(10).forEach(tick => expect(Number.isNaN(tick)).toBe(false));
        });

    });

});
