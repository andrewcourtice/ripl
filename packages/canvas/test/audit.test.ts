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
    mockCanvasState,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createContext,
} from '../src';

import {
    createCircle,
    createScene,
    factory,
} from '@ripl/core';

polyfillPath2D();

/**
 * Regression tests for the context audit (see `docs/audits/`). A skipped test pins a confirmed
 * defect that is not fixed yet: un-skip it with the fix.
 */
describe('Canvas audit findings', () => {

    let el: HTMLDivElement;

    beforeEach(() => {
        mockCanvasContext();
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
        factory.set({
            devicePixelRatio: 1,
        });
        vi.restoreAllMocks();
    });

    function sizeHost(width: number, height: number) {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
            left: 0,
            top: 0,
            right: width,
            bottom: height,
            width,
            height,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }) as DOMRect);
    }

    test('Should scale a context whose host is exactly the default canvas size', () => {
        sizeHost(300, 150);

        const context = createContext(el);

        expect(context.width).toBe(300);
        expect(context.height).toBe(150);
        expect(context.scaleX(150)).toBe(150);
    });

    test('Should scale a context whose host is any other size', () => {
        sizeHost(400, 300);

        const context = createContext(el);

        expect(context.width).toBe(400);
        expect(context.height).toBe(300);
    });

    // CANVAS-2: a clip shape skips its own restore so the clip persists to later siblings, and
    // `popGroup` is what absorbs the dangling save. At scene root there is no group to absorb it.
    test('Should not accumulate save depth across frames for a scene-root clip', () => {
        sizeHost(400, 300);

        const context = createContext(el);

        const scene = createScene(context, {
            children: [
                createCircle({
                    clip: true,
                    cx: 50,
                    cy: 50,
                    radius: 20,
                }),
                createCircle({
                    fill: '#ff0000',
                    cx: 50,
                    cy: 50,
                    radius: 10,
                }),
            ],
        });

        const depths: number[] = [];

        for (let frame = 0; frame < 5; frame++) {
            scene.render();
            depths.push((context as unknown as { saveDepth: number }).saveDepth);
        }

        expect(depths).toEqual([0, 0, 0, 0, 0]);
    });

    test('Should not accumulate save depth across frames without a clip', () => {
        sizeHost(400, 300);

        const context = createContext(el);

        const scene = createScene(context, {
            children: [
                createCircle({
                    fill: '#ff0000',
                    cx: 50,
                    cy: 50,
                    radius: 10,
                }),
            ],
        });

        const depths: number[] = [];

        for (let frame = 0; frame < 5; frame++) {
            scene.render();
            depths.push((context as unknown as { saveDepth: number }).saveDepth);
        }

        expect(depths).toEqual([0, 0, 0, 0, 0]);
    });

    // CANVAS-3: `_fillCSS`/`_strokeCSS` are plain fields outside the save/restore stack, so the
    // public getters report a paint the underlying context is no longer using.
    test('Should report the restored paint from the fill and stroke getters', () => {
        mockCanvasState(mockCanvasContext());
        sizeHost(400, 300);

        const context = createContext(el);

        context.fill = '#ff0000';
        context.stroke = '#00ff00';
        context.save();
        context.fill = '#0000ff';
        context.stroke = '#ffff00';
        context.restore();

        expect(context.fill).toBe('#ff0000');
        expect(context.stroke).toBe('#00ff00');
    });

    test('Should report the paint set in the current scope', () => {
        mockCanvasState(mockCanvasContext());
        sizeHost(400, 300);

        const context = createContext(el);

        context.fill = '#ff0000';

        expect(context.fill).toBe('#ff0000');
    });

    // A paint written only inside a scope must not outlive it, or the getter reports a value the
    // outer scope never held.
    test('Should fall back to the native default for a paint set only inside a scope', () => {
        mockCanvasState(mockCanvasContext());
        sizeHost(400, 300);

        const context = createContext(el);

        context.save();
        context.fill = '#123456';
        context.restore();

        expect(context.fill).toBe('#000000');
    });

    // Native canvas rejects an invalid colour, so recording one unmasked the stale native value.
    test('Should ignore an empty fill and keep reporting the paint in force', () => {
        mockCanvasState(mockCanvasContext());
        sizeHost(400, 300);

        const context = createContext(el);

        context.fill = '#ff0000';
        context.fill = '';

        expect(context.fill).toBe('#ff0000');
    });

    test('Should ignore an empty stroke and keep reporting the paint in force', () => {
        mockCanvasState(mockCanvasContext());
        sizeHost(400, 300);

        const context = createContext(el);

        context.stroke = '#00ff00';
        context.stroke = '';

        expect(context.stroke).toBe('#00ff00');
    });

    // CANVAS-8: native `reset()` drops the transform, taking the DPR matrix the surface draws through.
    test('Should re-install the device pixel ratio transform on reset', () => {
        factory.set({
            devicePixelRatio: 2,
        });

        const stub = mockCanvasState(mockCanvasContext());

        sizeHost(400, 300);

        const context = createContext(el);

        context.translate(30, 40);
        context.reset();

        expect(stub.getMatrix()).toEqual([2, 0, 0, 2, 0, 0]);
    });

    test('Should resynchronise the save depth on reset', () => {
        mockCanvasState(mockCanvasContext());
        sizeHost(400, 300);

        const context = createContext(el);

        context.save();
        context.save();
        context.reset();

        expect((context as unknown as { saveDepth: number }).saveDepth).toBe(0);
    });

    test('Should not unwind past a reset on a later restore', () => {
        mockCanvasState(mockCanvasContext());
        sizeHost(400, 300);

        const context = createContext(el);

        context.lineWidth = 2;
        context.save();
        context.lineWidth = 8;
        context.reset();
        context.restore();

        expect(context.lineWidth).toBe(8);
    });

    // CANVAS-9: `Context.rescale` installs identity scales and emits before the DPR ones land.
    test('Should emit resize with the device pixel ratio scales already applied', () => {
        factory.set({
            devicePixelRatio: 2,
        });

        sizeHost(400, 300);

        const context = createContext(el);
        const scales: number[] = [];

        context.on('resize', () => scales.push(context.scaleX(100)));
        context['rescale'](800, 600);

        expect(scales).toEqual([200]);
    });

});
