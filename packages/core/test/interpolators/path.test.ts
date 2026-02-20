import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateBorderRadius,
    interpolateCirclePoint,
    interpolatePath,
    interpolatePoints,
    interpolateWaypoint,
} from '../../src';

import type {
    Point,
} from '../../src';

describe('Interpolators', () => {

    describe('Points', () => {

        test('test() should return true for point arrays', () => {
            expect(interpolatePoints.test!([[0, 0], [1, 1]])).toBe(true);
            expect(interpolatePoints.test!([[0, 0]])).toBe(true);
        });

        test('test() should return false for non-point arrays', () => {
            expect(interpolatePoints.test!([1, 2, 3])).toBe(false);
            expect(interpolatePoints.test!('hello')).toBe(false);
            expect(interpolatePoints.test!(42)).toBe(false);
        });

        test('Should interpolate between equal-length point sets', () => {
            const setA: Point[] = [[0, 0], [10, 10]];
            const setB: Point[] = [[20, 20], [30, 30]];
            const interpolator = interpolatePoints(setA, setB);

            const start = interpolator(0);
            expect(start[0][0]).toBeCloseTo(0);
            expect(start[0][1]).toBeCloseTo(0);

            const end = interpolator(1);
            expect(end[0][0]).toBeCloseTo(20);
            expect(end[0][1]).toBeCloseTo(20);

            const mid = interpolator(0.5);
            expect(mid[0][0]).toBeCloseTo(10);
            expect(mid[0][1]).toBeCloseTo(10);
        });

        test('Should handle different-length point sets', () => {
            const setA: Point[] = [[0, 0], [10, 10]];
            const setB: Point[] = [[20, 20], [30, 30], [40, 40]];
            const interpolator = interpolatePoints(setA, setB);

            const result = interpolator(1);
            expect(result).toHaveLength(3);
        });

    });

    describe('Waypoint', () => {

        test('Should return first point at position 0', () => {
            const points: Point[] = [[0, 0], [10, 10], [20, 0]];
            const interpolator = interpolateWaypoint(points);

            const result = interpolator(0);
            expect(result[0]).toBeCloseTo(0);
            expect(result[1]).toBeCloseTo(0);
        });

        test('Should return last point at position 1', () => {
            const points: Point[] = [[0, 0], [10, 10], [20, 0]];
            const interpolator = interpolateWaypoint(points);

            const result = interpolator(1);
            expect(result[0]).toBe(20);
            expect(result[1]).toBe(0);
        });

        test('Should interpolate along the path', () => {
            const points: Point[] = [[0, 0], [10, 0]];
            const interpolator = interpolateWaypoint(points);

            const mid = interpolator(0.5);
            expect(mid[0]).toBeCloseTo(5);
            expect(mid[1]).toBeCloseTo(0);
        });

    });

    describe('Path', () => {

        test('Should return full path at position 1', () => {
            const points: Point[] = [[0, 0], [10, 10], [20, 0]];
            const interpolator = interpolatePath(points);

            const result = interpolator(1);
            expect(result).toHaveLength(3);
            expect(result).toEqual(points);
        });

        test('Should return partial path at intermediate positions', () => {
            const points: Point[] = [[0, 0], [10, 10], [20, 0], [30, 10]];
            const interpolator = interpolatePath(points);

            const result = interpolator(0.5);
            // At 0.5, should include points up to ceil(3 * 0.5) = 2, plus waypoint
            expect(result.length).toBeGreaterThanOrEqual(2);
        });

    });

    describe('CirclePoint', () => {

        test('Should produce points on a circle', () => {
            const interpolator = interpolateCirclePoint(50, 50, 25);

            // At position 0, should be at top of circle (50, 25)
            const top = interpolator(0);
            expect(top[0]).toBeCloseTo(50);
            expect(top[1]).toBeCloseTo(25);

            // At position 0.25, should be at right (75, 50)
            const right = interpolator(0.25);
            expect(right[0]).toBeCloseTo(75);
            expect(right[1]).toBeCloseTo(50);

            // At position 0.5, should be at bottom (50, 75)
            const bottom = interpolator(0.5);
            expect(bottom[0]).toBeCloseTo(50);
            expect(bottom[1]).toBeCloseTo(75);
        });

    });

    describe('BorderRadius', () => {

        test('test() should return true for numbers', () => {
            expect(interpolateBorderRadius.test!(5)).toBe(true);
            expect(interpolateBorderRadius.test!(0)).toBe(true);
        });

        test('test() should return true for number arrays up to length 4', () => {
            expect(interpolateBorderRadius.test!([5])).toBe(true);
            expect(interpolateBorderRadius.test!([5, 10])).toBe(true);
            expect(interpolateBorderRadius.test!([5, 10, 15, 20])).toBe(true);
        });

        test('test() should return false for non-numbers', () => {
            expect(interpolateBorderRadius.test!('hello')).toBe(false);
            expect(interpolateBorderRadius.test!(null)).toBe(false);
        });

        test('Should interpolate border radius values', () => {
            const interpolator = interpolateBorderRadius([0, 0, 0, 0], [10, 20, 30, 40]);

            const start = interpolator(0);
            expect(start).toEqual([0, 0, 0, 0]);

            const end = interpolator(1);
            expect(end).toEqual([10, 20, 30, 40]);

            const mid = interpolator(0.5);
            expect(mid).toEqual([5, 10, 15, 20]);
        });

    });

});
