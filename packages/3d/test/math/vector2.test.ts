import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    typeIsVector2,
    vec2Add,
    vec2Dot,
    vec2Length,
    vec2Lerp,
    vec2Multiply,
    vec2Normalize,
    vec2Scale,
    vec2Sub,
} from '../../src';

describe('Vector2', () => {

    test('Should add and subtract component-wise', () => {
        expect(vec2Add([1, 2], [3, 4])).toEqual([4, 6]);
        expect(vec2Sub([3, 4], [1, 2])).toEqual([2, 2]);
    });

    test('Should scale and multiply', () => {
        expect(vec2Scale([2, 3], 2)).toEqual([4, 6]);
        expect(vec2Multiply([2, 3], [4, 5])).toEqual([8, 15]);
    });

    test('Should compute the dot product', () => {
        expect(vec2Dot([1, 0], [0, 1])).toBe(0);
        expect(vec2Dot([2, 3], [4, 5])).toBe(23);
    });

    test('Should compute length', () => {
        expect(vec2Length([3, 4])).toBe(5);
    });

    test('Should normalize to unit length', () => {
        const normalized = vec2Normalize([3, 4]);

        expect(vec2Length(normalized)).toBeCloseTo(1, 12);
        expect(normalized).toEqual([0.6, 0.8]);
    });

    test('Should return the zero vector when normalizing zero length', () => {
        expect(vec2Normalize([0, 0])).toEqual([0, 0]);
    });

    test('Should interpolate between two vectors', () => {
        expect(vec2Lerp([0, 0], [10, 20], 0.5)).toEqual([5, 10]);
        expect(vec2Lerp([0, 0], [10, 20], 0)).toEqual([0, 0]);
        expect(vec2Lerp([0, 0], [10, 20], 1)).toEqual([10, 20]);
    });

    describe('typeIsVector2', () => {

        test('Should identify a two-number tuple', () => {
            expect(typeIsVector2([1, 2])).toBe(true);
        });

        test('Should reject other shapes', () => {
            expect(typeIsVector2([1, 2, 3])).toBe(false);
            expect(typeIsVector2([1])).toBe(false);
            expect(typeIsVector2(['a', 'b'])).toBe(false);
            expect(typeIsVector2(null)).toBe(false);
        });

    });

});
