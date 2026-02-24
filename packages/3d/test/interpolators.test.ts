import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateVector3,
} from '../src';

import type {
    Vector3,
} from '../src';

describe('interpolateVector3', () => {

    const from: Vector3 = [0, 10, 20];
    const to: Vector3 = [10, 30, 40];
    const interpolate = interpolateVector3(from, to);

    test('t=0 returns from vector', () => {
        expect(interpolate(0)).toEqual([0, 10, 20]);
    });

    test('t=1 returns to vector', () => {
        expect(interpolate(1)).toEqual([10, 30, 40]);
    });

    test('t=0.5 returns midpoint', () => {
        expect(interpolate(0.5)).toEqual([5, 20, 30]);
    });

    test('test function identifies Vector3', () => {
        expect(interpolateVector3.test!([1, 2, 3])).toBe(true);
        expect(interpolateVector3.test!([1, 2])).toBe(false);
        expect(interpolateVector3.test!('hello')).toBe(false);
        expect(interpolateVector3.test!(null)).toBe(false);
    });

});
