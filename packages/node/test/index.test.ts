import {
    describe,
    expect,
    test,
} from 'vitest';

// Side-effect import: registers node factory bindings (overrides vitest.setup.ts)
import '../src/index';

import {
    factory,
} from '@ripl/core';

describe('Node factory bindings', () => {

    test('devicePixelRatio should be 1', () => {
        expect(factory.devicePixelRatio).toBe(1);
    });

    test('getDefaultState should return an object with expected keys', () => {
        const state = factory.getDefaultState();

        expect(state).toHaveProperty('fill');
        expect(state).toHaveProperty('stroke');
        expect(state).toHaveProperty('lineWidth');
        expect(state).toHaveProperty('opacity');
        expect(state).toHaveProperty('font');
        expect(state).toHaveProperty('zIndex');
        expect(state).toHaveProperty('translateX');
        expect(state).toHaveProperty('translateY');
    });

    test('getDefaultState fill should be a valid color string', () => {
        const state = factory.getDefaultState();

        expect(typeof state.fill).toBe('string');
        expect(state.fill).toBeTruthy();
    });

    test('getDefaultState should provide correct default values', () => {
        const state = factory.getDefaultState();

        expect(state.fill).toBe('#000000');
        expect(state.stroke).toBe('#000000');
        expect(state.lineWidth).toBe(1);
        expect(state.opacity).toBe(1);
        expect(state.font).toBe('10px monospace');
        expect(state.lineCap).toBe('butt');
        expect(state.lineJoin).toBe('miter');
        expect(state.textAlign).toBe('start');
        expect(state.textBaseline).toBe('alphabetic');
    });

    test('measureText should return a TextMetrics-shaped object', () => {
        const metrics = factory.measureText('hello');

        expect(metrics).toHaveProperty('width');
        expect(typeof metrics.width).toBe('number');
        expect(metrics.width).toBeGreaterThan(0);
    });

    test('measureText width should scale with text length', () => {
        const short = factory.measureText('ab');
        const long = factory.measureText('abcd');

        expect(long.width).toBe(short.width * 2);
    });

    test('requestAnimationFrame should be defined', () => {
        expect(typeof factory.requestAnimationFrame).toBe('function');
    });

    test('cancelAnimationFrame should be defined', () => {
        expect(typeof factory.cancelAnimationFrame).toBe('function');
    });

    test('now should return a number', () => {
        expect(typeof factory.now()).toBe('number');
    });

});
