import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    applyHoverHighlight,
    getMarkInteraction,
} from '../src/core/interaction';

/**
 * The hover animation is resolved through a thunk on every enter/leave rather than baked in when
 * the handlers are bound. This keeps a navigator-driven re-render (which resolves animation to a
 * zero duration while a gesture is in flight) from freezing the persistent hover into an instant snap.
 */
describe('applyHoverHighlight', () => {

    function createElement() {
        const handlers: Record<string, () => void> = {};
        const interpolator = vi.fn();

        const element = {
            parent: {} as unknown,
            on: (event: string, handler: () => void) => {
                handlers[event] = handler;
                return { dispose: vi.fn() };
            },
            interpolate: vi.fn(() => interpolator),
        };

        return {
            element,
            handlers,
            interpolator,
        };
    }

    function bind(animation: () => { duration: number;
        ease: (t: number) => number; }) {
        const { element, handlers, interpolator } = createElement();
        const abort = vi.fn();
        const transition = vi.fn(() => ({
            abort,
            catch: vi.fn(),
        }));
        const start = vi.fn();

        applyHoverHighlight(element as never, {
            renderer: {
                transition,
                start,
            } as never,
            animation,
            highlight: { radius: 12 } as never,
            restore: { radius: 10 } as never,
        });

        return {
            handlers,
            transition,
            abort,
            start,
            element,
            interpolator,
        };
    }

    test('resolves the transition timing at hover time, not when the handlers are bound', () => {
        // Simulate binding during a navigator gesture, when the resolver would report a zero duration.
        let duration = 0;
        const { handlers, transition } = bind(() => ({
            duration,
            ease: t => t,
        }));

        // The gesture ends; a later hover must animate with the real duration.
        duration = 300;
        handlers.mouseenter();

        expect(transition).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ duration: 300 }));
    });

    test('re-resolves on every enter and leave', () => {
        const durations = [120, 340];
        let call = 0;
        const { handlers, transition } = bind(() => ({
            duration: durations[call++],
            ease: t => t,
        }));

        handlers.mouseenter();
        handlers.mouseleave();

        expect(transition).toHaveBeenNthCalledWith(1, expect.anything(), expect.objectContaining({ duration: 120 }));
        expect(transition).toHaveBeenNthCalledWith(2, expect.anything(), expect.objectContaining({ duration: 340 }));
    });

    test('replaces the stored handle when re-applied to a persistent element', () => {
        const { element } = createElement();
        const options = {
            renderer: {
                transition: vi.fn(() => ({
                    abort: vi.fn(),
                    catch: vi.fn(),
                })),
                start: vi.fn(),
            } as never,
            animation: () => ({
                duration: 200,
                ease: (t: number) => t,
            }),
            highlight: { radius: 12 } as never,
            restore: { radius: 10 } as never,
        };

        applyHoverHighlight(element as never, options);
        const first = getMarkInteraction(element as never);

        applyHoverHighlight(element as never, options);
        const second = getMarkInteraction(element as never);

        expect(first).toBeDefined();
        expect(second).toBeDefined();
        expect(second).not.toBe(first);
    });

    test('restores by aborting the retained transition and writing the state, with no transition of its own', () => {
        const {
            element,
            transition,
            abort,
            interpolator,
        } = bind(() => ({
            duration: 300,
            ease: t => t,
        }));

        const interaction = getMarkInteraction(element as never)!;

        interaction.enter();
        transition.mockClear();
        interaction.leave({ duration: 0 });

        // A zero-duration transition lands a frame later, and the in-flight tween would overwrite it.
        expect(transition).not.toHaveBeenCalled();
        expect(abort).toHaveBeenCalled();
        expect(element.interpolate).toHaveBeenCalledWith({ radius: 10 });
        expect(interpolator).toHaveBeenCalledWith(1);
    });

    test('no-ops when the element is detached from the scene', () => {
        const { element, transition } = bind(() => ({
            duration: 300,
            ease: t => t,
        }));

        // Transitioning a detached element never advances, pinning the renderer's loop forever.
        element.parent = undefined;

        const interaction = getMarkInteraction(element as never)!;

        expect(interaction.enter()).toBe(false);
        expect(transition).not.toHaveBeenCalled();
        expect(element.interpolate).not.toHaveBeenCalled();
    });

});
