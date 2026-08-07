import {
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createClipMask,
} from '../src/clip';

import {
    createContext,
} from '../src/context';

import {
    createMockOutput,
    createSpyRasterizer,
} from './helpers';

import type {
    SpyRasterizer,
} from './helpers';

polyfillPath2D();

/** A single square contour, in raster space. */
function square(left: number, top: number, size: number) {
    return [[
        {
            x: left,
            y: top,
        },
        {
            x: left + size,
            y: top,
        },
        {
            x: left + size,
            y: top + size,
        },
        {
            x: left,
            y: top + size,
        },
    ]];
}

describe('ClipMask', () => {

    test('Should report points inside the clip geometry', () => {
        const mask = createClipMask(square(2, 2, 6), 20, 20);

        expect(mask.contains(5, 5)).toBe(true);
        expect(mask.contains(15, 5)).toBe(false);
    });

    test('Should reject points outside the grid', () => {
        const mask = createClipMask(square(0, 0, 20), 20, 20);

        expect(mask.contains(-1, 5)).toBe(false);
        expect(mask.contains(5, 100)).toBe(false);
    });

    test('Should intersect with an existing mask rather than replace it', () => {
        const outer = createClipMask(square(0, 0, 10), 20, 20);
        const inner = createClipMask(square(5, 5, 10), 20, 20, outer);

        expect(inner.contains(7, 7)).toBe(true);
        expect(inner.contains(12, 12)).toBe(false);
        expect(inner.contains(2, 2)).toBe(false);
    });

});

describe('TerminalContext clipping', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    /** Builds a context whose paint decisions are recorded. */
    function createSpiedContext(): [ReturnType<typeof createContext>, SpyRasterizer] {
        const rasterizer = createSpyRasterizer(20, 6);

        return [
            createContext(createMockOutput(20, 6), {
                rasterizer,
            }),
            rasterizer,
        ];
    }

    test('Should drop pixels outside the clip region', () => {
        const [context, rasterizer] = createSpiedContext();

        const clip = context.createPath();

        clip.rect(0, 0, 10, 10);

        context.markRenderStart();
        context.applyClip(clip);

        context.fill = '#ff0000';

        const shape = context.createPath();

        shape.rect(0, 0, 30, 10);
        context.applyFill(shape);
        context.markRenderEnd();

        expect(rasterizer.pixels.length).toBeGreaterThan(0);
        expect(rasterizer.pixels.every(([x]) => x <= 10)).toBe(true);
    });

    test('Should narrow, not widen, when a second clip is applied', () => {
        const [context, rasterizer] = createSpiedContext();

        const outer = context.createPath();
        const inner = context.createPath();

        outer.rect(0, 0, 10, 10);
        inner.rect(6, 0, 30, 10);

        context.markRenderStart();
        context.applyClip(outer);
        context.applyClip(inner);

        context.fill = '#ff0000';

        const shape = context.createPath();

        shape.rect(0, 0, 30, 10);
        context.applyFill(shape);
        context.markRenderEnd();

        expect(rasterizer.pixels.length).toBeGreaterThan(0);
        expect(rasterizer.pixels.every(([x]) => x >= 6 && x <= 10)).toBe(true);
    });

    test('Should release the clip when the state it was set in is restored', () => {
        const [context, rasterizer] = createSpiedContext();

        const clip = context.createPath();

        clip.rect(0, 0, 4, 4);

        context.markRenderStart();
        context.save();
        context.applyClip(clip);
        context.restore();

        context.fill = '#ff0000';

        const shape = context.createPath();

        shape.rect(0, 0, 30, 10);
        context.applyFill(shape);
        context.markRenderEnd();

        expect(rasterizer.pixels.some(([x]) => x > 10)).toBe(true);
    });

    test('Should clip glyphs on the same boundary as geometry', () => {
        const [context, rasterizer] = createSpiedContext();

        const clip = context.createPath();

        clip.rect(0, 0, 8, 20);

        context.markRenderStart();
        context.applyClip(clip);

        context.fill = '#ff0000';
        context.textBaseline = 'top';
        context.applyFill(context.createText({
            content: 'ABCDEFGH',
            x: 0,
            y: 0,
        }));
        context.markRenderEnd();

        expect(rasterizer.text()).toBe('ABCD');
    });

    test('Should honor the transform in force when the clip was applied', () => {
        const [context, rasterizer] = createSpiedContext();

        context.markRenderStart();
        context.translate(10, 0);

        const clip = context.createPath();

        clip.rect(0, 0, 10, 10);
        context.applyClip(clip);

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fill = '#ff0000';

        const shape = context.createPath();

        shape.rect(0, 0, 30, 10);
        context.applyFill(shape);
        context.markRenderEnd();

        expect(rasterizer.pixels.length).toBeGreaterThan(0);
        expect(rasterizer.pixels.every(([x]) => x >= 10)).toBe(true);
    });

});
