import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    typeIsVector3,
    vec3Add,
    vec3Cross,
    vec3Distance,
    vec3Dot,
    vec3Length,
    vec3Lerp,
    vec3Negate,
    vec3Normalize,
    vec3Scale,
    vec3Sub,
} from '../../src';

describe('Vector3', () => {

    test('vec3Add adds components', () => {
        expect(vec3Add([1, 2, 3], [4, 5, 6])).toEqual([5, 7, 9]);
    });

    test('vec3Sub subtracts components', () => {
        expect(vec3Sub([5, 7, 9], [4, 5, 6])).toEqual([1, 2, 3]);
    });

    test('vec3Scale scales components', () => {
        expect(vec3Scale([1, 2, 3], 2)).toEqual([2, 4, 6]);
    });

    test('vec3Dot computes dot product', () => {
        expect(vec3Dot([1, 0, 0], [0, 1, 0])).toBe(0);
        expect(vec3Dot([1, 2, 3], [4, 5, 6])).toBe(32);
    });

    test('vec3Cross computes cross product', () => {
        expect(vec3Cross([1, 0, 0], [0, 1, 0])).toEqual([0, 0, 1]);
        // Anti-commutativity
        expect(vec3Cross([0, 1, 0], [1, 0, 0])).toEqual([0, 0, -1]);
    });

    test('vec3Length computes magnitude', () => {
        expect(vec3Length([3, 4, 0])).toBe(5);
        expect(vec3Length([0, 0, 0])).toBe(0);
        expect(vec3Length([1, 0, 0])).toBe(1);
    });

    test('vec3Normalize returns unit vector', () => {
        const result = vec3Normalize([3, 0, 0]);
        expect(result[0]).toBeCloseTo(1);
        expect(result[1]).toBeCloseTo(0);
        expect(result[2]).toBeCloseTo(0);
    });

    test('vec3Normalize handles zero vector', () => {
        expect(vec3Normalize([0, 0, 0])).toEqual([0, 0, 0]);
    });

    test('vec3Lerp interpolates between vectors', () => {
        const from = [0, 0, 0] as [number, number, number];
        const to = [10, 20, 30] as [number, number, number];

        expect(vec3Lerp(from, to, 0)).toEqual([0, 0, 0]);
        expect(vec3Lerp(from, to, 1)).toEqual([10, 20, 30]);
        expect(vec3Lerp(from, to, 0.5)).toEqual([5, 10, 15]);
    });

    test('vec3Negate negates components', () => {
        expect(vec3Negate([1, -2, 3])).toEqual([-1, 2, -3]);
    });

    test('vec3Distance computes distance between points', () => {
        expect(vec3Distance([0, 0, 0], [3, 4, 0])).toBe(5);
    });

    test('typeIsVector3 identifies Vector3 tuples', () => {
        expect(typeIsVector3([1, 2, 3])).toBe(true);
        expect(typeIsVector3([1, 2])).toBe(false);
        expect(typeIsVector3([1, 2, 3, 4])).toBe(false);
        expect(typeIsVector3('hello')).toBe(false);
        expect(typeIsVector3(null)).toBe(false);
        expect(typeIsVector3([1, 'a', 3])).toBe(false);
    });

});
