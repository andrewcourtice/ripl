import type {
    Disposable,
} from '@ripl/utilities';

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

/** Every event an element or group forwards to its Vue listeners. */
export const ELEMENT_EVENTS = [
    'click',
    'destroyed',
    'drag',
    'dragend',
    'dragstart',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseup',
    'updated',
] as const;

/** Every event the context component forwards to its Vue listeners. */
export const CONTEXT_EVENTS = [
    'click',
    'destroyed',
    'drag',
    'dragend',
    'dragstart',
    'mousedown',
    'mouseenter',
    'mouseleave',
    'mousemove',
    'mouseup',
    'render',
    'resize',
] as const;

/** Every event the renderer component forwards to its Vue listeners. */
export const RENDERER_EVENTS = [
    'destroyed',
    'start',
    'stop',
    'tick',
] as const;

/** Collects the lower-cased names of every listener prop currently bound to a component. */
function getBoundListeners(props: Record<string, unknown> | null | undefined): Set<string> {
    if (!props) {
        return new Set();
    }

    return new Set(Object.keys(props)
        .filter(key => key.startsWith('on') && props[key] !== null && props[key] !== undefined)
        .map(key => key.toLowerCase()));
}

/**
 * Forwards an event bus's events to Vue listeners, subscribing only to those a listener is
 * actually bound to.
 *
 * The filtering is not an optimisation. `Element.on` invalidates the context's tracked-element
 * cache for pointer events, so subscribing to everything up front would silently make every
 * element a hit-test target and change which element receives a click.
 *
 * @param source - The bus to forward from, e.g. an element, context or renderer.
 * @param names - The event names eligible for forwarding.
 * @param emit - The component's emit function.
 */
export function useForwardedEvents<TEventMap extends EventMap>(
    source: () => EventBus<TEventMap> | undefined,
    names: readonly string[],
    emit: (event: string, ...args: unknown[]) => void
): void {
    const instance = getCurrentInstance();
    const listeners = new Map<string, Disposable>();

    const release = (name: string) => {
        listeners.get(name)?.dispose();
        listeners.delete(name);
    };

    const sync = () => {
        const bus = source();
        const bound = getBoundListeners(instance?.vnode.props);

        names.forEach(name => {
            const isBound = !!bus && bound.has(`on${name}`);

            if (isBound === listeners.has(name)) {
                return;
            }

            if (!isBound) {
                release(name);
                return;
            }

            listeners.set(name, bus.on(name as keyof TEventMap, (event: Event<unknown>) => {
                emit(name, event.data, event);
            }));
        });
    };

    onMounted(sync);
    onUpdated(sync);

    onUnmounted(() => {
        listeners.forEach(listener => listener.dispose());
        listeners.clear();
    });
}
