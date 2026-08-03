import {
    describe,
    expect,
    test,
} from 'vitest';

// Side-effect import: registers node factory bindings (overrides vitest.setup.ts)
import '../src/index';

import {
    factory,
    getPathLength,
    samplePathPoint,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/terminal';

import type {
    TerminalOutput,
} from '@ripl/terminal';

function terminalContext() {
    return createContext({
        write: () => undefined,
        columns: 80,
        rows: 24,
    } as TerminalOutput);
}

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

    // Core falls back to this before an element's first paint, so a disagreement makes boxes jump.
    test('measureText should agree with the terminal context it feeds', () => {
        const context = terminalContext();
        const metrics = factory.measureText('hello');
        const painted = context.measureText('hello');

        expect(metrics.width).toBe(painted.width);
        expect(metrics.actualBoundingBoxAscent).toBe(painted.actualBoundingBoxAscent);
        expect(metrics.actualBoundingBoxDescent).toBe(painted.actualBoundingBoxDescent);

        context.destroy();
    });

    test('measureText should scale with the requested font size', () => {
        const small = factory.measureText('hello', {
            font: '10px monospace',
        });

        const large = factory.measureText('hello', {
            font: '40px monospace',
        });

        expect(large.width).toBe(small.width * 4);
        expect(large.actualBoundingBoxAscent).toBe(small.actualBoundingBoxAscent * 4);
    });

    test('measureText should anchor the box on the requested text alignment', () => {
        const start = factory.measureText('hello', {
            textAlign: 'start',
        });

        const centre = factory.measureText('hello', {
            textAlign: 'center',
        });

        const end = factory.measureText('hello', {
            textAlign: 'right',
        });

        expect(start.actualBoundingBoxLeft).toBe(0);
        expect(start.actualBoundingBoxRight).toBe(start.width);
        expect(centre.actualBoundingBoxLeft).toBe(centre.width / 2);
        expect(centre.actualBoundingBoxRight).toBe(centre.width / 2);
        expect(end.actualBoundingBoxLeft).toBe(end.width);
        expect(end.actualBoundingBoxRight).toBe(0);
    });

    // `{}` threw a raw TypeError on the first property access, so core's guards never ran.
    test('createElementNS should return a path stub the geometry helpers can degrade against', () => {
        expect(getPathLength('M0,0 L10,10')).toBe(0);
        expect(samplePathPoint('M0,0 L10,10', 5)).toEqual({
            x: 0,
            y: 0,
            angle: 0,
        });
    });

    // `image.ts` guards on a null 2D context; the old `{}` threw before the guard could run.
    test('createElement should return a canvas stub whose getContext degrades to null', () => {
        const canvas = factory.createElement('canvas') as HTMLCanvasElement;

        expect(canvas.getContext('2d')).toBeNull();
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
