import {
    useForwardedEvents,
} from './events';

import {
    useExposedInstance,
} from './expose';

import {
    RIPL_ELEMENT,
    RIPL_PARENT,
    RIPL_TRANSITION,
    RIPL_TREE,
} from './injection';

import {
    createProps,
    ELEMENT_OPTION_KEYS,
} from './props';

import {
    useElementProps,
} from './use-element-props';

import {
    useElementTransition,
} from './use-element-transition';

import {
    ELEMENT_EVENTS,
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
    defineComponent,
    h,
    inject,
    markRaw,
    onMounted,
    onUnmounted,
    provide,
    shallowRef,
} from 'vue';

/**
 * Builds a declarative component for a Ripl element.
 *
 * The element is constructed and attached during `setup()`, which Vue runs top-down and in template
 * order, so paint order matches the template without any extra bookkeeping. The component renders a
 * single marker node into the context's hidden mirror, which is what lets a later reorder be
 * detected and replayed onto the group.
 *
 * @param definition - How to construct the element and which props it accepts.
 * @returns A component to register globally or import directly.
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
        constructionOnlyKeys,
        paintedKeys,
    } = resolveNodeDefinition(definition, ELEMENT_OPTION_KEYS);

    return defineComponent({
        name: definition.name,
        props: createProps(propKeys),
        emits: ELEMENT_EVENTS,
        inheritAttrs: false,
        setup(props, { slots, emit }) {
            const tree = inject(RIPL_TREE, undefined);
            const parent = inject(RIPL_PARENT, undefined);
            const scope = inject(RIPL_TRANSITION, undefined);
            const marker = shallowRef<HTMLElement>();
            const transition = useElementTransition(definition.fieldWriters);

            const element = useElementProps(props as RiplWritable, {
                keys: propKeys,
                stateKeys,
                constructionOnlyKeys,
                paintedKeys,
                create: initial => markRaw(definition.create(initial)),
                apply: transition.update,
            }) as Element;

            parent?.value?.add(element);
            scope?.register(element);

            provide(RIPL_ELEMENT, shallowRef<Element>(element));

            if (definition.container) {
                provide(RIPL_PARENT, shallowRef(element as unknown as Group));
            }

            useExposedInstance(element);
            useForwardedEvents(() => element, emit);

            // Registered before the leave hook below, because Vue runs unmount hooks in
            // registration order and a reorder must not see a marker whose element is leaving.
            onUnmounted(() => {
                if (marker.value && tree) {
                    tree.releaseMarker(marker.value);
                    tree.releaseContainer(marker.value);
                }
            });

            onMounted(() => {
                if (marker.value && tree) {
                    tree.registerMarker(marker.value, element);

                    if (definition.container) {
                        tree.registerContainer(marker.value, () => element as unknown as Group);
                    }
                }

                // Deferred to mount so the transition scope has every sibling registered, which is
                // what makes a staggered `delay: index / length` span the whole set.
                transition.enter(element);
            });

            onUnmounted(() => transition.leave(element));

            return () => h(MARKER_TAG, {
                ref: marker,
            }, definition.container ? slots.default?.() : undefined);
        },
    });
}
