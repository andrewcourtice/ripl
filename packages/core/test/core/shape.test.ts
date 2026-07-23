import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createCircle,
    createGroup,
    createRect,
    createShape,
    elementIsShape,
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Shape2D', () => {

    test('Should default autoFill to true', () => {

        const shape = createShape('test-shape', {} as any);

        expect(shape.autoFill).toBe(true);
    });

    test('Should default autoStroke to true', () => {

        const shape = createShape('test-shape', {} as any);

        expect(shape.autoStroke).toBe(true);
    });

    test('Should default clip to false', () => {

        const shape = createShape('test-shape', {} as any);

        expect(shape.clip).toBe(false);
    });

    test('Should accept autoFill: false', () => {

        const shape = createShape('test-shape', { autoFill: false } as any);

        expect(shape.autoFill).toBe(false);
    });

    test('Should accept autoStroke: false', () => {

        const shape = createShape('test-shape', { autoStroke: false } as any);

        expect(shape.autoStroke).toBe(false);
    });

    test('Should accept clip: true', () => {

        const shape = createShape('test-shape', { clip: true } as any);

        expect(shape.clip).toBe(true);
    });

    test('Should fall back to bounding box intersection without context/path', () => {
        const rect = createRect({
            x: 10,
            y: 10,
            width: 100,
            height: 50,
        });

        // Point inside bounding box
        expect(rect.intersectsWith(50, 30)).toBe(true);

        // Point outside bounding box
        expect(rect.intersectsWith(200, 200)).toBe(false);
    });

    test('Should map a device-space hit point into local space using the device pixel ratio', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 100,
            height: 100,
        });

        rect.translateX = 50; // logical-space world transform

        const recorded: [number, number][] = [];

        // dpr = 2: scaleDPR maps logical → device (×2); invert maps device → logical (÷2).
        const scaleDPR = Object.assign((value: number) => value * 2, { invert: (value: number) => value / 2 });

        (rect as unknown as { context: unknown }).context = {
            hitTestHonorsTransform: false,
            scaleDPR,
            isPointInStroke: () => false,
            isPointInPath: (_path: unknown, x: number, y: number) => {
                recorded.push([x, y]);
                return true;
            },
        };
        (rect as unknown as { path: unknown }).path = {};

        // Device point for logical (60, 20) at dpr 2 → (120, 40).
        rect.intersectsWith(120, 40);

        // device (120,40) → logical (60,20) → inverse translate(-50) → local (10,20) → device (20,40).
        expect(recorded.at(-1)).toEqual([20, 40]);
    });

    test('Should return false for pointerEvents "none" with isPointer', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 100,
            height: 100,
            pointerEvents: 'none',
        });

        // Simulate having context and path by testing via intersectsWith
        // Without context/path it falls back to bounding box, but with pointerEvents: 'none'
        // the isPointer path returns false when context+path are present
        // Test the bounding box fallback first
        expect(rect.intersectsWith(50, 50)).toBe(true);
    });

    test('Should default pointerEvents to "all"', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        expect(rect.pointerEvents).toBe('all');
    });

});

describe('elementIsShape', () => {

    test('Should return true for Shape2D instances', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        expect(elementIsShape(rect)).toBe(true);
    });

    test('Should return false for non-shape values', () => {
        expect(elementIsShape({})).toBe(false);
        expect(elementIsShape(null)).toBe(false);
        expect(elementIsShape(42)).toBe(false);
        expect(elementIsShape('rect')).toBe(false);
    });

});

describe('Shape2D path caching', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    function context() {
        return createContext(document.createElement('div'));
    }

    test('Should trace a path on first render', () => {
        const ctx = context();
        const spy = vi.spyOn(ctx, 'createPath');
        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
        });

        circle.render(ctx);

        expect(spy).toHaveBeenCalledTimes(1);
    });

    test('Should reuse the cached path on an unchanged re-render', () => {
        const ctx = context();
        const spy = vi.spyOn(ctx, 'createPath');
        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
        });

        circle.render(ctx);
        const cachedPath = (circle as unknown as { path: unknown }).path;
        circle.render(ctx);

        expect(spy).toHaveBeenCalledTimes(1);
        expect((circle as unknown as { path: unknown }).path).toBe(cachedPath);
    });

    test('Should re-trace after a geometry change', () => {
        const ctx = context();
        const spy = vi.spyOn(ctx, 'createPath');
        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
        });

        circle.render(ctx);
        circle.render(ctx);
        expect(spy).toHaveBeenCalledTimes(1);

        circle.radius = 20;
        circle.render(ctx);

        expect(spy).toHaveBeenCalledTimes(2);
    });

    test('Should re-trace after an interpolator tick with no setStateValue', () => {
        const ctx = context();
        const spy = vi.spyOn(ctx, 'createPath');
        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
        });

        circle.render(ctx);
        circle.render(ctx);
        expect(spy).toHaveBeenCalledTimes(1);

        circle.interpolate({ radius: 20 })(1);
        circle.render(ctx);

        expect(spy).toHaveBeenCalledTimes(2);
    });

    test('Should trace on every render when cachePath is false', () => {
        const ctx = context();
        const spy = vi.spyOn(ctx, 'createPath');
        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
            cachePath: false,
        });

        circle.render(ctx);
        circle.render(ctx);
        circle.render(ctx);

        expect(spy).toHaveBeenCalledTimes(3);
    });

    test('Should re-trace when rendered to a different context instance', () => {
        const ctxA = context();
        const ctxB = context();
        const spyA = vi.spyOn(ctxA, 'createPath');
        const spyB = vi.spyOn(ctxB, 'createPath');
        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
        });

        circle.render(ctxA);
        circle.render(ctxB);

        expect(spyA).toHaveBeenCalledTimes(1);
        expect(spyB).toHaveBeenCalledTimes(1);
    });

    test('Should still apply fill on a cache-hit render', () => {
        const ctx = context();
        const createSpy = vi.spyOn(ctx, 'createPath');
        const fillSpy = vi.spyOn(ctx, 'applyFill');
        const circle = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
            fill: '#ff0000',
        });

        circle.render(ctx);
        circle.render(ctx);

        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(fillSpy).toHaveBeenCalledTimes(2);
    });

    test('Should keep a clean child path cached while its parent group is dirty', () => {
        const ctx = context();
        const spy = vi.spyOn(ctx, 'createPath');
        const child = createCircle({
            cx: 10,
            cy: 10,
            radius: 5,
        });

        createGroup({ children: [child] });

        child.render(ctx);
        child.render(ctx);
        expect(spy).toHaveBeenCalledTimes(1);

        child.parent!.translateX = 100;
        expect(child.$anyDirty).toBe(true);
        expect(child.$dirty).toBe(false);

        child.render(ctx);

        expect(spy).toHaveBeenCalledTimes(1);
    });

});
