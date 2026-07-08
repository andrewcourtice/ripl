import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    clamp,
    fractional,
} from '../../src';

describe('Math', () => {

    describe('Number', () => {

        test('Clamp a value between a lower and upper bound', () => {
            expect(clamp(10, 5, 8)).toBe(8);
            expect(clamp(-10, -5, 8)).toBe(-5);
        });

        test('Get the fractional part of a float', () => {
            const value = 31.257;

            // Need to fix this. It's a useless test...
            expect(fractional(value)).toBe(value - Math.floor(value));
        });

    });

});