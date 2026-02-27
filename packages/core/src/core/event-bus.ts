import {
    Disposable,
    setForEach,
} from '@ripl/utilities';

export type EventMap = {
    [key: string]: unknown;
    destroyed: null;
};

export type EventOptions<TData = undefined> = {
    bubbles?: boolean;
    data?: TData;
};

export type EventSubscriptionOptions = {
    self?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandler<TData = any> = {
    (event: Event<TData>): void;
} & EventSubscriptionOptions;

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

    public stopPropagation() {
        this.#bubbles = false;
    }

}

export class EventBus<TEventMap extends EventMap = EventMap> {

    public parent?: EventBus<TEventMap>;

    private listeners = new Map<keyof TEventMap, Set<EventHandler>>();

    public has(type: keyof TEventMap) {
        return !!this.listeners.get(type)?.size;
    }

    public on<TEvent extends keyof TEventMap>(type: TEvent, handler: EventHandler<TEventMap[TEvent]>, options?: EventSubscriptionOptions): Disposable {
        const handlers = this.listeners.get(type) || new Set();

        Object.assign(handler, options);
        handlers.add(handler);
        this.listeners.set(type, handlers);

        return {
            dispose: () => this.off(type, handler),
        };
    }

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

    public once<TEvent extends keyof TEventMap>(type: TEvent, handler: EventHandler<TEventMap[TEvent]>, options?: EventSubscriptionOptions): Disposable {
        const callback = ((...args: Parameters<typeof handler>) => {
            handler(...args);
            this.off(type, callback);
        });

        return this.on(type, callback, options);
    }

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

    public destroy() {
        this.emit('destroyed', null);
        this.listeners.clear();
    }

}
