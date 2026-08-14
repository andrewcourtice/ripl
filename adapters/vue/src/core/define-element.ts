import {
    ELEMENT_EVENTS,
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
    BASE_STATE_KEYS,
    createProps,
    ELEMENT_OPTION_KEYS,
    SHAPE_FIELD_KEYS,
} from './props';

import type {
    RiplFieldWriters,
    RiplWritable,
} from './state';

import {
    useElementProps,
} from './use-element-props';

import {
    useElementTransition,
} from './use-element-transition';

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
 * Describes one element to wrap as a component.
 *
 * `create` is deliberately untyped on both sides. Vue props arrive as a loose bag, and several
 * element states narrow a base property — `EllipseState.rotation` is `number` where the base allows
 * a CSS angle string — which makes those classes invariant with the base `Element`. Typing is
 * restored where it is useful to consumers: on the component's props.
 */
export interface RiplNodeDefinition {
    /** The component's name, e.g. `RiplCircle`. */
    name: string;
    /** The element's own state property names, on top of the shared base state. */
    stateKeys: readonly string[];
    /** The inheritable state every element of this kind carries. Defaults to the 2D base state. */
    baseStateKeys?: readonly string[];
    /** Extra prop names written as plain fields rather than animatable state. */
    fieldKeys?: readonly string[];
    /** Prop names read only at construction. Defaults to the shared element set. */
    constructionOnlyKeys?: ReadonlySet<string>;
    /** Plain fields that change how the element paints. Defaults to the shape fields. */
    paintedKeys?: ReadonlySet<string>;
    /** Write overrides for fields the element exposes through a method rather than a setter. */
    fieldWriters?: RiplFieldWriters;
    /** Whether the node owns children: a group renders its slot and parents its descendants. */
    container?: boolean;
    /** Constructs the underlying element from the props bound on the component. */
    create(options: RiplWritable): Element;
}

/**
 * The tag used for a node's marker in the hidden DOM mirror. Hyphenated so browsers treat it as an
 * undefined custom element (a plain `HTMLElement`) rather than `HTMLUnknownElement`.
 */
const MARKER_TAG = 'ripl-node';

/**
 * Adapts a typed element factory to {@link RiplNodeDefinition}'s untyped `create` hook.
 *
 * @typeParam TOptions - The factory's own options type.
 * @param create - The element's factory function.
 * @returns A `create` hook that constructs the element from a loose prop bag.
 */
export function elementFactory<TOptions>(create: (options: TOptions) => unknown) {
    return (options: RiplWritable) => create(options as TOptions) as Element;
}

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
    const baseStateKeys = definition.baseStateKeys ?? BASE_STATE_KEYS;

    const propKeys = [
        ...ELEMENT_OPTION_KEYS,
        ...SHAPE_FIELD_KEYS,
        ...definition.fieldKeys ?? [],
        ...baseStateKeys,
        ...definition.stateKeys,
    ];

    const stateKeys = new Set<string>([
        ...baseStateKeys,
        ...definition.stateKeys,
    ]);

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
                constructionOnlyKeys: definition.constructionOnlyKeys,
                paintedKeys: definition.paintedKeys,
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
