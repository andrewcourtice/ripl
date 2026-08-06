import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createCamera,
    createContext,
} from '../src';

import type {
    Context3D,
} from '../src';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

function createMockContext(): Context3D {
    return createContext(document.createElement('div'));
}

/** Dispatches a DOM event with arbitrary properties, sidestepping jsdom constructor gaps. */
function fire(context: Context3D, type: string, props: Record<string, unknown>): void {
    const event = new Event(type, {
        bubbles: true,
        cancelable: true,
    });

    Object.assign(event, props);
    (context.element as unknown as HTMLElement).dispatchEvent(event);
}

/** A horizontal two-finger touch list, `spread` pixels apart and centred on the origin. */
function touchPair(spread: number) {
    return [
        {
            clientX: -spread / 2,
            clientY: 0,
        },
        {
            clientX: spread / 2,
            clientY: 0,
        },
    ];
}

describe('Camera', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('Construction with defaults', () => {
        const context = createMockContext();
        const camera = createCamera(context);

        expect(camera.position).toEqual([0, 0, 5]);
        expect(camera.target).toEqual([0, 0, 0]);
        expect(camera.up).toEqual([0, 1, 0]);
        expect(camera.fov).toBe(60);
        expect(camera.near).toBe(0.1);
        expect(camera.far).toBe(1000);
        expect(camera.projection).toBe('perspective');
    });

    test('Construction with custom options', () => {
        const context = createMockContext();
        const camera = createCamera(context, {
            position: [1, 2, 3],
            target: [4, 5, 6],
            fov: 90,
        });

        expect(camera.position).toEqual([1, 2, 3]);
        expect(camera.target).toEqual([4, 5, 6]);
        expect(camera.fov).toBe(90);
    });

    test('orbit changes position but not target', () => {
        const context = createMockContext();
        const camera = createCamera(context);
        const originalTarget = [...camera.target];

        camera.orbit(0.1, 0);
        camera.flush();

        expect(camera.target).toEqual(originalTarget);
        // Position should have changed
        expect(camera.position[0]).not.toBeCloseTo(0, 2);
    });

    test('pan shifts both position and target', () => {
        const context = createMockContext();
        const camera = createCamera(context, {
            position: [0, 0, 5],
            target: [0, 0, 0],
        });

        const origPos = [...camera.position];
        const origTarget = [...camera.target];

        camera.pan(1, 0);
        camera.flush();

        // Both should have shifted
        expect(camera.position[0]).not.toBeCloseTo(origPos[0], 2);
        expect(camera.target[0]).not.toBeCloseTo(origTarget[0], 2);
    });

    test('zoom moves position along eye-target vector', () => {
        const context = createMockContext();
        const camera = createCamera(context, {
            position: [0, 0, 10],
            target: [0, 0, 0],
        });

        camera.zoom(2);
        camera.flush();

        // Position z should be closer to target (smaller)
        expect(camera.position[2]).toBeCloseTo(8, 1);
    });

    test('lookAt updates target', () => {
        const context = createMockContext();
        const camera = createCamera(context);

        camera.lookAt([5, 5, 5]);
        camera.flush();

        expect(camera.target).toEqual([5, 5, 5]);
    });

    test('Reactive batching: multiple changes produce single flush', async () => {
        const context = createMockContext();
        const camera = createCamera(context);

        const setCameraSpy = vi.spyOn(context, 'setCamera');

        // Reset spy after initial construction flush
        setCameraSpy.mockClear();

        // Multiple property changes in same synchronous block
        camera.position = [1, 2, 3];
        camera.target = [4, 5, 6];
        camera.fov = 90;

        // Not flushed yet synchronously
        expect(setCameraSpy).not.toHaveBeenCalled();

        // Wait for microtask
        await Promise.resolve();

        // Should have been called exactly once
        expect(setCameraSpy).toHaveBeenCalledTimes(1);
    });

    describe('Interaction attachment', () => {

        // 3D-12: the touch block and `touch-action: none` were unconditional, and every handler
        // called `preventDefault` before consulting the per-interaction flags — so a chart with
        // interactions off still stopped a phone from scrolling past it, and did nothing else.
        test('Should attach no touch listeners when every interaction is disabled', () => {
            const context = createMockContext();
            const element = context.element as unknown as HTMLElement;
            const spy = vi.spyOn(element, 'addEventListener');

            createCamera(context, {
                interactions: {
                    zoom: false,
                    pivot: false,
                    pan: false,
                },
            });

            expect(spy.mock.calls.filter(([event]) => String(event).startsWith('touch'))).toHaveLength(0);
        });

        test('Should leave touch-action alone when every interaction is disabled', () => {
            const context = createMockContext();
            const element = context.element as unknown as HTMLElement;

            createCamera(context, {
                interactions: {
                    zoom: false,
                    pivot: false,
                    pan: false,
                },
            });

            expect(element.style.touchAction).toBe('');
        });

        test('Should attach touch listeners when an interaction is enabled', () => {
            const context = createMockContext();
            const element = context.element as unknown as HTMLElement;
            const spy = vi.spyOn(element, 'addEventListener');

            createCamera(context, {
                interactions: {
                    pivot: true,
                },
            });

            expect(spy.mock.calls.filter(([event]) => String(event).startsWith('touch')).length).toBeGreaterThan(0);
        });

        test('Should claim touch-action when an interaction is enabled', () => {
            const context = createMockContext();
            const element = context.element as unknown as HTMLElement;

            createCamera(context, {
                interactions: true,
            });

            expect(element.style.touchAction).toBe('none');
        });

    });

    describe('Zoom interactions', () => {

        // The wheel handler fed `deltaY` into `zoom` unnegated, and a positive delta dollies
        // toward the target — so scrolling down zoomed in, the reverse of the 2D navigator.
        test('Should zoom out when the wheel is scrolled down', () => {
            const context = createMockContext();
            const camera = createCamera(context, {
                interactions: {
                    zoom: true,
                },
            });

            fire(context, 'wheel', {
                deltaY: 100,
            });

            expect(camera.position[2]).toBeGreaterThan(5);
        });

        test('Should zoom in when the wheel is scrolled up', () => {
            const context = createMockContext();
            const camera = createCamera(context, {
                interactions: {
                    zoom: true,
                },
            });

            fire(context, 'wheel', {
                deltaY: -100,
            });

            expect(camera.position[2]).toBeLessThan(5);
        });

        // The old linear step took a proportion of the current distance, so a scroll back up
        // undershot the distance the scroll down had left.
        test('Should return to the starting distance after equal and opposite scrolls', () => {
            const context = createMockContext();
            const camera = createCamera(context, {
                interactions: {
                    zoom: true,
                },
            });

            fire(context, 'wheel', {
                deltaY: 120,
            });

            fire(context, 'wheel', {
                deltaY: -120,
            });

            expect(camera.position[2]).toBeCloseTo(5);
        });

        test('Should zoom in when two fingers spread apart', () => {
            const context = createMockContext();
            const camera = createCamera(context, {
                interactions: {
                    zoom: true,
                },
            });

            fire(context, 'touchstart', {
                touches: touchPair(100),
            });

            fire(context, 'touchmove', {
                touches: touchPair(200),
            });

            expect(camera.position[2]).toBeLessThan(5);
        });

        test('Should zoom out when two fingers pinch together', () => {
            const context = createMockContext();
            const camera = createCamera(context, {
                interactions: {
                    zoom: true,
                },
            });

            fire(context, 'touchstart', {
                touches: touchPair(200),
            });

            fire(context, 'touchmove', {
                touches: touchPair(100),
            });

            expect(camera.position[2]).toBeGreaterThan(5);
        });

        test('Should not zoom on the wheel when zooming is disabled', () => {
            const context = createMockContext();
            const camera = createCamera(context, {
                interactions: {
                    pivot: true,
                    zoom: false,
                },
            });

            fire(context, 'wheel', {
                deltaY: 100,
            });

            expect(camera.position[2]).toBe(5);
        });

    });

    describe('Degenerate inputs', () => {

        // 3D-17: `orbit` divides by the eye-to-target distance, and a camera sitting on its target
        // produced an all-NaN view matrix that blanked the scene permanently, with no error.
        test('Should not produce a NaN position when orbiting a camera on its target', () => {
            const context = createMockContext();
            const camera = createCamera(context, {
                position: [0, 0, 0],
                target: [0, 0, 0],
            });

            camera.orbit(0.2, 0.1);
            camera.flush();

            for (const value of camera.position) {
                expect(Number.isNaN(value)).toBe(false);
            }
        });

        test('Should not clip the target through the near plane on a full zoom-in', () => {
            const context = createMockContext();
            const camera = createCamera(context, {
                position: [0, 0, 5],
                target: [0, 0, 0],
                near: 0.1,
            });

            camera.zoom(1000);
            camera.flush();

            expect(camera.position[2]).toBeCloseTo(0.1);
        });

    });

});
