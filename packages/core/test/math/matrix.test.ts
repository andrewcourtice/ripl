import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    matrixApplyToPoint,
    matrixIdentity,
    matrixInvert,
    matrixIsIdentity,
    matrixMultiply,
    matrixRotate,
    matrixScale,
    matrixTranslate,
} from '../../src';

describe('Math', () => {

    describe('Matrix', () => {

        test('identity is the neutral transform', () => {
            expect(matrixIdentity()).toEqual([1, 0, 0, 1, 0, 0]);
            expect(matrixIsIdentity(matrixIdentity())).toBe(true);
            expect(matrixIsIdentity(matrixTranslate(1, 0))).toBe(false);
        });

        test('applies translation to a point', () => {
            expect(matrixApplyToPoint(matrixTranslate(10, 20), [1, 2])).toEqual([11, 22]);
        });

        test('applies scale to a point', () => {
            expect(matrixApplyToPoint(matrixScale(2, 3), [4, 5])).toEqual([8, 15]);
        });

        test('applies a quarter-turn rotation to a point', () => {
            const [x, y] = matrixApplyToPoint(matrixRotate(Math.PI / 2), [1, 0]);
            expect(x).toBeCloseTo(0);
            expect(y).toBeCloseTo(1);
        });

        test('multiply composes transforms (translate then scale)', () => {
            // Post-multiply: apply the right operand first, then the left — matching how
            // successive translate/scale calls accumulate on a canvas transform.
            const composed = matrixMultiply(matrixTranslate(10, 0), matrixScale(2, 2));
            expect(matrixApplyToPoint(composed, [3, 4])).toEqual([16, 8]);
        });

        test('multiplying by identity is a no-op', () => {
            const matrix = matrixMultiply(matrixTranslate(5, 6), matrixScale(2, 3));
            expect(matrixMultiply(matrix, matrixIdentity())).toEqual(matrix);
            expect(matrixMultiply(matrixIdentity(), matrix)).toEqual(matrix);
        });

        test('invert round-trips a point back to itself', () => {
            const matrix = matrixMultiply(matrixTranslate(30, -10), matrixScale(2, 4));
            const inverse = matrixInvert(matrix)!;

            expect(inverse).not.toBeNull();

            const forward = matrixApplyToPoint(matrix, [7, 9]);
            const [x, y] = matrixApplyToPoint(inverse, forward);

            expect(x).toBeCloseTo(7);
            expect(y).toBeCloseTo(9);
        });

        test('invert returns null for a singular matrix', () => {
            expect(matrixInvert(matrixScale(0, 0))).toBeNull();
        });

    });

});
