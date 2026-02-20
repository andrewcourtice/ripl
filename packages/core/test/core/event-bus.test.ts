import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    Event,
    EventBus,
} from '../../src';

type TestEventMap = {
    destroyed: null;
    test: string;
    count: number;
};

describe('EventBus', () => {

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

        // eslint-disable-next-line @typescript-eslint/no-empty-function
        const { dispose } = bus.on('test', () => {});
        expect(bus.has('test')).toBe(true);

        dispose();
        expect(bus.has('test')).toBe(false);
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
