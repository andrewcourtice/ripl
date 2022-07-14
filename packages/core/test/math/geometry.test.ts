import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    arePointsEqual,
    Point,
} from '../../src';

describe('Math', () => {

    describe('Geometry', () => {

        test('Check whether 2 2D points are equal', () => {
            const point1 = [3, 5] as Point;
            const point2 = point1.slice() as Point;

            expect(arePointsEqual(point1, point2)).toBe(true);
        });

    });

});