import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    formatCoordinate,
    formatTickLabel,
    generatePiTicks,
    generateTicks,
    tickDecimals,
} from './ticks';

describe('Graphing calculator ticks', () => {

    describe('tickDecimals', () => {

        test('Should derive the decimal count from the step', () => {
            expect(tickDecimals(1)).toBe(0);
            expect(tickDecimals(0.1)).toBe(1);
            expect(tickDecimals(0.05)).toBe(2);
            expect(tickDecimals(0.002)).toBe(3);
        });

        test('Should clamp a coarse step to zero decimals', () => {
            expect(tickDecimals(100)).toBe(0);
            expect(tickDecimals(1e9)).toBe(0);
        });

        test('Should cap a vanishing step at fifteen decimals', () => {
            expect(tickDecimals(1e-30)).toBe(15);
        });

        test('Should return zero for a non-positive or non-finite step', () => {
            expect(tickDecimals(0)).toBe(0);
            expect(tickDecimals(-1)).toBe(0);
            expect(tickDecimals(NaN)).toBe(0);
        });

    });

    describe('formatTickLabel', () => {

        test('Should label a value at the precision its step warrants', () => {
            expect(formatTickLabel(0.3, 0.1)).toBe('0.3');
            expect(formatTickLabel(1.25, 0.05)).toBe('1.25');
            expect(formatTickLabel(-2, 1)).toBe('-2');
        });

        test('Should round away detail the step cannot resolve', () => {
            expect(formatTickLabel(1.25, 1)).toBe('1');
            expect(formatTickLabel(0.28, 0.1)).toBe('0.3');
        });

        test('Should strip the trailing zeros toFixed pads with', () => {
            expect(formatTickLabel(1.5, 0.001)).toBe('1.5');
            expect(formatTickLabel(2, 0.01)).toBe('2');
        });

        test('Should normalize a negative zero to zero', () => {
            expect(formatTickLabel(-0, 0.1)).toBe('0');
            expect(formatTickLabel(0, 1)).toBe('0');
        });

        test('Should switch to exponential notation outside the readable band', () => {
            expect(formatTickLabel(1e7, 1e6)).toBe('1e7');
            expect(formatTickLabel(0.00002, 0.00001)).toBe('2e-5');
        });

        test('Should keep the significant digits the step implies in exponential notation', () => {
            expect(formatTickLabel(0.000025, 0.000005)).toBe('2.5e-5');
        });

        test('Should return an empty label for a non-finite value', () => {
            expect(formatTickLabel(NaN, 1)).toBe('');
            expect(formatTickLabel(Infinity, 1)).toBe('');
        });

    });

    describe('generateTicks', () => {

        test('Should emit ticks only inside the exact window', () => {
            const { values } = generateTicks(-1.5, 1.5, 6);

            expect(values[0]).toBeGreaterThanOrEqual(-1.5);
            expect(values[values.length - 1]).toBeLessThanOrEqual(1.5);
        });

        test('Should not expand the window to a nice boundary', () => {
            const { values } = generateTicks(0.3, 2.7, 4);

            expect(values).toEqual([
                0.5,
                1,
                1.5,
                2,
                2.5,
            ]);
        });

        test('Should pick a 1-2-5 step', () => {
            expect(generateTicks(0, 10, 10).step).toBe(1);
            expect(generateTicks(0, 100, 10).step).toBe(10);
            expect(generateTicks(0, 0.5, 10).step).toBe(0.05);
        });

        // Accumulating `value += step` drifts into labels like `0.30000000000000004`.
        test('Should label a tenth-decade step without float drift', () => {
            const { labels } = generateTicks(0, 1, 10);

            expect(labels).toContain('0.3');
            expect(labels).toContain('0.7');
            expect(labels.some(label => label.length > 4)).toBe(false);
        });

        test('Should place minor ticks between the major ones', () => {
            const {
                step,
                values,
                minorValues,
            } = generateTicks(0, 10, 10);

            expect(step).toBe(1);
            expect(minorValues.length).toBeGreaterThan(values.length);
            expect(minorValues.every(value => Math.abs(value % 1) > 1e-9)).toBe(true);
        });

        test('Should return an empty set for a collapsed or inverted window', () => {
            expect(generateTicks(1, 1).values).toHaveLength(0);
            expect(generateTicks(1, -1).values).toHaveLength(0);
            expect(generateTicks(0, NaN).values).toHaveLength(0);
        });

        test('Should stay finite across a deep zoom', () => {
            const {
                step,
                values,
                labels,
            } = generateTicks(-0.001, 0.001, 10);

            expect(step).toBeGreaterThan(0);
            expect(values.every(value => Number.isFinite(value))).toBe(true);
            expect(labels.every(label => label.length > 0)).toBe(true);
        });

    });

    describe('generatePiTicks', () => {

        test('Should label multiples of pi from the fraction ladder', () => {
            const { labels } = generatePiTicks(-2 * Math.PI, 2 * Math.PI, 8);

            expect(labels).toContain('π/2');
            expect(labels).toContain('3π/2');
            expect(labels).toContain('2π');
            expect(labels).toContain('-π');
        });

        test('Should place values on exact multiples of the pi step', () => {
            const {
                step,
                values,
            } = generatePiTicks(-Math.PI, Math.PI, 4);

            values.forEach(value => expect(Math.abs(value % step)).toBeLessThan(1e-9));
        });

        test('Should label the origin as zero', () => {
            const { labels } = generatePiTicks(-Math.PI, Math.PI, 4);

            expect(labels).toContain('0');
        });

        test('Should reduce the fraction rather than repeat a denominator', () => {
            const { labels } = generatePiTicks(0, Math.PI, 4);

            expect(labels).toContain('π/2');
            expect(labels).not.toContain('2π/4');
        });

        test('Should fall back to decimal ticks below the finest rung of the ladder', () => {
            const { labels } = generatePiTicks(-0.001, 0.001, 10);

            expect(labels.some(label => label.includes('π'))).toBe(false);
        });

        test('Should return an empty set for a collapsed window', () => {
            expect(generatePiTicks(1, 1).values).toHaveLength(0);
        });

    });

    describe('formatCoordinate', () => {

        test('Should read finer than the axis labels at the same step', () => {
            expect(formatCoordinate(1.234, 1)).toBe('1.23');
            expect(formatTickLabel(1.234, 1)).toBe('1');
        });

        test('Should still normalize a negative zero', () => {
            expect(formatCoordinate(-0, 1)).toBe('0');
        });

    });

});
