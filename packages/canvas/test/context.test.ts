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
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    CanvasContext,
    CanvasPath,
    createContext,
} from '../src';

polyfillPath2D();

const GRADIENT = 'linear-gradient(90deg, #ff0000, #0000ff)';

function createFakeRenderElement() {
    return {
        getBoundingBox: vi.fn(() => ({
            left: 0,
            top: 0,
            right: 10,
            bottom: 10,
            width: 10,
            height: 10,
        })),
    };
}

describe('CanvasContext', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    function context() {
        return createContext(document.createElement('div'));
    }

    test('creates a CanvasContext bound to a fresh canvas', () => {
        const ctx = context();

        expect(ctx).toBeInstanceOf(CanvasContext);
        expect(ctx.type).toBe('canvas');
    });

    test('maps state properties onto the native 2D context', () => {
        const ctx = context();

        ctx.lineWidth = 4;
        ctx.font = '12px sans-serif';
        ctx.lineCap = 'round';

        expect(ctx.lineWidth).toBe(4);
        expect(ctx.font).toBe('12px sans-serif');
        expect(ctx.lineCap).toBe('round');
    });

    test('fill fast-path: a plain color skips bounding-box resolution', () => {
        const ctx = context();
        const element = createFakeRenderElement();

        (ctx as { currentRenderElement: unknown }).currentRenderElement = element;
        ctx.fill = '#ff0000';

        expect(element.getBoundingBox).not.toHaveBeenCalled();
        expect(ctx.fill).toBe('#ff0000');
    });

    test('stroke fast-path: a plain color skips bounding-box resolution', () => {
        const ctx = context();
        const element = createFakeRenderElement();

        (ctx as { currentRenderElement: unknown }).currentRenderElement = element;
        ctx.stroke = '#00ff00';

        expect(element.getBoundingBox).not.toHaveBeenCalled();
        expect(ctx.stroke).toBe('#00ff00');
    });

    test('fill gradient path: resolves the element bounding box', () => {
        const ctx = context();
        const element = createFakeRenderElement();

        (ctx as { currentRenderElement: unknown }).currentRenderElement = element;
        ctx.fill = GRADIENT;

        // Gradient bounds are the element's local (untransformed) box.
        expect(element.getBoundingBox).toHaveBeenCalledWith(true);
    });

    test('fill pattern path: resolves a pattern string to a CanvasPattern, not the raw string', () => {
        const ctx = context();
        const native = (ctx as { context: CanvasRenderingContext2D }).context;

        ctx.fill = 'pattern(diagonal, #1a6, #fff, 8)';

        // A raw pattern string is not a valid canvas fillStyle; the setter must route it through
        // createPattern so the native context receives a CanvasPattern object instead.
        expect(typeof native.fillStyle).toBe('object');
        expect(native.fillStyle).not.toBe('pattern(diagonal, #1a6, #fff, 8)');
    });

    test('stroke pattern path: resolves a pattern string to a CanvasPattern, not the raw string', () => {
        const ctx = context();
        const native = (ctx as { context: CanvasRenderingContext2D }).context;

        ctx.stroke = 'pattern(dots, #333, #fff, 10)';

        expect(typeof native.strokeStyle).toBe('object');
        expect(native.strokeStyle).not.toBe('pattern(dots, #333, #fff, 10)');
    });

    test('createPath returns a CanvasPath', () => {
        const ctx = context();

        expect(ctx.createPath('shape')).toBeInstanceOf(CanvasPath);
    });

    test('reports supportsPathCaching as true', () => {
        const ctx = context();

        expect(ctx.supportsPathCaching).toBe(true);
    });

    test('save and restore delegate without throwing', () => {
        const ctx = context();

        expect(() => {
            ctx.save();
            ctx.lineWidth = 8;
            ctx.restore();
        }).not.toThrow();
    });

    test('isPointInPath returns a boolean from the native context', () => {
        const ctx = context();
        const path = ctx.createPath();

        expect(typeof ctx.isPointInPath(path, 0, 0)).toBe('boolean');
    });

});
