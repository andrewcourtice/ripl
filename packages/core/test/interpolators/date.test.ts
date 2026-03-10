import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateDate,
} from '../../src';

describe('interpolateDate', () => {

    test('Should return start date at t=0', () => {
        const start = new Date(2020, 0, 1);
        const end = new Date(2020, 11, 31);

        const interpolator = interpolateDate(start, end);
        const result = interpolator(0);

        expect(result.getTime()).toBe(start.getTime());
    });

    test('Should return end date at t=1', () => {
        const start = new Date(2020, 0, 1);
        const end = new Date(2020, 11, 31);

        const interpolator = interpolateDate(start, end);
        const result = interpolator(1);

        expect(result.getTime()).toBe(end.getTime());
    });

    test('Should interpolate midpoint between two dates', () => {
        const start = new Date(2020, 0, 1);
        const end = new Date(2020, 0, 11);

        const interpolator = interpolateDate(start, end);
        const result = interpolator(0.5);

        const expectedTime = start.getTime() + (end.getTime() - start.getTime()) / 2;

        expect(result.getTime()).toBeCloseTo(expectedTime, -1);
    });

    test('Should return a Date instance', () => {
        const start = new Date(2020, 0, 1);
        const end = new Date(2021, 0, 1);

        const interpolator = interpolateDate(start, end);

        expect(interpolator(0.5)).toBeInstanceOf(Date);
    });

    test('Should have a test predicate that identifies Dates', () => {
        expect(interpolateDate.test?.(new Date())).toBe(true);
        expect(interpolateDate.test?.(42)).toBe(false);
        expect(interpolateDate.test?.('2020-01-01')).toBe(false);
        expect(interpolateDate.test?.(null)).toBe(false);
    });

});
