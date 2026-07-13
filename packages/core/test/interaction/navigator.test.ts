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
    Navigator,
    rescaleDomain,
} from '../../src';

import type {
    Context,
} from '../../src';

let element: HTMLDivElement;

/** A minimal stand-in context exposing only the DOM element the navigator needs. */
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

describe('Navigator transform', () => {

    test('Should start at the identity transform', () => {
        const navigator = createNavigator(fakeContext());

        expect(navigator.transform).toEqual({
            k: 1,
            x: 0,
            y: 0,
        });
    });

    test('Should pan by a pixel delta and emit pan + change', () => {
        const navigator = createNavigator(fakeContext());
        const onPan = vi.fn();
        const onChange = vi.fn();

        navigator.on('pan', onPan);
        navigator.on('change', onChange);

        navigator.panBy(30, -10);

        expect(navigator.transform.x).toBe(30);
        expect(navigator.transform.y).toBe(-10);
        expect(onPan).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledTimes(1);
    });

    test('Should keep the zoom centre fixed', () => {
        const navigator = createNavigator(fakeContext());

        navigator.zoomBy(2, [100, 100]);

        // The data point under screen [100, 100] is unchanged by a centred zoom.
        expect(navigator.invertPoint([100, 100])).toEqual([100, 100]);
        expect(navigator.transform.k).toBe(2);
    });

    test('Should clamp the zoom to the scale extent', () => {
        const navigator = new Navigator(fakeContext(), {
            scaleExtent: [0.5, 4],
        });

        navigator.zoomBy(100);
        expect(navigator.transform.k).toBe(4);

        navigator.zoomBy(0.0001);
        expect(navigator.transform.k).toBe(0.5);
    });

    test('Should round-trip applyPoint and invertPoint', () => {
        const navigator = createNavigator(fakeContext());
        navigator.setTransform({
            k: 2.5,
            x: 40,
            y: -15,
        });

        expect(navigator.invertPoint(navigator.applyPoint([12, 34]))).toEqual([12, 34]);
    });

    test('Should reset to the identity', () => {
        const navigator = createNavigator(fakeContext());
        navigator.panBy(50, 50);
        navigator.zoomBy(3);

        navigator.reset();

        expect(navigator.transform).toEqual({
            k: 1,
            x: 0,
            y: 0,
        });
    });

});

describe('Navigator brush', () => {

    test('Should normalise the brush extent and emit brush', () => {
        const navigator = createNavigator(fakeContext());
        const onBrush = vi.fn();

        navigator.on('brush', onBrush);

        navigator.setBrush({
            x0: 100,
            y0: 80,
            x1: 20,
            y1: 10,
        });

        expect(navigator.brush).toEqual({
            x0: 20,
            y0: 10,
            x1: 100,
            y1: 80,
        });
        expect(onBrush).toHaveBeenCalledTimes(1);
    });

    test('Should clear the brush and emit brushend', () => {
        const navigator = createNavigator(fakeContext());
        const onEnd = vi.fn();

        navigator.on('brushend', onEnd);
        navigator.setBrush({
            x0: 0,
            y0: 0,
            x1: 10,
            y1: 10,
        });

        navigator.clearBrush();

        expect(navigator.brush).toBeNull();
        expect(onEnd).toHaveBeenCalledWith(expect.objectContaining({
            data: null,
        }));
    });

});

describe('rescaleDomain', () => {

    test('Should invert the transformed range through the scale', () => {
        const identity = {
            inverse: (value: number) => value,
        };

        // 2x zoom centred so screen 0..200 maps back to data 50..150.
        const domain = rescaleDomain(identity, {
            k: 2,
            x: -100,
            y: 0,
        }, [0, 200]);

        expect(domain).toEqual([50, 150]);
    });

});

describe('Navigator interactions', () => {

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

    test('Should pan on pointer drag', () => {
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
