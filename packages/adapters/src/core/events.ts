import {
    typeIsNil,
} from '@ripl/utilities';

import type {
    Disposable,
} from '@ripl/utilities';

import {
    Context,
    Element,
    Renderer,
} from '@ripl/web';

import type {
    Event,
    EventBus,
    EventMap,
} from '@ripl/web';

/**
 * Receives one forwarded event, already unwrapped into its payload.
 *
 * @param name - The event's name, as the bus declares it.
 * @param data - The event's payload.
 * @param event - The underlying event, carrying `target`, `timestamp` and `stopPropagation`.
 */
export type RiplEventDispatch = (name: string, data: unknown, event: Event<unknown>) => void;

/**
 * The events a component currently has a listener bound to, keyed by the lower-cased event name and
 * valued by the prop the listener arrived on.
 *
 * A map rather than a set because a framework that dispatches through props — rather than through
 * an emit function keyed by event name — needs the prop name back to reach the current handler.
 */
export type RiplBoundListeners = ReadonlyMap<string, string>;

/** Keeps a bus's subscriptions in step with the listeners a component currently has bound. */
export interface RiplEventForwarder {
    /**
     * Subscribes to the events that are bound and unsubscribes from those that no longer are,
     * releasing everything first when the underlying bus has changed.
     *
     * @param bound - The events a listener is currently bound to.
     * @param dispatch - Invoked for each forwarded event.
     */
    sync(bound: RiplBoundListeners, dispatch: RiplEventDispatch): void;
    /** Releases every subscription. */
    release(): void;
}

// `emits` has to be fixed when a component is defined, before any instance exists, and `$events`
// is a pure declaration that never reads `this` — so the prototype is the only source available.
function getDeclaredEvents(prototype: { $events: PropertyKey[] }): string[] {
    return prototype.$events as string[];
}

/** Every event an element or group forwards to its listeners. */
export const ELEMENT_EVENTS = getDeclaredEvents(Element.prototype);

/** Every event a rendering context forwards to its listeners. */
export const CONTEXT_EVENTS = getDeclaredEvents(Context.prototype);

/** Every event a renderer forwards to its listeners. */
export const RENDERER_EVENTS = getDeclaredEvents(Renderer.prototype);

/**
 * Collects every listener prop currently bound to a component, keyed by the event name it forwards.
 *
 * @param props - The props to scan, in either framework's `onEventName` convention.
 * @returns The bound events, lower-cased to match a bus's own, mapped to the prop they came from.
 */
export function getBoundListeners(props: Record<string, unknown> | null | undefined): Map<string, string> {
    const bound = new Map<string, string>();

    for (const key in props) {
        if (key.startsWith('on') && !typeIsNil(props[key])) {
            bound.set(key.slice(2).toLowerCase(), key);
        }
    }

    return bound;
}

/**
 * Forwards an event bus's events to a component's listeners, subscribing only to those a listener
 * is actually bound to.
 *
 * The eligible names come from the bus itself ({@link EventBus.$events}), so an adapter cannot
 * drift from the events a Ripl object actually emits.
 *
 * The filtering is not an optimisation. `Element.on` invalidates the context's tracked-element
 * cache for pointer events, so subscribing to everything up front would silently make every
 * element a hit-test target and change which element receives a click.
 *
 * @typeParam TEventMap - The bus's event map.
 * @param source - Resolves the bus to forward from, e.g. an element, context or renderer.
 * @returns The forwarder, for an adapter to drive from its own lifecycle hooks.
 */
export function createEventForwarder<TEventMap extends EventMap>(source: () => EventBus<TEventMap> | undefined): RiplEventForwarder {
    const listeners = new Map<string, Disposable>();

    let active: EventBus<TEventMap> | undefined;
    let names: string[] = [];

    const release = () => {
        listeners.forEach(listener => listener.dispose());
        listeners.clear();
    };

    const sync = (bound: RiplBoundListeners, dispatch: RiplEventDispatch) => {
        const bus = source();

        if (bus !== active) {
            release();
            active = bus;
            names = bus ? bus.$events as string[] : [];
        }

        if (!bus) {
            return;
        }

        names.forEach(name => {
            const isBound = bound.has(name);

            if (isBound === listeners.has(name)) {
                return;
            }

            if (!isBound) {
                listeners.get(name)?.dispose();
                listeners.delete(name);
                return;
            }

            listeners.set(name, bus.on(name as keyof TEventMap, (event: Event<unknown>) => {
                dispatch(name, event.data, event);
            }));
        });
    };

    return {
        sync,
        release,
    };
}
