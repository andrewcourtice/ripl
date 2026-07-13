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

});
