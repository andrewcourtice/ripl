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
    setCanvasFill,
    setCanvasStroke,
    toCanvasPattern,
} from '../src/helpers';

describe('Canvas pattern fills', () => {

    let ctx: CanvasRenderingContext2D;

    beforeEach(() => {
        mockCanvasContext();
        ctx = document.createElement('canvas').getContext('2d')!;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('Should route a pattern fill through createPattern', () => {
        setCanvasFill(ctx, 'pattern(diagonal, #1a6, transparent, 8)', {
            top: 0,
            left: 0,
            bottom: 10,
            right: 10,
        });

        expect(ctx.createPattern).toHaveBeenCalledTimes(1);
        expect(ctx.fillStyle).toBe(toCanvasPattern(ctx, 'pattern(diagonal, #1a6, transparent, 8)'));
    });

    test('Should reuse the cached pattern across fills and strokes', () => {
        const value = 'pattern(dots, #333, #fff, 10)';
        const bounds = {
            top: 0,
            left: 0,
            bottom: 10,
            right: 10,
        };

        setCanvasFill(ctx, value, bounds);
        setCanvasStroke(ctx, value, bounds);
        setCanvasFill(ctx, value, bounds);

        expect(ctx.createPattern).toHaveBeenCalledTimes(1);
        expect(ctx.strokeStyle).toBe(toCanvasPattern(ctx, value));
    });

    test('Should fall through to the raw value for invalid pattern strings', () => {
        setCanvasFill(ctx, 'pattern(zigzag, red)', {
            top: 0,
            left: 0,
            bottom: 10,
            right: 10,
        });

        expect(ctx.fillStyle).toBe('pattern(zigzag, red)');
    });

    test('Should leave plain colours untouched', () => {
        setCanvasFill(ctx, '#ff0000', {
            top: 0,
            left: 0,
            bottom: 10,
            right: 10,
        });

        expect(ctx.fillStyle).toBe('#ff0000');
        expect(ctx.createPattern).not.toHaveBeenCalled();
    });

});
