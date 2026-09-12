import {
    createEventForwarder,
    getBoundListeners,
} from '@ripl/adapters';

import type {
    EventBus,
    EventMap,
} from '@ripl/web';

import {
    getCurrentInstance,
    onMounted,
    onUnmounted,
    onUpdated,
} from 'vue';

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
    const forwarder = createEventForwarder(source);

    const sync = () => forwarder.sync(
        getBoundListeners(instance?.vnode.props),
        (name, data, event) => emit(name as never, data, event)
    );

    onMounted(sync);
    onUpdated(sync);
    onUnmounted(() => forwarder.release());
}
