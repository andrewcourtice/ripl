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
    CanvasPath,
    createContext,
} from '../src';

import {
    factory,
} from '@ripl/core';

polyfillPath2D();

describe('Canvas surface sizing', () => {

    let el: HTMLDivElement;
    let canvasStub: ReturnType<typeof mockCanvasContext>;

    beforeEach(() => {
        canvasStub = mockCanvasContext();
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
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

    // A fresh <canvas> backing store is exactly 300x150, which the old backing-store check read as
    // "already the right size" — so the logical size, the scales and the clear rect all stayed at 0.
    test('Should size a context whose host is exactly the default canvas size', () => {
        sizeHost(300, 150);

        const context = createContext(el);

        expect(context.width).toBe(300);
        expect(context.height).toBe(150);
    });

    test('Should scale coordinates for a host the size of a default canvas', () => {
        sizeHost(300, 150);

        const context = createContext(el);

        expect(context.scaleX(300)).toBeGreaterThan(0);
        expect(context.scaleY(150)).toBeGreaterThan(0);
    });

    test('Should clear the full surface for a host the size of a default canvas', () => {
        sizeHost(300, 150);

        createContext(el).clear();

        expect(canvasStub.clearRect).toHaveBeenCalledWith(0, 0, 300, 150);
    });

    test('Should size a context of any other dimensions', () => {
        sizeHost(640, 480);

        const context = createContext(el);

        expect(context.width).toBe(640);
        expect(context.height).toBe(480);
        expect(context.scaleX(640)).toBeGreaterThan(0);
    });

    test('Should emit a resize when the logical size changes', () => {
        sizeHost(400, 300);

        const context = createContext(el);
        const resized = vi.fn();

        context.on('resize', resized);
        sizeHost(500, 300);
        context['rescale'](500, 300);

        expect(resized).toHaveBeenCalledOnce();
        expect(context.width).toBe(500);
    });

    // The ResizeObserver reports the current size on observe, so `init` measures twice.
    test('Should not emit a resize when the logical size is unchanged', () => {
        sizeHost(400, 300);

        const context = createContext(el);
        const resized = vi.fn();

        context.on('resize', resized);
        context['rescale'](400, 300);

        expect(resized).not.toHaveBeenCalled();
    });

    describe('Hit-test coordinate space', () => {

        const nativeDevicePixelRatio = factory.devicePixelRatio;

        afterEach(() => factory.set({ devicePixelRatio: nativeDevicePixelRatio }));

        // Native `isPointInPath` ignores the CTM, so a logical point handed straight to it missed
        // the DPR-scaled path by exactly the ratio.
        test('Should map a logical hit point onto device pixels before the native test', () => {
            factory.set({ devicePixelRatio: 2 });
            sizeHost(400, 300);

            const context = createContext(el);

            context.isPointInPath(new CanvasPath(), 125, 47);

            expect(canvasStub.isPointInPath).toHaveBeenLastCalledWith(expect.anything(), 250, 94, undefined);
        });

        test('Should hand a logical hit point through unchanged on an unscaled surface', () => {
            factory.set({ devicePixelRatio: 1 });
            sizeHost(400, 300);

            const context = createContext(el);

            context.isPointInStroke(new CanvasPath(), 125, 47);

            expect(canvasStub.isPointInStroke).toHaveBeenLastCalledWith(expect.anything(), 125, 47);
        });

    });

});
