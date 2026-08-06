import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createSurfaceOrigin,
    getSurfaceRect,
} from '../src';

import type {
    Context,
} from '@ripl/core';

let element: HTMLDivElement;

/** A stand-in context exposing the element the origin measures and the logical size it reports. */
function fakeContext(width = 400, height = 200): Context {
    return {
        element,
        width,
        height,
    } as unknown as Context;
}

function setRect(left: number, top: number, width = 400, height = 200): void {
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
        left,
        top,
        width,
        height,
        right: left + width,
        bottom: top + height,
        x: left,
        y: top,
        toJSON: () => ({}),
    } as DOMRect);
}

beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    setRect(0, 0);
});

afterEach(() => {
    element.remove();
    vi.restoreAllMocks();
});

describe('getSurfaceRect', () => {

    test('Should report the scale between the on-screen and logical size', () => {
        setRect(10, 20);

        expect(getSurfaceRect(fakeContext(200, 100))).toEqual({
            left: 10,
            top: 20,
            width: 400,
            height: 200,
            scaleX: 2,
            scaleY: 2,
        });
    });

    test('Should return an identity rect for a non-DOM context', () => {
        expect(getSurfaceRect({ element: {} } as unknown as Context)).toEqual({
            left: 0,
            top: 0,
            width: 0,
            height: 0,
            scaleX: 1,
            scaleY: 1,
        });
    });

});

describe('createSurfaceOrigin', () => {

    test('Should measure the surface once per invalidation', () => {
        const origin = createSurfaceOrigin(fakeContext());
        const measure = vi.spyOn(element, 'getBoundingClientRect').mockClear();

        origin.toLogicalPoint({
            clientX: 0,
            clientY: 0,
        });
        origin.toLogicalPoint({
            clientX: 1,
            clientY: 1,
        });

        expect(measure).toHaveBeenCalledTimes(1);

        origin.dispose();
    });

    // A banner dismissed above the chart translates the surface with no scroll and no resize.
    test('Should re-measure when the pointer enters after a layout translation', () => {
        const origin = createSurfaceOrigin(fakeContext());

        expect(origin.toLogicalPoint({
            clientX: 100,
            clientY: 50,
        })).toEqual([100, 50]);

        setRect(0, 200);
        element.dispatchEvent(new MouseEvent('pointerenter'));

        expect(origin.toLogicalPoint({
            clientX: 100,
            clientY: 250,
        })).toEqual([100, 50]);

        origin.dispose();
    });

    test('Should re-measure on a mouseenter, which is all a mouse-only surface reports', () => {
        const origin = createSurfaceOrigin(fakeContext());

        origin.toLogicalPoint({
            clientX: 0,
            clientY: 0,
        });

        setRect(60, 0);
        element.dispatchEvent(new MouseEvent('mouseenter'));

        expect(origin.toLogicalPoint({
            clientX: 100,
            clientY: 50,
        })).toEqual([40, 50]);

        origin.dispose();
    });

    test('Should stop re-measuring once disposed', () => {
        const origin = createSurfaceOrigin(fakeContext());

        origin.toLogicalPoint({
            clientX: 0,
            clientY: 0,
        });
        origin.dispose();

        // `spyOn` returns the already-installed spy, so drop the setup calls it recorded.
        const measure = vi.spyOn(element, 'getBoundingClientRect').mockClear();

        element.dispatchEvent(new MouseEvent('pointerenter'));
        window.dispatchEvent(new Event('scroll'));

        origin.toLogicalPoint({
            clientX: 0,
            clientY: 0,
        });

        expect(measure).not.toHaveBeenCalled();
    });

    test('Should round-trip a point through a scaled surface', () => {
        setRect(10, 20);

        const origin = createSurfaceOrigin(fakeContext(200, 100));

        expect(origin.toLogicalPoint({
            clientX: 310,
            clientY: 170,
        })).toEqual([150, 75]);

        expect(origin.toClientPoint(150, 75)).toEqual([310, 170]);

        origin.dispose();
    });

});
