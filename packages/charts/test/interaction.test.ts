import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    applyHoverHighlight,
} from '../src/core/interaction';

/**
 * The hover animation is resolved through a thunk on every enter/leave rather than baked in when
 * the handlers are bound. This keeps a navigator-driven re-render (which resolves animation to a
 * zero duration while a gesture is in flight) from freezing the persistent hover into an instant snap.
 */
describe('applyHoverHighlight', () => {

    function bind(animation: () => { duration: number;
        ease: (t: number) => number; }) {
        const handlers: Record<string, () => void> = {};
        const transition = vi.fn();

        const element = {
            on: (event: string, handler: () => void) => {
                handlers[event] = handler;
                return { dispose: vi.fn() };
            },
        };

        applyHoverHighlight(element as never, {
            renderer: { transition } as never,
            animation,
            highlight: { radius: 12 } as never,
            restore: { radius: 10 } as never,
        });

        return {
            handlers,
            transition,
            element,
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

});
