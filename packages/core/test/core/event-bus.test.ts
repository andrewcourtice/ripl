import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    Event,
    EVENT_WILDCARD,
    EventBus,
} from '../../src';

type TestEventMap = {
    destroyed: null;
    test: string;
    count: number;
    bespoke: null;
};

describe('EventBus', () => {

    test('Should expose an empty event list on the base bus', () => {
        const bus = new EventBus<TestEventMap>();
        expect(bus.$events).toEqual([]);
    });

    test('Should allow subclasses to declare their emittable events', () => {
        class CustomBus extends EventBus<TestEventMap> {
            public get $events(): (keyof TestEventMap)[] {
                return ['test', 'count'];
            }
        }

        expect(new CustomBus().$events).toEqual(['test', 'count']);
    });

    test('Should emit and receive events', () => {
        const bus = new EventBus<TestEventMap>();
        const handler = vi.fn();

        bus.on('test', handler);
        bus.emit('test', 'hello');

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0]).toBeInstanceOf(Event);
        expect(handler.mock.calls[0][0].data).toBe('hello');
    });

    test('Should unsubscribe with off()', () => {
        const bus = new EventBus<TestEventMap>();
        const handler = vi.fn();

        bus.on('test', handler);
        bus.emit('test', 'first');
        bus.off('test', handler);
        bus.emit('test', 'second');

        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('Should unsubscribe via dispose()', () => {
        const bus = new EventBus<TestEventMap>();
        const handler = vi.fn();

        const { dispose } = bus.on('test', handler);
        bus.emit('test', 'first');
        dispose();
        bus.emit('test', 'second');

        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('Should fire once() handler only once', () => {
        const bus = new EventBus<TestEventMap>();
        const handler = vi.fn();

        bus.once('test', handler);
        bus.emit('test', 'first');
        bus.emit('test', 'second');

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].data).toBe('first');
    });

    test('Should bubble events to parent', () => {
        const parent = new EventBus<TestEventMap>();
        const child = new EventBus<TestEventMap>();
        child.parent = parent;

        const parentHandler = vi.fn();
        parent.on('test', parentHandler);

        child.emit('test', 'bubbled');

        expect(parentHandler).toHaveBeenCalledTimes(1);
        expect(parentHandler.mock.calls[0][0].data).toBe('bubbled');
        expect(parentHandler.mock.calls[0][0].target).toBe(child);
    });

    test('Should stop propagation', () => {
        const parent = new EventBus<TestEventMap>();
        const child = new EventBus<TestEventMap>();
        child.parent = parent;

        const parentHandler = vi.fn();
        parent.on('test', parentHandler);

        child.on('test', (event) => {
            event.stopPropagation();
        });

        child.emit('test', 'stopped');

        expect(parentHandler).not.toHaveBeenCalled();
    });

    test('Should support self-only option', () => {
        const parent = new EventBus<TestEventMap>();
        const child = new EventBus<TestEventMap>();
        child.parent = parent;

        const selfHandler = vi.fn();
        parent.on('test', selfHandler, { self: true });

        child.emit('test', 'from-child');
        parent.emit('test', 'from-parent');

        expect(selfHandler).toHaveBeenCalledTimes(1);
        expect(selfHandler.mock.calls[0][0].data).toBe('from-parent');
    });

    test('Should report has() correctly', () => {
        const bus = new EventBus<TestEventMap>();

        expect(bus.has('test')).toBe(false);


        const { dispose } = bus.on('test', () => {});
        expect(bus.has('test')).toBe(true);

        dispose();
        expect(bus.has('test')).toBe(false);
    });

    test('Should invoke a wildcard listener for every event type', () => {
        const bus = new EventBus<TestEventMap>();
        const handler = vi.fn();

        bus.on(EVENT_WILDCARD, handler);
        bus.emit('test', 'hello');
        bus.emit('count', 42);
        bus.emit('bespoke', null);

        expect(handler).toHaveBeenCalledTimes(3);
        expect(handler.mock.calls.map(([event]) => event.type)).toEqual(['test', 'count', 'bespoke']);
    });

    test('Should invoke wildcard listeners after listeners for the event type', () => {
        const bus = new EventBus<TestEventMap>();
        const order: string[] = [];

        bus.on(EVENT_WILDCARD, () => order.push('wildcard'));
        bus.on('test', () => order.push('typed'));
        bus.emit('test', 'hello');

        expect(order).toEqual(['typed', 'wildcard']);
    });

    test('Should invoke a wildcard listener once for an event emitted as the wildcard type', () => {
        const bus = new EventBus<TestEventMap>();
        const handler = vi.fn();

        bus.on(EVENT_WILDCARD, handler);
        bus.emit(EVENT_WILDCARD, null);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('Should see bubbled events on an ancestor wildcard listener with the original target', () => {
        const parent = new EventBus<TestEventMap>();
        const child = new EventBus<TestEventMap>();
        const handler = vi.fn();

        child.parent = parent;
        parent.on(EVENT_WILDCARD, handler);
        child.emit('test', 'from-child');

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0][0].target).toBe(child);
    });

    test('Should not invoke an ancestor wildcard listener after stopPropagation', () => {
        const parent = new EventBus<TestEventMap>();
        const child = new EventBus<TestEventMap>();
        const handler = vi.fn();

        child.parent = parent;
        parent.on(EVENT_WILDCARD, handler);
        child.on('test', event => event.stopPropagation());
        child.emit('test', 'from-child');

        expect(handler).not.toHaveBeenCalled();
    });

    test('Should honor the self option for wildcard listeners', () => {
        const parent = new EventBus<TestEventMap>();
        const child = new EventBus<TestEventMap>();
        const handler = vi.fn();

        child.parent = parent;
        parent.on(EVENT_WILDCARD, handler, {
            self: true,
        });

        child.emit('test', 'from-child');
        expect(handler).not.toHaveBeenCalled();

        parent.emit('test', 'from-parent');
        expect(handler).toHaveBeenCalledTimes(1);
    });

    // Interaction events only reach elements that `has` them, so an observer must stay invisible here.
    test('Should not report has() for a type with only a wildcard listener', () => {
        const bus = new EventBus<TestEventMap>();

        bus.on(EVENT_WILDCARD, () => {});

        expect(bus.has('test')).toBe(false);
        expect(bus.has('count')).toBe(false);
    });

    test('Should not list the wildcard in $events', () => {
        class CustomBus extends EventBus<TestEventMap> {
            public get $events(): (keyof TestEventMap)[] {
                return ['test', 'count'];
            }
        }

        const bus = new CustomBus();

        bus.on(EVENT_WILDCARD, () => {});

        expect(bus.$events).not.toContain(EVENT_WILDCARD);
    });

    test('Should unsubscribe a wildcard listener with off() and dispose()', () => {
        const bus = new EventBus<TestEventMap>();
        const offHandler = vi.fn();
        const disposeHandler = vi.fn();

        bus.on(EVENT_WILDCARD, offHandler);

        const { dispose } = bus.on(EVENT_WILDCARD, disposeHandler);

        bus.emit('test', 'first');
        bus.off(EVENT_WILDCARD, offHandler);
        dispose();
        bus.emit('test', 'second');

        expect(offHandler).toHaveBeenCalledTimes(1);
        expect(disposeHandler).toHaveBeenCalledTimes(1);
    });

    test('Should fire a once() wildcard listener only once', () => {
        const bus = new EventBus<TestEventMap>();
        const handler = vi.fn();

        bus.once(EVENT_WILDCARD, handler);
        bus.emit('test', 'first');
        bus.emit('count', 42);

        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('Should clear all listeners on destroy()', () => {
        const bus = new EventBus<TestEventMap>();
        const handler = vi.fn();
        const destroyHandler = vi.fn();

        bus.on('test', handler);
        bus.on('destroyed', destroyHandler);
        bus.destroy();

        expect(destroyHandler).toHaveBeenCalledTimes(1);

        bus.emit('test', 'after-destroy');
        expect(handler).not.toHaveBeenCalled();
    });

    // Anything that re-subscribes during teardown was woken again by the second destroy.
    test('Should not re-emit destroyed on a second destroy()', () => {
        const bus = new EventBus<TestEventMap>();
        const handler = vi.fn();

        bus.destroy();
        bus.on('destroyed', handler);
        bus.destroy();

        expect(handler).not.toHaveBeenCalled();
    });

    // A `#private` field throws when `this` is a Proxy, so Vue's `reactive()` broke every subclass.
    test('Should tear down through a proxy', () => {
        const bus = new Proxy(new EventBus<TestEventMap>(), {});
        const handler = vi.fn();

        bus.on('destroyed', handler);

        expect(() => bus.destroy()).not.toThrow();
        expect(handler).toHaveBeenCalledTimes(1);

        bus.destroy();

        expect(handler).toHaveBeenCalledTimes(1);
    });

    test('Event should have correct timestamp and type', () => {
        const bus = new EventBus<TestEventMap>();
        let capturedEvent: Event<number> | undefined;

        bus.on('count', (event) => {
            capturedEvent = event;
        });

        const before = performance.now();
        bus.emit('count', 42);
        const after = performance.now();

        expect(capturedEvent).toBeDefined();
        expect(capturedEvent!.type).toBe('count');
        expect(capturedEvent!.data).toBe(42);
        expect(capturedEvent!.timestamp).toBeGreaterThanOrEqual(before);
        expect(capturedEvent!.timestamp).toBeLessThanOrEqual(after);
    });

});
