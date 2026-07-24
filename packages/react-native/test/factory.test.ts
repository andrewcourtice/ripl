import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

vi.mock('@shopify/react-native-skia', () => import('./skia-mock'));

import {
    factory,
} from '@ripl/core';

import {
    bindReactNativeFactory,
} from '../src/factory';

beforeEach(() => {
    bindReactNativeFactory();
});

describe('bindReactNativeFactory', () => {

    test('Should fix devicePixelRatio at 1', () => {
        expect(factory.devicePixelRatio).toBe(1);
    });

    test('Should register the platform functions', () => {
        expect(typeof factory.requestAnimationFrame).toBe('function');
        expect(typeof factory.cancelAnimationFrame).toBe('function');
        expect(typeof factory.now).toBe('function');
        expect(typeof factory.measureText).toBe('function');
        expect(typeof factory.createContext).toBe('function');
        expect(typeof factory.getComputedStyle).toBe('function');
    });

    test('Should provide a complete default state', () => {
        const state = factory.getDefaultState();

        expect(state).toHaveProperty('fill');
        expect(state).toHaveProperty('stroke');
        expect(state).toHaveProperty('lineWidth');
        expect(state).toHaveProperty('textBaseline');
        expect(state).toHaveProperty('opacity');
    });

    test('Should create a Skia context via the factory', () => {
        const context = factory.createContext('', {
            width: 10,
            height: 10,
        } as never);

        expect(context).toBeTruthy();
        expect(context.type).toBe('react-native-skia');
    });

});
