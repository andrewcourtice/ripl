import {
    RIPL_ELEMENT,
    RIPL_PARENT,
    RIPL_TRANSITION,
    RIPL_TREE,
} from './contexts';

import {
    ELEMENT_OPTION_KEYS,
    readElementSnapshot,
} from './props';

import {
    useElementProps,
} from './use-element-props';

import {
    useElementTransition,
} from './use-element-transition';

import {
    useForwardedEvents,
} from './use-forwarded-events';

import {
    useRiplInstance,
} from './use-ripl-instance';

import {
    MARKER_TAG,
    resolveNodeDefinition,
} from '@ripl/adapters';

import type {
    RiplNodeDefinition,
    RiplWritable,
} from '@ripl/adapters';

import type {
    Element,
    Group,
} from '@ripl/web';

import {
    createElement,
    forwardRef,
    useContext,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
} from 'react';

import type {
    ReactNode,
} from 'react';

/**
 * Builds a declarative component for a Ripl element.
 *
 * The element is constructed during render — it owns nothing outside itself, so a copy React
 * discards is inert — and everything with a side effect happens in a layout effect: attaching to the
 * parent group, subscribing to events, joining the transition scope and running the enter phase.
 *
 * Paint order comes from the hidden DOM mirror rather than from effect order. The component renders
 * a single marker node into it, React guarantees the mirror's DOM order matches the declaration
 * order, and the tree replays that order onto the group — which is what makes layout effects
 * running children-first harmless.
 *
 * @param definition - How to construct the element and which props it accepts.
 * @returns A component to import and render.
 * @example
 * const RiplCircle = defineRiplElement({
 *     name: 'RiplCircle',
 *     stateKeys: ELEMENT_STATE_KEYS.circle,
 *     create: elementFactory<Shape2DOptions<CircleState>>(createCircle),
 * });
 */
export function defineRiplElement(definition: RiplNodeDefinition) {
    const {
        propKeys,
        stateKeys,
        syncKeys,
        paintedKeys,
    } = resolveNodeDefinition(definition, ELEMENT_OPTION_KEYS);

    const component = forwardRef<Element, RiplWritable>((props, ref) => {
        const tree = useContext(RIPL_TREE);
        const parent = useContext(RIPL_PARENT);
        const scope = useContext(RIPL_TRANSITION);
        const marker = useRef<HTMLElement>(null);

        const handle = useRiplInstance(() => {
            const snapshot = readElementSnapshot(props, propKeys);

            return {
                element: definition.create(snapshot.options),
                applied: snapshot.applied,
            };
        });

        const {
            element,
            applied,
        } = handle.instance;

        const transition = useElementTransition(element, definition.fieldWriters);

        useImperativeHandle(ref, () => element, [element]);
        useForwardedEvents(element, props);

        useElementProps(element, props, {
            syncKeys,
            stateKeys,
            paintedKeys,
            applied,
            apply: transition.update,
        });

        // Every dependency here is stable while an element stays mounted, so a change means the
        // element itself was replaced and the whole attachment has to be redone.
        useLayoutEffect(() => {
            if (handle.renew()) {
                return undefined;
            }

            const node = marker.current;
            const container = node?.parentElement ?? undefined;

            parent?.add(element);
            scope?.register(element);

            if (node && tree) {
                tree.registerMarker(node, element);

                if (definition.container) {
                    tree.registerContainer(node, () => element as unknown as Group);
                }
            }

            if (container && tree) {
                tree.invalidateContainer(container);
            }

            // Deferred so every sibling committed in the same batch has joined the scope first,
            // which is what makes a staggered `delay: index / length` span the whole set.
            if (tree) {
                tree.queueEnter(() => transition.enter(element));
            } else {
                transition.enter(element);
            }

            return () => {
                handle.release();

                // Released before the leave below, so a reorder replayed from the mirror cannot see
                // a marker whose element is on its way out.
                if (node && tree) {
                    tree.releaseMarker(node);
                    tree.releaseContainer(node);
                }

                if (container && tree) {
                    tree.invalidateContainer(container);
                }

                transition.leave(element);
            };
        }, [element, parent, scope, tree, transition]);

        const marked = createElement(MARKER_TAG, {
            ref: marker,
        }, definition.container ? props.children as ReactNode : undefined);

        // A group parents its descendants; every element, container or not, is the nearest one.
        const scoped = definition.container
            ? createElement(RIPL_PARENT.Provider, {
                value: element as unknown as Group,
            }, marked)
            : marked;

        return createElement(RIPL_ELEMENT.Provider, {
            value: element,
        }, scoped);
    });

    component.displayName = definition.name;

    return component;
}
