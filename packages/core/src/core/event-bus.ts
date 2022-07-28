import {
    Disposable,
} from '@ripl/utilities';

export type EventHandler<TPayload> = (payload: TPayload) => void;

export interface EventMap {
    [key: string]: unknown;
}

export interface EventBus<TEventMap = EventMap> {
    on<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>): Disposable;
    off<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>): void;
    once<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>): Disposable;
    emit<TEvent extends keyof TEventMap>(event: TEvent, payload: TEventMap[TEvent]): void;
    destroy(): void;
}

export interface Event<TData = unknown> {
    data?: TData;
    bubble: boolean;
    stopPropagation(): void;
}

export function createEvent<TData = unknown>(data?: TData): Event<TData> {
    return {
        data,
        bubble: true,
        stopPropagation() {
            this.bubble = false;
        },
    };
}

export function createEventBus<TEventMap = EventMap>(): EventBus<TEventMap> {

    const listeners = new Map<keyof TEventMap, Set<EventHandler<TEventMap[keyof TEventMap]>>>();

    function on<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>): Disposable {
        const handlers = listeners.get(event) || new Set();

        handlers.add(handler);
        listeners.set(event, handlers);

        return {
            dispose: () => off(event, handler),
        };
    }

    function off<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>): void {
        const handlers = listeners.get(event);

        if (!handlers) {
            return;
        }

        handlers.delete(handler);

        if (!handlers.size) {
            listeners.delete(event);
        }
    }

    function once<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>): Disposable {
        const callback = ((...args: Parameters<typeof handler>) => {
            handler(...args);
            off(event, callback);
        });

        return on(event, callback);
    }

    function emit<TEvent extends keyof TEventMap>(event: TEvent, payload: TEventMap[TEvent]): void {
        const handlers = listeners.get(event);

        if (handlers) {
            handlers.forEach(handler => handler(payload));
        }
    }

    function destroy() {
        listeners.clear();
    }

    return {
        on,
        off,
        once,
        emit,
        destroy,
    };
}

export default createEventBus();