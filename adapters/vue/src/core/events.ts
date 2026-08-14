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

import {
    getCurrentInstance,
    onMounted,
    onUnmounted,
    onUpdated,
} from 'vue';

// `emits` has to be fixed when a component is defined, before any instance exists, and `$events`
// is a pure declaration that never reads `this` — so the prototype is the only source available.
function getDeclaredEvents(prototype: { $events: PropertyKey[] }): string[] {
    return prototype.$events as string[];
}

/** Every event an element or group forwards to its Vue listeners. */
export const ELEMENT_EVENTS = getDeclaredEvents(Element.prototype);

/** Every event the context component forwards to its Vue listeners. */
export const CONTEXT_EVENTS = getDeclaredEvents(Context.prototype);

/** Every event the renderer component forwards to its Vue listeners. */
export const RENDERER_EVENTS = getDeclaredEvents(Renderer.prototype);

/** Collects the lower-cased names of every listener prop currently bound to a component. */
function getBoundListeners(props: Record<string, unknown> | null | undefined): Set<string> {
    const bound = new Set<string>();

    for (const key in props) {
        if (key.startsWith('on') && !typeIsNil(props[key])) {
            bound.add(key.slice(2).toLowerCase());
        }
    }

    return bound;
}

/**
 * Forwards an event bus's events to Vue listeners, subscribing only to those a listener is
 * actually bound to.
 *
 * The eligible names come from the bus itself ({@link EventBus.$events}), so the adapter cannot
 * drift from the events a Ripl object actually emits.
 *
 * The filtering is not an optimisation. `Element.on` invalidates the context's tracked-element
 * cache for pointer events, so subscribing to everything up front would silently make every
 * element a hit-test target and change which element receives a click.
 *
 * @param source - The bus to forward from, e.g. an element, context or renderer.
 * @param emit - The component's emit function.
 */
export function useForwardedEvents<TEventMap extends EventMap>(
    source: () => EventBus<TEventMap> | undefined,
    emit: (event: never, ...args: unknown[]) => void
): void {
    const instance = getCurrentInstance();
    const listeners = new Map<string, Disposable>();

    let active: EventBus<TEventMap> | undefined;
    let names: string[] = [];

    const releaseAll = () => {
        listeners.forEach(listener => listener.dispose());
        listeners.clear();
    };

    const sync = () => {
        const bus = source();

        if (bus !== active) {
            releaseAll();
            active = bus;
            names = bus ? bus.$events as string[] : [];
        }

        if (!bus) {
            return;
        }

        const bound = getBoundListeners(instance?.vnode.props);

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
                emit(name as never, event.data, event);
            }));
        });
    };

    onMounted(sync);
    onUpdated(sync);
    onUnmounted(releaseAll);
}
