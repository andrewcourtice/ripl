import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    numberClamp,
    numberFractional,
} from '../../src';

describe('Math', () => {

    describe('Number', () => {

        test('Clamp a value between a lower and upper bound', () => {
            expect(numberClamp(10, 5, 8)).toBe(8);
            expect(numberClamp(-10, -5, 8)).toBe(-5);
        });

        test('Get the numberFractional part of a float', () => {
            const value = 31.257;

            // Need to fix this. It's a useless test...
            expect(numberFractional(value)).toBe(value - Math.floor(value));
        });

    });

});