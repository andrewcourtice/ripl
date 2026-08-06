import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    clearHighlight,
    showHighlight,
} from '../src/highlight';

import {
    createRect,
    createScene,
    factory,
    scaleContinuous,
} from '@ripl/core';

import type {
    Scene,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

function getOverlay(): HTMLDivElement | undefined {
    return Array
        .from(document.body.querySelectorAll('div'))
        .find(div => div.style.zIndex === '2147483646');
}

describe('Highlight', () => {

    let el: HTMLDivElement;
    let scene: Scene;

    beforeEach(() => {
        mockCanvasContext();
        factory.set({
            createContext,
        });
        el = document.createElement('div');
        document.body.appendChild(el);
        scene = createScene(el);
    });

    afterEach(() => {
        clearHighlight();
        scene.destroy();
        el.remove();
        factory.set({
            createContext: undefined,
        });
        vi.restoreAllMocks();
    });

    test('Should position the overlay over the element scaled to the context screen size', () => {
        const rect = createRect({
            x: 10,
            y: 10,
            width: 20,
            height: 20,
        });

        scene.add(rect);
        scene.context.width = 100;
        scene.context.height = 50;

        vi.spyOn(scene.context.element, 'getBoundingClientRect').mockReturnValue({
            left: 100,
            top: 50,
            width: 200,
            height: 100,
            right: 300,
            bottom: 150,
            x: 100,
            y: 50,
            toJSON: () => ({}),
        } as DOMRect);

        showHighlight(scene.context, rect);

        const overlay = getOverlay();

        expect(overlay).toBeDefined();
        expect(overlay?.parentElement).toBe(document.body);
        expect(overlay?.style.position).toBe('fixed');
        expect(overlay?.style.pointerEvents).toBe('none');
        expect(overlay?.style.left).toBe('120px');
        expect(overlay?.style.top).toBe('70px');
        expect(overlay?.style.width).toBe('40px');
        expect(overlay?.style.height).toBe('40px');
    });

    // The overlay is a fixed-position DOM node, so it maps logical space to CSS pixels, never to
    // the backend's surface space; routing it through the device pixel ratio would double it.
    test('Should place the overlay independently of the device pixel ratio', () => {
        const rect = createRect({
            x: 10,
            y: 10,
            width: 20,
            height: 20,
        });

        scene.add(rect);
        scene.context.width = 100;
        scene.context.height = 50;
        scene.context.scaleX = scaleContinuous([0, 100], [0, 200]);
        scene.context.scaleY = scaleContinuous([0, 50], [0, 100]);

        vi.spyOn(scene.context.element, 'getBoundingClientRect').mockReturnValue({
            left: 0,
            top: 0,
            width: 100,
            height: 50,
            right: 100,
            bottom: 50,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        } as DOMRect);

        showHighlight(scene.context, rect);

        const overlay = getOverlay();

        expect(overlay?.style.left).toBe('10px');
        expect(overlay?.style.top).toBe('10px');
        expect(overlay?.style.width).toBe('20px');
        expect(overlay?.style.height).toBe('20px');
    });

    test('Should reuse a single overlay across repeated shows', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        scene.add(rect);

        showHighlight(scene.context, rect);
        showHighlight(scene.context, rect);

        const overlays = Array
            .from(document.body.querySelectorAll('div'))
            .filter(div => div.style.zIndex === '2147483646');

        expect(overlays.length).toBe(1);
    });

    test('Should remove the overlay on clear', () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        scene.add(rect);

        showHighlight(scene.context, rect);

        expect(getOverlay()).toBeDefined();

        clearHighlight();

        expect(getOverlay()).toBeUndefined();

        clearHighlight();

        expect(getOverlay()).toBeUndefined();
    });

});
