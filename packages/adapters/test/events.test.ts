import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createEventForwarder,
    ELEMENT_EVENTS,
    getBoundListeners,
} from '@ripl/adapters';

import {
    createCircle,
} from '@ripl/web';

describe('@ripl/adapters events', () => {

    describe('Bound listeners', () => {

        test('Should map each event name back to the prop it came from', () => {
            const bound = getBoundListeners({
                onClick: () => undefined,
                onMousedown: undefined,
                fill: '#f00',
            });

            expect(Array.from(bound.entries())).toEqual([['click', 'onClick']]);
        });

    });

    describe('Forwarder', () => {

        test('Should declare the events an element actually emits', () => {
            expect(ELEMENT_EVENTS).toContain('click');
            expect(ELEMENT_EVENTS).toContain('graph');
        });

        // `Element.on` invalidates the context's tracked-element cache for pointer events, so
        // subscribing to an unbound event would silently make the element a hit-test target.
        test('Should subscribe only to the events that are bound', () => {
            const element = createCircle({
                cx: 0,
                cy: 0,
                radius: 1,
            });

            const forwarder = createEventForwarder(() => element);
            const dispatch = vi.fn();

            forwarder.sync(getBoundListeners({
                onClick: () => undefined,
            }), dispatch);

            expect(element.has('click')).toBe(true);
            expect(element.has('mousemove')).toBe(false);

            element.emit('click', {
                x: 1,
                y: 2,
            });

            expect(dispatch).toHaveBeenCalledTimes(1);
            expect(dispatch.mock.calls[0][0]).toBe('click');
            expect(dispatch.mock.calls[0][1]).toEqual({
                x: 1,
                y: 2,
            });
        });

        test('Should unsubscribe an event whose listener is no longer bound', () => {
            const element = createCircle({
                cx: 0,
                cy: 0,
                radius: 1,
            });

            const forwarder = createEventForwarder(() => element);
            const dispatch = vi.fn();

            forwarder.sync(getBoundListeners({
                onClick: () => undefined,
            }), dispatch);

            forwarder.sync(getBoundListeners({}), dispatch);

            expect(element.has('click')).toBe(false);
        });

        test('Should release every subscription it holds', () => {
            const element = createCircle({
                cx: 0,
                cy: 0,
                radius: 1,
            });

            const forwarder = createEventForwarder(() => element);

            forwarder.sync(getBoundListeners({
                onClick: () => undefined,
                onMousemove: () => undefined,
            }), vi.fn());

            forwarder.release();

            expect(element.has('click')).toBe(false);
            expect(element.has('mousemove')).toBe(false);
        });

    });

});
