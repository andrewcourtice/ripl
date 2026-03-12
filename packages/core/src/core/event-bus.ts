import {
    Disposer,
} from './disposer';

import {
    setForEach,
} from '@ripl/utilities';

import type {
    Disposable,
} from '@ripl/utilities';

/** Base event map interface; all custom event maps should extend this. */
export type EventMap = {
    [key: string]: unknown;
    destroyed: null;
};

/** Options for emitting an event, controlling bubbling and attached data. */
export type EventOptions<TData = undefined> = {
    bubbles?: boolean;
    data?: TData;
};

/** Options for subscribing to an event, such as filtering to self-targeted events only. */
export type EventSubscriptionOptions = {
    self?: boolean;
};

/** A callable event handler function with optional subscription options. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandler<TData = any> = {
    (event: Event<TData>): void;
} & EventSubscriptionOptions;

/** An event object carrying type, data, target reference, and propagation control. */
export class Event<TData = undefined> {

    #bubbles = true;

    public readonly type: string;
    public readonly data: TData;
    public readonly timestamp: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly target: EventBus<any>;

    public get bubbles() {
        return this.#bubbles;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(type: string, target: EventBus<any>, options?: EventOptions<TData>) {
        const {
            data,
            bubbles = true,
        } = options || {};

        this.type = type;
        this.target = target;
        this.data = data as TData;
        this.timestamp = performance.now();
        this.#bubbles = bubbles;
    }

    /** Prevents this event from bubbling further up the parent chain. */
    public stopPropagation() {
        this.#bubbles = false;
    }

}

/** A typed pub/sub event system with parent-chain bubbling, disposable subscriptions, and self-filtering. */
export class EventBus<TEventMap extends EventMap = EventMap> extends Disposer {

    public parent?: EventBus<TEventMap>;

    private listeners = new Map<keyof TEventMap, Set<EventHandler>>();

    /** Returns whether there are any listeners registered for the given event type. */
    public has(type: keyof TEventMap) {
        return !!this.listeners.get(type)?.size;
    }

    /** Subscribes a handler to the given event type and returns a disposable for cleanup. */
    public on<TEvent extends keyof TEventMap>(type: TEvent, handler: EventHandler<TEventMap[TEvent]>, options?: EventSubscriptionOptions): Disposable {
        const handlers = this.listeners.get(type) || new Set();

        Object.assign(handler, options);
        handlers.add(handler);
        this.listeners.set(type, handlers);

        return {
            dispose: () => this.off(type, handler),
        };
    }

    /** Removes a previously registered handler for the given event type. */
    public off<TEvent extends keyof TEventMap>(type: TEvent, handler: EventHandler<TEventMap[TEvent]>): void {
        const handlers = this.listeners.get(type);

        if (!handlers) {
            return;
        }

        handlers.delete(handler);

        if (!handlers.size) {
            this.listeners.delete(type);
        }
    }

    /** Subscribes a handler that is automatically removed after it fires once. */
    public once<TEvent extends keyof TEventMap>(type: TEvent, handler: EventHandler<TEventMap[TEvent]>, options?: EventSubscriptionOptions): Disposable {
        const callback = ((...args: Parameters<typeof handler>) => {
            handler(...args);
            this.off(type, callback);
        });

        return this.on(type, callback, options);
    }

    /** Emits an event, invoking all matching handlers and bubbling to the parent if applicable. */
    public emit<TEvent extends Event = Event>(event: TEvent): TEvent;
    public emit<TEvent extends keyof TEventMap>(type: TEvent, data: TEventMap[TEvent]): Event<TEventMap[TEvent]>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public emit(...args: any[]): Event<any> {
        const event = args.length === 1 && args[0] instanceof Event
            ? args[0]
            : new Event(args[0], this, {
                data: args[1],
            });

        const handlers = this.listeners.get(event.type);

        if (handlers) {
            setForEach(handlers, handler => {
                if (!handler.self || event.target === this) {
                    handler(event);
                }
            });
        }

        if (this.parent && event.bubbles) {
            this.parent.emit(event);
        }

        return event;
    }

    /** Emits a `destroyed` event, clears all listeners, and disposes retained resources. */
    public destroy() {
        this.emit('destroyed', null);
        this.listeners.clear();
        this.dispose();
    }

}
