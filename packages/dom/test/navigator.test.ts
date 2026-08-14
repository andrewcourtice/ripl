import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createNavigator,
    DOMNavigator,
} from '../src';

import type {
    Context,
} from '@ripl/core';

let element: HTMLDivElement;

/** A minimal stand-in context exposing only the DOM element the navigator binds to. */
function fakeContext(): Context {
    return {
        element,
    } as unknown as Context;
}

/** A non-DOM context, mirroring how the terminal context carries a dummy `{}` element. */
function fakeNonDOMContext(): Context {
    return {
        element: {},
    } as unknown as Context;
}

/** Dispatches a DOM event with arbitrary properties, sidestepping jsdom constructor gaps. */
function fire(type: string, props: Record<string, unknown>): void {
    const event = new Event(type, {
        bubbles: true,
        cancelable: true,
    });

    Object.assign(event, props);
    element.dispatchEvent(event);
}

beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
});

afterEach(() => {
    element.remove();
    vi.restoreAllMocks();
});

describe('DOMNavigator interactions', () => {

    test('Should zoom on wheel toward the pointer', () => {
        const navigator = createNavigator(fakeContext(), {
            interactions: {
                zoom: true,
            },
        });

        const onZoom = vi.fn();
        navigator.on('zoom', onZoom);

        fire('wheel', {
            deltaY: -100,
            clientX: 50,
            clientY: 50,
        });

        expect(navigator.transform.k).toBeGreaterThan(1);
        expect(onZoom).toHaveBeenCalled();

        navigator.destroy();
    });

    test('Should pan on a plain click-and-hold drag', () => {
        const navigator = createNavigator(fakeContext(), {
            interactions: {
                pan: true,
            },
        });

        fire('pointerdown', {
            pointerId: 1,
            clientX: 100,
            clientY: 100,
        });
        fire('pointermove', {
            pointerId: 1,
            clientX: 130,
            clientY: 90,
        });

        expect(navigator.transform.x).toBe(30);
        expect(navigator.transform.y).toBe(-10);

        navigator.destroy();
    });

    test('Should pan on a ⌘/Ctrl click-and-hold drag', () => {
        const navigator = createNavigator(fakeContext(), {
            interactions: {
                pan: true,
                brush: true,
            },
        });

        // Meta-drag must pan (not brush) even when brushing is also enabled.
        fire('pointerdown', {
            pointerId: 1,
            clientX: 10,
            clientY: 10,
            metaKey: true,
        });
        fire('pointermove', {
            pointerId: 1,
            clientX: 40,
            clientY: 25,
            metaKey: true,
        });

        expect(navigator.transform.x).toBe(30);
        expect(navigator.transform.y).toBe(15);
        expect(navigator.brush).toBeNull();

        navigator.destroy();
    });

    test('Should not pan on a right-button drag', () => {
        const navigator = createNavigator(fakeContext(), {
            interactions: {
                pan: true,
            },
        });

        fire('pointerdown', {
            pointerId: 1,
            clientX: 10,
            clientY: 10,
            button: 2,
        });
        fire('pointermove', {
            pointerId: 1,
            clientX: 60,
            clientY: 60,
            button: 2,
        });

        expect(navigator.transform.x).toBe(0);

        navigator.destroy();
    });

    test('Should brush on shift-drag when pan is also enabled', () => {
        const navigator = createNavigator(fakeContext(), {
            interactions: {
                pan: true,
                brush: true,
            },
        });

        fire('pointerdown', {
            pointerId: 1,
            clientX: 20,
            clientY: 20,
            shiftKey: true,
        });
        fire('pointermove', {
            pointerId: 1,
            clientX: 80,
            clientY: 60,
            shiftKey: true,
        });

        expect(navigator.brush).toEqual({
            x0: 20,
            y0: 20,
            x1: 80,
            y1: 60,
        });
        // Panning must not have happened during the brush.
        expect(navigator.transform.x).toBe(0);

        navigator.destroy();
    });

    test('Should be a Navigator instance', () => {
        const navigator = createNavigator(fakeContext());

        expect(navigator).toBeInstanceOf(DOMNavigator);

        navigator.destroy();
    });

    test('Should stop responding after destroy', () => {
        const navigator = createNavigator(fakeContext(), {
            interactions: {
                pan: true,
            },
        });

        navigator.destroy();

        fire('pointerdown', {
            pointerId: 1,
            clientX: 0,
            clientY: 0,
        });
        fire('pointermove', {
            pointerId: 1,
            clientX: 50,
            clientY: 50,
        });

        expect(navigator.transform).toEqual({
            k: 1,
            x: 0,
            y: 0,
        });
    });

    test('Should zoom less with a lower zoom sensitivity', () => {
        const gentle = createNavigator(fakeContext(), {
            interactions: {
                zoom: {
                    sensitivity: 0.25,
                },
            },
        });
        const sharp = createNavigator(fakeContext(), {
            interactions: {
                zoom: {
                    sensitivity: 2,
                },
            },
        });

        const wheel = {
            deltaY: -100,
            clientX: 50,
            clientY: 50,
        };

        fire('wheel', wheel);

        const gentleK = gentle.transform.k;
        const sharpK = sharp.transform.k;

        expect(gentleK).toBeGreaterThan(1);
        expect(sharpK).toBeGreaterThan(gentleK);

        gentle.destroy();
        sharp.destroy();
    });

    test('Should pan with the finger that survives a pinch', () => {
        const navigator = createNavigator(fakeContext(), {
            interactions: {
                pan: true,
                zoom: true,
            },
        });

        fire('pointerdown', {
            pointerId: 1,
            clientX: 100,
            clientY: 100,
        });
        fire('pointerdown', {
            pointerId: 2,
            clientX: 200,
            clientY: 100,
        });
        fire('pointermove', {
            pointerId: 2,
            clientX: 240,
            clientY: 100,
        });
        fire('pointerup', {
            pointerId: 2,
            clientX: 240,
            clientY: 100,
        });

        const panned = navigator.transform.x;

        fire('pointermove', {
            pointerId: 1,
            clientX: 130,
            clientY: 100,
        });

        expect(navigator.transform.x).toBe(panned + 30);

        navigator.destroy();
    });

    // An uncaptured pointer never reaches `endPointer`, so the next gesture reads as a pinch.
    test('Should not misread a gesture that follows an uncaptured release as a pinch', () => {
        const navigator = createNavigator(fakeContext(), {
            interactions: {
                pan: true,
                zoom: true,
            },
        });

        const setPointerCapture = vi.fn();
        const onZoom = vi.fn();

        element.setPointerCapture = setPointerCapture;
        navigator.on('zoom', onZoom);

        fire('pointerdown', {
            pointerId: 1,
            clientX: 10,
            clientY: 10,
            button: 2,
        });

        expect(setPointerCapture).toHaveBeenCalledWith(1);

        fire('pointerup', {
            pointerId: 1,
            clientX: 10,
            clientY: 10,
        });

        fire('pointerdown', {
            pointerId: 2,
            clientX: 100,
            clientY: 100,
        });
        fire('pointermove', {
            pointerId: 2,
            clientX: 130,
            clientY: 100,
        });

        expect(navigator.transform.x).toBe(30);
        expect(onZoom).not.toHaveBeenCalled();

        navigator.destroy();
    });

    test('Should measure the element once per gesture, not once per pointer move', () => {
        const navigator = createNavigator(fakeContext(), {
            interactions: {
                pan: true,
            },
        });

        const getBoundingClientRect = vi.spyOn(element, 'getBoundingClientRect');

        fire('pointerdown', {
            pointerId: 1,
            clientX: 100,
            clientY: 100,
        });

        getBoundingClientRect.mockClear();

        for (let i = 0; i < 10; i++) {
            fire('pointermove', {
                pointerId: 1,
                clientX: 100 + i,
                clientY: 100,
            });
        }

        expect(getBoundingClientRect).not.toHaveBeenCalled();

        navigator.destroy();
    });

    test('Should re-measure the element after a scroll', () => {
        const navigator = createNavigator(fakeContext(), {
            interactions: {
                pan: true,
            },
        });

        const getBoundingClientRect = vi.spyOn(element, 'getBoundingClientRect');

        fire('pointerdown', {
            pointerId: 1,
            clientX: 100,
            clientY: 100,
        });

        getBoundingClientRect.mockClear();

        window.dispatchEvent(new Event('scroll'));

        fire('pointermove', {
            pointerId: 1,
            clientX: 130,
            clientY: 100,
        });

        expect(getBoundingClientRect).toHaveBeenCalledOnce();

        navigator.destroy();
    });

    test('Should leave touchAction alone when every interaction is disabled', () => {
        element.style.touchAction = 'pan-y';

        const navigator = createNavigator(fakeContext(), {
            interactions: {
                zoom: false,
                pan: false,
                brush: false,
            },
        });

        expect(element.style.touchAction).toBe('pan-y');

        navigator.destroy();
    });

    test('Should warn and stay inert on a non-DOM context', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        // Must not throw (previously crashed in `getBoundingClientRect`).
        const navigator = createNavigator(fakeNonDOMContext(), {
            interactions: {
                zoom: true,
                pan: true,
            },
        });

        expect(warn).toHaveBeenCalledOnce();

        // No listeners were attached, so gestures on the real element are ignored.
        fire('wheel', {
            deltaY: -100,
            clientX: 50,
            clientY: 50,
        });

        expect(navigator.transform).toEqual({
            k: 1,
            x: 0,
            y: 0,
        });

        navigator.destroy();
    });

});

