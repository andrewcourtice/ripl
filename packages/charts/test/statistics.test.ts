import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    bin,
    boxplotStats,
    deviation,
    kde,
    linearRegression,
    mean,
    quantile,
    rollup,
} from '../src';

describe('mean and deviation', () => {

    test('Should compute the arithmetic mean', () => {
        expect(mean([2, 4, 6])).toBe(4);
        expect(mean([])).toBeNaN();
    });

    test('Should compute the population standard deviation', () => {
        expect(deviation([2, 4, 6])).toBeCloseTo(Math.sqrt(8 / 3), 6);
        expect(deviation([5])).toBe(0);
    });

});

describe('quantile', () => {

    test('Should interpolate between order statistics', () => {
        expect(quantile([1, 2, 3, 4], 0.5)).toBe(2.5);
        expect(quantile([1, 2, 3, 4, 5], 0.25)).toBe(2);
        expect(quantile([1, 2, 3, 4, 5], 1)).toBe(5);
    });

});

describe('bin', () => {

    test('Should bin values into explicit thresholds', () => {
        const bins = bin([1, 2, 3, 4, 5], {
            thresholds: [0, 2, 4, 6],
        });

        expect(bins.map(current => current.count)).toEqual([1, 2, 2]);
        expect(bins[1].values).toEqual([2, 3]);
    });

    test('Should derive nice bins from the data', () => {
        const bins = bin([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

        expect(bins.length).toBeGreaterThan(1);
        expect(bins.reduce((sum, current) => sum + current.count, 0)).toBe(11);
    });

    test('Should return no bins for empty input', () => {
        expect(bin([])).toEqual([]);
    });

});

describe('boxplotStats', () => {

    test('Should compute the five-number summary', () => {
        const stats = boxplotStats([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        expect(stats.q1).toBe(3);
        expect(stats.median).toBe(5);
        expect(stats.q3).toBe(7);
        expect(stats.iqr).toBe(4);
        expect(stats.min).toBe(1);
        expect(stats.max).toBe(9);
        expect(stats.outliers).toEqual([]);
    });

    test('Should split values beyond 1.5x IQR out as outliers', () => {
        const stats = boxplotStats([1, 2, 3, 4, 5, 100]);

        expect(stats.outliers).toEqual([100]);
        expect(stats.max).toBe(5);
    });

});

describe('linearRegression', () => {

    test('Should fit a perfect line exactly', () => {
        const fit = linearRegression([
            [0, 1],
            [1, 3],
            [2, 5],
            [3, 7],
        ]);

        expect(fit.slope).toBeCloseTo(2, 6);
        expect(fit.intercept).toBeCloseTo(1, 6);
        expect(fit.r2).toBeCloseTo(1, 6);
        expect(fit.predict(4)).toBeCloseTo(9, 6);
    });

});

describe('kde', () => {

    test('Should produce a positive density that peaks near the data', () => {
        const density = kde([1, 2, 3, 4, 5]);

        expect(density(3)).toBeGreaterThan(0);
        expect(density(3)).toBeGreaterThan(density(50));
    });

    test('Should return zero density for empty input', () => {
        expect(kde([])(0)).toBe(0);
    });

});

describe('rollup', () => {

    test('Should group and reduce', () => {
        const totals = rollup(
            [1, 2, 3, 4, 5, 6],
            value => value % 2 === 0 ? 'even' : 'odd',
            group => group.reduce((sum, value) => sum + value, 0)
        );

        expect(totals.get('even')).toBe(12);
        expect(totals.get('odd')).toBe(9);
    });

});
