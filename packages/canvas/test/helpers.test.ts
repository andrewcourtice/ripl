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

import {
    canvasDrawImage,
    rescaleCanvas,
    setCanvasFill,
    setCanvasStroke,
    toCanvasGradient,
} from '../src';

import {
    factory,
} from '@ripl/core';

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

describe('setCanvasFill / setCanvasStroke', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    test('sets a plain color directly', () => {
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

    // Canvas bakes gradient geometry at set time, so one native object serves a string and box.
    test('reuses the native gradient across repeated calls', () => {
        const ctx = context();
        const createLinearGradient = vi.spyOn(ctx, 'createLinearGradient');

        setCanvasFill(ctx, LINEAR, BOUNDS);
        setCanvasFill(ctx, LINEAR, BOUNDS);

        expect(createLinearGradient).toHaveBeenCalledTimes(1);
        expect(typeof ctx.fillStyle).toBe('object');
    });

    test('rebuilds the native gradient when the bounds change', () => {
        const ctx = context();
        const createLinearGradient = vi.spyOn(ctx, 'createLinearGradient');

        setCanvasFill(ctx, LINEAR, BOUNDS);
        setCanvasFill(ctx, LINEAR, {
            x: 0,
            y: 0,
            width: 200,
            height: 100,
        });

        expect(createLinearGradient).toHaveBeenCalledTimes(2);
    });

    test('shares one native gradient between fill and stroke', () => {
        const ctx = context();
        const createLinearGradient = vi.spyOn(ctx, 'createLinearGradient');

        setCanvasFill(ctx, LINEAR, BOUNDS);
        setCanvasStroke(ctx, LINEAR, BOUNDS);

        expect(createLinearGradient).toHaveBeenCalledTimes(1);
        expect(ctx.strokeStyle).toBe(ctx.fillStyle);
    });

});

describe('canvasDrawImage', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    function image(width: number, height: number) {
        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        return canvas;
    }

    test('draws at intrinsic size when neither dimension is given', () => {
        const ctx = context();
        const source = image(100, 50);

        canvasDrawImage(ctx, source, 5, 5);

        expect(ctx.drawImage).toHaveBeenCalledWith(source, 5, 5);
    });

    // The destination-rectangle form needs both dimensions, so a lone width used to be dropped.
    test('takes the intrinsic height when only a width is given', () => {
        const ctx = context();
        const source = image(100, 50);

        canvasDrawImage(ctx, source, 5, 5, 200);

        expect(ctx.drawImage).toHaveBeenCalledWith(source, 5, 5, 200, 50);
    });

    test('takes the intrinsic width when only a height is given', () => {
        const ctx = context();
        const source = image(100, 50);

        canvasDrawImage(ctx, source, 5, 5, undefined, 200);

        expect(ctx.drawImage).toHaveBeenCalledWith(source, 5, 5, 100, 200);
    });

    test('honours a zero dimension rather than falling back to the intrinsic size', () => {
        const ctx = context();
        const source = image(100, 50);

        canvasDrawImage(ctx, source, 0, 0, 0, 40);

        expect(ctx.drawImage).toHaveBeenCalledWith(source, 0, 0, 0, 40);
    });

});

describe('toCanvasGradient', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    test('adds a color stop for each parsed stop', () => {
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

        expect(canvas.width).toBeGreaterThan(0);
        expect(canvas.height).toBeGreaterThan(0);
        expect(result.scaleX(0)).toBe(0);
    });

    // Assigning either dimension clears the surface, so an unchanged size must not touch it.
    test('leaves the backing store alone when it already matches', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        rescaleCanvas(canvas, ctx, 120, 80);

        // `spyOn` returns the stub's existing mock, so drop the call the first rescale recorded.
        const setTransform = vi.spyOn(ctx, 'setTransform').mockClear();
        const { width, height } = canvas;

        rescaleCanvas(canvas, ctx, 120, 80);

        // The transform is only reset after a write, so an untouched transform means an untouched store.
        expect(setTransform).not.toHaveBeenCalled();
        expect(canvas.width).toBe(width);
        expect(canvas.height).toBe(height);
    });

    test('returns scales even when the backing store already matches', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        rescaleCanvas(canvas, ctx, 120, 80);

        expect(rescaleCanvas(canvas, ctx, 120, 80).scaleX(120)).toBe(canvas.width);
    });

    // A fresh canvas backing store is already exactly 300x150, which used to read as "no resize needed".
    test('returns scales for a surface the size of a default canvas', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const result = rescaleCanvas(canvas, ctx, canvas.width, canvas.height);

        expect(result.scaleX(canvas.width)).toBe(canvas.width);
        expect(result.scaleY(canvas.height)).toBe(canvas.height);
    });

    // Drawing goes through an exact `dpr` transform, so scaling pointers by the floored backing
    // store disagreed with it by up to a device pixel at the far edge.
    test('scales by the exact device pixel ratio, not the floored backing store', () => {
        factory.set({
            devicePixelRatio: 1.5,
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        const result = rescaleCanvas(canvas, ctx, 301, 151);

        expect(result.scaleX(301)).toBe(451.5);
        expect(result.scaleY(151)).toBe(226.5);

        factory.set({
            devicePixelRatio: 1,
        });
    });

    test('floors the backing store to whole device pixels', () => {
        factory.set({
            devicePixelRatio: 1.5,
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        rescaleCanvas(canvas, ctx, 301, 151);

        expect(canvas.width).toBe(451);
        expect(canvas.height).toBe(226);

        factory.set({
            devicePixelRatio: 1,
        });
    });

});
