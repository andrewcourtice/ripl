import {
    afterEach,
    describe,
    expect,
    test,
} from 'vitest';

import {
    factory,
} from '../../src';

describe('Factory', () => {

    describe('set', () => {

        const original = window.devicePixelRatio;

        afterEach(() => {
            Object.defineProperty(window, 'devicePixelRatio', {
                configurable: true,
                value: original,
            });
        });

        // A spread invoked the platform getter once and stored the number, so the surface never
        // re-rasterised after a browser zoom or a move to a monitor with a different ratio.
        test('Should keep a live accessor live', () => {
            Object.defineProperty(window, 'devicePixelRatio', {
                configurable: true,
                value: 3,
            });

            expect(factory.devicePixelRatio).toBe(3);
        });

        test('Should merge implementations across calls', () => {
            const now = () => 1;

            factory.set({ now });

            expect(factory.now).toBe(now);
            expect(factory.createElement).toBeTypeOf('function');
        });

    });

});