describe('DOMNavigator bounds', () => {

    const BOUNDS = {
        x: 40,
        y: 40,
        width: 100,
        height: 100,
    };

    function boundedNavigator(): DOMNavigator {
        return createNavigator(fakeContext(), {
            bounds: BOUNDS,
            interactions: {
                zoom: true,
                pan: true,
            },
        });
    }

    test('Should zoom on a wheel inside the claimed region', () => {
        const navigator = boundedNavigator();

        fire('wheel', {
            deltaY: -100,
            clientX: 90,
            clientY: 90,
        });

        expect(navigator.transform.k).toBeGreaterThan(1);

        navigator.destroy();
    });

    test('Should leave a wheel outside the claimed region to the page', () => {
        const navigator = boundedNavigator();

        const event = new Event('wheel', {
            bubbles: true,
            cancelable: true,
        });

        Object.assign(event, {
            deltaY: -100,
            clientX: 10,
            clientY: 10,
        });

        element.dispatchEvent(event);

        expect(navigator.transform.k).toBe(1);
        // Not consuming the gesture is the point: a swallowed wheel would freeze the page scroll.
        expect(event.defaultPrevented).toBe(false);

        navigator.destroy();
    });

    test('Should ignore a drag that starts outside the claimed region', () => {
        const navigator = boundedNavigator();

        fire('pointerdown', {
            pointerId: 1,
            clientX: 10,
            clientY: 10,
        });

        fire('pointermove', {
            pointerId: 1,
            clientX: 60,
            clientY: 60,
        });

        expect(navigator.transform.x).toBe(0);

        navigator.destroy();
    });

    test('Should keep tracking a drag that starts inside and leaves the region', () => {
        const navigator = boundedNavigator();

        fire('pointerdown', {
            pointerId: 1,
            clientX: 100,
            clientY: 100,
        });

        fire('pointermove', {
            pointerId: 1,
            clientX: 400,
            clientY: 100,
        });

        expect(navigator.transform.x).toBe(300);

        navigator.destroy();
    });

    test('Should claim everything again once the region is cleared', () => {
        const navigator = boundedNavigator();

        navigator.bounds = undefined;

        fire('wheel', {
            deltaY: -100,
            clientX: 10,
            clientY: 10,
        });

        expect(navigator.transform.k).toBeGreaterThan(1);

        navigator.destroy();
    });

});
