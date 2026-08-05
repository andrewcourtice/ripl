import {
    describe,
    expect,
    test,
} from 'vitest';

import type {
    Point,
} from '../../src';

import {
    arePointsEqual,
    Box,
    getContainingBox,
    getPadAngleAtRadius,
    getThetaPoint,
    isPointInBox,
    matrixIdentity,
    matrixRotate,
    matrixScale,
    matrixTranslate,
    transformBox,
} from '../../src';

function edgesOf(box: Box) {
    return [
        box.left,
        box.top,
        box.right,
        box.bottom,
    ].map(value => Math.round(value * 1e6) / 1e6);
}

describe('Math', () => {

    describe('Geometry', () => {

        test('Check whether 2 2D points are equal', () => {
            const point1 = [3, 5] as Point;
            const point2 = point1.slice() as Point;

            expect(arePointsEqual(point1, point2)).toBe(true);
        });

        describe('transformBox', () => {

            test('Should return the box unchanged for a null matrix', () => {
                const box = new Box(20, 10, 60, 40);

                expect(transformBox(box, null)).toBe(box);
            });

            test('Should return an equivalent box for the identity matrix', () => {
                const box = new Box(20, 10, 60, 40);

                expect(edgesOf(transformBox(box, matrixIdentity()))).toEqual([10, 20, 40, 60]);
            });

            test('Should translate every edge', () => {
                const box = new Box(20, 10, 60, 40);

                expect(edgesOf(transformBox(box, matrixTranslate(100, 5)))).toEqual([110, 25, 140, 65]);
            });

            test('Should scale every edge about the origin', () => {
                const box = new Box(20, 10, 60, 40);

                expect(edgesOf(transformBox(box, matrixScale(2, 3)))).toEqual([20, 60, 80, 180]);
            });

            test('Should refit the box around a 90 degree rotation', () => {
                const box = new Box(0, 0, 10, 40);

                // 90deg about the origin maps (x, y) -> (-y, x), so the box spans x [-10, 0], y [0, 40].
                expect(edgesOf(transformBox(box, matrixRotate(Math.PI / 2)))).toEqual([-10, 0, 0, 40]);
            });

            test('Should return a conservative axis-aligned box for a 45 degree rotation', () => {
                const box = new Box(-10, -10, 10, 10);
                const result = transformBox(box, matrixRotate(Math.PI / 4));
                const diagonal = Math.sqrt(box.width ** 2 + box.height ** 2);

                // A rotated square no longer fits its original AABB; the refit box grows to the diagonal.
                expect(result.width).toBeCloseTo(diagonal);
                expect(result.height).toBeCloseTo(diagonal);
                expect(result.width).toBeGreaterThan(box.width);
            });

        });

        describe('getContainingBox', () => {

            test('Should union every box in the collection', () => {
                const boxes = [
                    new Box(20, 10, 40, 30),
                    new Box(5, 50, 25, 90),
                ];

                expect(edgesOf(getContainingBox(boxes, box => box))).toEqual([10, 5, 90, 40]);
            });

            test('Should return an empty box for an empty collection', () => {
                expect(edgesOf(getContainingBox([], box => box as Box))).toEqual([0, 0, 0, 0]);
            });

        });

        describe('getPadAngleAtRadius', () => {

            test('Should return the arcsine of the half gap over the radius', () => {
                expect(getPadAngleAtRadius(10, 100)).toBeCloseTo(Math.asin(0.05), 12);
                expect(getPadAngleAtRadius(10, 25)).toBeCloseTo(Math.asin(0.2), 12);
                expect(getPadAngleAtRadius(3, 6)).toBeCloseTo(Math.asin(0.25), 12);
            });

            test('Should leave the trimmed endpoint a half gap from the centreline at every radius', () => {
                const padWidth = 7;

                [4, 20, 90, 400].forEach(radius => {
                    const [, y] = getThetaPoint(getPadAngleAtRadius(padWidth, radius), radius);

                    expect(y).toBeCloseTo(padWidth / 2, 9);
                });
            });

            test('Should saturate at a quarter turn once the radius sits inside the gap', () => {
                expect(getPadAngleAtRadius(10, 5)).toBe(Math.PI / 2);
                expect(getPadAngleAtRadius(10, 1)).toBe(Math.PI / 2);
                expect(getPadAngleAtRadius(10, 0)).toBe(Math.PI / 2);
                expect(getPadAngleAtRadius(Infinity, 50)).toBe(Math.PI / 2);
            });

            test('Should return zero for an infinite radius', () => {
                expect(getPadAngleAtRadius(10, Infinity)).toBe(0);
            });

            test('Should return zero for a gap or radius that cannot produce an inset', () => {
                expect(getPadAngleAtRadius(0, 100)).toBe(0);
                expect(getPadAngleAtRadius(-5, 100)).toBe(0);
                expect(getPadAngleAtRadius(NaN, 100)).toBe(0);
                expect(getPadAngleAtRadius(10, -1)).toBe(0);
                expect(getPadAngleAtRadius(10, NaN)).toBe(0);
            });

        });

        describe('isPointInBox', () => {

            test('Should include points inside the box', () => {
                expect(isPointInBox([20, 30], new Box(20, 10, 60, 40))).toBe(true);
            });

            test('Should include points on the boundary', () => {
                expect(isPointInBox([10, 20], new Box(20, 10, 60, 40))).toBe(true);
                expect(isPointInBox([40, 60], new Box(20, 10, 60, 40))).toBe(true);
            });

            test('Should exclude points outside the box', () => {
                expect(isPointInBox([9, 30], new Box(20, 10, 60, 40))).toBe(false);
                expect(isPointInBox([20, 61], new Box(20, 10, 60, 40))).toBe(false);
            });

        });

    });

});
