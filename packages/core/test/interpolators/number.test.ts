import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateNumber,
} from '../../src';

describe('Interpolators', () => {

    describe('Number', () => {

        test('Interpolate between 2 numbers about a given position', () => {
            const interpolator = interpolateNumber(-5, 5);

            expect(interpolator(0)).toBe(-5);
            expect(interpolator(0.5)).toBe(0);
            expect(interpolator(1)).toBe(5);
        });

    });

});