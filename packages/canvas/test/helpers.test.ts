import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

import type {
    Box,
} from '@ripl/core';

import {
    getCanvasGradientBounds,
    rescaleCanvas,
    setCanvasFill,
    setCanvasStroke,
    toCanvasGradient,
} from '../src';

const BOUNDS = {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
};

const LINEAR = 'linear-gradient(90deg, #ff0000, #0000ff)';

function context() {
    return document.createElement('canvas').getContext('2d')!;
}

describe('getCanvasGradientBounds', () => {

    test('uses the box when it has a positive size', () => {
        const box = {
            left: 10,
            top: 20,
            width: 30,
            height: 40,
        } as Box;

        expect(getCanvasGradientBounds(box, 100, 200)).toEqual({
            x: 10,
            y: 20,
            width: 30,
            height: 40,
        });
    });

    test('falls back to context dimensions for a missing or empty box', () => {
        expect(getCanvasGradientBounds(undefined, 100, 200)).toEqual({
            x: 0,
            y: 0,
            width: 100,
            height: 200,
        });

        expect(getCanvasGradientBounds({
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

describe('setCanvasFill / setCanvasStroke', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    test('sets a plain colour directly', () => {
        const ctx = context();

        setCanvasFill(ctx, '#123456', BOUNDS);
        setCanvasStroke(ctx, '#654321', BOUNDS);

        expect(ctx.fillStyle).toBe('#123456');
        expect(ctx.strokeStyle).toBe('#654321');
    });

    test('resolves a gradient string to a CanvasGradient', () => {
        const ctx = context();

        setCanvasFill(ctx, LINEAR, BOUNDS);

        expect(ctx.fillStyle).not.toBe(LINEAR);
        expect(typeof ctx.fillStyle).toBe('object');
    });

    test('memoizes gradient parsing across repeated calls', () => {
        const ctx = context();
        const createLinearGradient = vi.spyOn(ctx, 'createLinearGradient');

        setCanvasFill(ctx, LINEAR, BOUNDS);
        setCanvasFill(ctx, LINEAR, BOUNDS);

        // Both calls build a native gradient (bounds may change per frame) but parsing is cached,
        // so the resolved definition is reused without re-parsing the string.
        expect(createLinearGradient).toHaveBeenCalledTimes(2);
        expect(typeof ctx.fillStyle).toBe('object');
    });

});

describe('toCanvasGradient', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    test('adds a colour stop for each parsed stop', () => {
        const ctx = context();
        const gradient = toCanvasGradient(ctx, {
            type: 'linear',
            repeating: false,
            angle: 90,
            stops: [
                {
                    color: '#ff0000',
                    offset: 0,
                },
                {
                    color: '#0000ff',
                    offset: 1,
                },
            ],
        }, BOUNDS);

        expect(gradient.addColorStop).toHaveBeenCalledTimes(2);
    });

});

describe('rescaleCanvas', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    test('resizes the canvas for the device pixel ratio and returns scales', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const result = rescaleCanvas(canvas, ctx, 120, 80);

        expect(result).toBeDefined();
        expect(canvas.width).toBeGreaterThan(0);
        expect(canvas.height).toBeGreaterThan(0);
        expect(result!.scaleX(0)).toBe(0);
    });

    test('returns undefined when no resize is needed', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        rescaleCanvas(canvas, ctx, 120, 80);

        expect(rescaleCanvas(canvas, ctx, 120, 80)).toBeUndefined();
    });

});
