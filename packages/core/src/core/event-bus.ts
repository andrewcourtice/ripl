export type EventHandler = (...args: any) => void;

export interface EventListener {
    dispose(): void;
}

export interface EventBus {
    on(event: string, handler: EventHandler): EventListener;
    off(event: string, handler: EventHandler): void;
    once(event: string, handler: EventHandler): EventListener;
    emit(event: string, ...args: any[]): void;
}

export function eventBus(): EventBus {

    const listeners: Record<string, EventHandler[]> = {};

    function on(event: string, handler: EventHandler): EventListener {
        if (!listeners[event]) {
            listeners[event] = [];
        }

        listeners[event].push(handler);

        return {
            dispose: () => off(event, handler),
        };
    }

    function off(event: string, handler: EventHandler): void {
        const handlers = listeners[event];

        if (!handlers) {
            return;
        }

        listeners[event] = handlers.filter(listener => listener !== handler);

        if (listeners[event].length === 0) {
            delete listeners[event];
        }
    }

    function once(event: string, handler: EventHandler): EventListener {
        const callback = (...args: any[]) => {
            handler(...args);
            off(event, callback);
        };

        return on(event, callback);
    }

    function emit(event: string, ...args: any[]): void {
        const handlers = listeners[event];

        if (!handlers) {
            return;
        }

        handlers.forEach(handler => handler(...args));
    }

    return {
        on,
        off,
        once,
        emit,
    };
}

export default eventBus();