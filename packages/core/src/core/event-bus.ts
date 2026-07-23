import {
    Disposer,
} from './disposer';

import {
    factory,
} from './factory';

import {
    setForEach,
} from '@ripl/utilities';

import type {
    Disposable,
} from '@ripl/utilities';

/** Base event map interface; all custom event maps should extend this. */
export type EventMap = {
    [key: string]: unknown;
    /** Emitted when the event bus is destroyed; carries no payload. */
    destroyed: null;
};

/** Options for emitting an event, controlling bubbling and attached data. */
export type EventOptions<TData = undefined> = {
    /** Whether the event propagates up the parent chain. Defaults to `true`. */
    bubbles?: boolean;
    /** The payload attached to the event. */
    data?: TData;
};

/** Options for subscribing to an event, such as filtering to self-targeted events only. */
export type EventSubscriptionOptions = {
    /** When `true`, the handler only fires for events originally emitted on this bus, ignoring bubbled events. */
    self?: boolean;
};

/** A callable event handler function with optional subscription options. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandler<TData = any> = {
    (event: Event<TData>): void;
} & EventSubscriptionOptions;

/** An event object carrying type, data, target reference, and propagation control. */
export class Event<TData = undefined> {

    private _bubbles = true;

    /** The event type name. */
    public readonly type: string;
    /** The payload carried by this event. */
    public readonly data: TData;
    /** The high-resolution timestamp at which the event was created. */
    public readonly timestamp: number;
    /** The {@link EventBus} on which the event was originally emitted. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public readonly target: EventBus<any>;

    /** Whether this event will continue to bubble up the parent chain. */
    public get bubbles() {
        return this._bubbles;
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
        this.timestamp = factory.now();
        this._bubbles = bubbles;
    }

    /** Prevents this event from bubbling further up the parent chain. */
    public stopPropagation() {
        this._bubbles = false;
    }

}

/** A typed pub/sub event system with parent-chain bubbling, disposable subscriptions, and self-filtering. */
export class EventBus<TEventMap extends EventMap = EventMap> extends Disposer {

    /** The parent event bus that emitted events bubble up to, if any. */
    public parent?: EventBus<TEventMap>;

    private _listeners = new Map<keyof TEventMap, Set<EventHandler>>();

    /**
     * The event types this bus can emit. The base returns an empty list; subclasses override it
     * to declare their emittable events (type-checked against their {@link EventMap}), so tooling
     * such as the devtools can enumerate them, including events added by custom subclasses.
     */
    public get $events(): (keyof TEventMap)[] {
        return [];
    }

    /** Returns whether there are any listeners registered for the given event type. */
    public has(type: keyof TEventMap) {
        return !!this._listeners.get(type)?.size;
    }

    /** Subscribes a handler to the given event type and returns a disposable for cleanup. */
    public on<TEvent extends keyof TEventMap>(type: TEvent, handler: EventHandler<TEventMap[TEvent]>, options?: EventSubscriptionOptions): Disposable {
        const handlers = this._listeners.get(type) || new Set();

        Object.assign(handler, options);
        handlers.add(handler);
        this._listeners.set(type, handlers);

        return {
            dispose: () => this.off(type, handler),
        };
    }

    /** Removes a previously registered handler for the given event type. */
    public off<TEvent extends keyof TEventMap>(type: TEvent, handler: EventHandler<TEventMap[TEvent]>): void {
        const handlers = this._listeners.get(type);

        if (!handlers) {
            return;
        }

        handlers.delete(handler);

        if (!handlers.size) {
            this._listeners.delete(type);
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

        const handlers = this._listeners.get(event.type);

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
        this._listeners.clear();
        this.dispose();
    }

}
