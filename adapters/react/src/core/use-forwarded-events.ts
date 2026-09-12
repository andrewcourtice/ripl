import {
    createEventForwarder,
    getBoundListeners,
} from '@ripl/adapters';

import type {
    RiplEventForwarder,
} from '@ripl/adapters';

import {
    typeIsFunction,
} from '@ripl/utilities';

import type {
    EventBus,
    EventMap,
} from '@ripl/web';

import {
    useEffect,
    useLayoutEffect,
    useRef,
} from 'react';

/**
 * Forwards a Ripl object's events to the listener props bound on a component, subscribing only to
 * those a listener is actually bound to.
 *
 * The filtering is not an optimisation. `Element.on` invalidates the context's tracked-element
 * cache for pointer events, so subscribing to everything up front would silently make every element
 * a hit-test target and change which element receives a click.
 *
 * Handlers are dispatched through a ref and the subscription is keyed on the *set* of bound names,
 * so passing an inline arrow — which React callers do constantly — never tears a subscription down
 * and rebuilds it.
 *
 * @typeParam TEventMap - The bus's event map.
 * @param source - The object to forward from, e.g. an element, context, renderer or chart.
 * @param props - The component's props, scanned for `onEventName` listeners.
 */
export function useForwardedEvents<TEventMap extends EventMap>(source: EventBus<TEventMap> | undefined, props: object): void {
    const listeners = props as Record<string, unknown>;
    const bound = getBoundListeners(listeners);
    const sourceRef = useRef(source);
    const propsRef = useRef(listeners);
    const boundRef = useRef(bound);
    const forwarderRef = useRef<RiplEventForwarder>(undefined);

    sourceRef.current = source;
    propsRef.current = listeners;
    boundRef.current = bound;
    forwarderRef.current ??= createEventForwarder<TEventMap>(() => sourceRef.current);

    const forwarder = forwarderRef.current;
    const signature = Array.from(bound.keys()).sort().join('|');

    useLayoutEffect(() => {
        forwarder.sync(boundRef.current, (name, data, event) => {
            const key = boundRef.current.get(name);
            const handler = key ? propsRef.current[key] : undefined;

            if (typeIsFunction(handler)) {
                handler(data, event);
            }
        });
    }, [forwarder, signature, source]);

    useEffect(() => () => forwarder.release(), [forwarder]);
}
