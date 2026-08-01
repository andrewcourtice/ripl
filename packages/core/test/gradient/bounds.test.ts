import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    getGradientBounds,
} from '../../src';

import type {
    Box,
} from '../../src';

describe('getGradientBounds', () => {

    test('uses the box when it has a positive size', () => {
        const box = {
            left: 10,
            top: 20,
            width: 30,
            height: 40,
        } as Box;

        expect(getGradientBounds(box, 100, 200)).toEqual({
            x: 10,
            y: 20,
            width: 30,
            height: 40,
        });
    });

    test('falls back to context dimensions for a missing or empty box', () => {
        expect(getGradientBounds(undefined, 100, 200)).toEqual({
            x: 0,
            y: 0,
            width: 100,
            height: 200,
        });

        expect(getGradientBounds({
            width: 0,
            height: 0,
        } as Box, 100, 200)).toEqual({
            x: 0,
            y: 0,
            width: 100,
            height: 200,
        });
    });

});
