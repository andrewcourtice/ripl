import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    LIGHT_DIRECTION,
    vec3Length,
} from '../../src';

describe('Constants', () => {

    describe('LIGHT_DIRECTION', () => {

        const entries = Object.entries(LIGHT_DIRECTION);

        // The diagonals were previously written as truncated decimals (0.707, 0.577), which left
        // every diagonal light fractionally short of unit length and so fractionally dim.
        test.each(entries)('%s is unit length', (_name, direction) => {
            expect(vec3Length(direction)).toBeCloseTo(1, 15);
        });

        test('Should point the default light down, left and towards the viewer', () => {
            const [dx, dy, dz] = LIGHT_DIRECTION.topLeftFront;

            expect(dx).toBeLessThan(0);
            expect(dy).toBeLessThan(0);
            expect(dz).toBeLessThan(0);
        });

        test('Should be frozen', () => {
            expect(Object.isFrozen(LIGHT_DIRECTION)).toBe(true);
        });

    });

});
