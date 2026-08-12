import {
    ELEMENT_EVENTS,
    useForwardedEvents,
} from './events';

import {
    RIPL_ELEMENT,
    RIPL_PARENT,
    RIPL_RENDERER,
    RIPL_TRANSITION,
    RIPL_TREE,
} from './injection';

import {
    BASE_STATE_KEYS,
    createProps,
    ELEMENT_OPTION_KEYS,
    SHAPE_FIELD_KEYS,
} from './props';

import {
    applyFields,
    applyState,
    diffProps,
    partitionProps,
    readBoundProps,
    resolveClassNames,
} from './state';

import type {
    RiplWritable,
} from './state';

import type {
    RiplTransitionPhaseOptions,
} from './transition';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    factory,
} from '@ripl/web';

import type {
    BaseState,
    Element,
    Group,
    Renderer,
    RendererTransitionOptions,
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
    watch,
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

const SHAPE_FIELDS = new Set<string>(SHAPE_FIELD_KEYS);

/**
 * Captures the state an entering element should animate *towards*, read before its enter state is
 * applied. Resolving the target from the element is what lets `enter` reference a property the
 * template never bound: fading in from `{ opacity: 0 }` recovers a target of `1` from the
 * element's inherited or default state instead of leaving it stuck at zero.
 */
function resolveEnterTarget(element: Element, state: RiplWritable): RiplWritable {
    let defaults: BaseState | undefined;

    const resolve = (key: string): unknown => {
        const current = element.getComputedValue(key as never);

        if (current !== undefined && current !== null) {
            return current;
        }

        defaults = defaults ?? factory.getDefaultState?.();

        return (defaults as unknown as RiplWritable | undefined)?.[key];
    };

    return Object.fromEntries(Object.keys(state)
        .map((key): [string, unknown] => [
            key,
            resolve(key),
        ])
        .filter(([, value]) => value !== undefined));
}

/** Bridges an untyped state bag onto the renderer's typed transition options. */
function toTransitionOptions(options: RiplTransitionPhaseOptions, state: RiplWritable): RendererTransitionOptions<Element> {
    return {
        ...options,
        state,
    } as RendererTransitionOptions<Element>;
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
 *     create: options => createCircle(options as Shape2DOptions<CircleState>),
 * });
 */
export function defineRiplElement(definition: RiplNodeDefinition) {
    const propKeys = [
        ...ELEMENT_OPTION_KEYS,
        ...SHAPE_FIELD_KEYS,
        ...BASE_STATE_KEYS,
        ...definition.stateKeys,
    ];

    const stateKeys = new Set<string>([
        ...BASE_STATE_KEYS,
        ...definition.stateKeys,
    ]);

    return defineComponent({
        name: definition.name,
        props: createProps(propKeys),
        emits: [...ELEMENT_EVENTS],
        inheritAttrs: false,
        setup(props, { slots, emit }) {
            const tree = inject(RIPL_TREE, undefined);
            const parent = inject(RIPL_PARENT, undefined);
            const renderer = inject(RIPL_RENDERER, undefined);
            const scope = inject(RIPL_TRANSITION, undefined);
            const marker = shallowRef<HTMLElement>();
            const raw = props as RiplWritable;
            const initial = readBoundProps(raw, propKeys);

            if (initial.class !== undefined) {
                initial.class = resolveClassNames(initial.class);
            }

            const element = markRaw(definition.create(initial));

            parent?.value?.add(element);
            scope?.register(element);

            provide(RIPL_ELEMENT, shallowRef<Element>(element));

            if (definition.container) {
                provide(RIPL_PARENT, shallowRef(element as unknown as Group));
            }

            const applyEnter = () => {
                const enter = tree && scope && (tree.mounted || scope.appear)
                    ? scope.resolve('enter', element)
                    : undefined;

                if (!enter?.state || !renderer?.value) {
                    return;
                }

                const state = enter.state as RiplWritable;
                const target = resolveEnterTarget(element, state);

                applyState(element, state);
                void renderer.value.transition(element, toTransitionOptions(enter, target));
            };

            const runLeave = (active: Renderer, group: Group | undefined, options: RiplTransitionPhaseOptions) => {
                if (group) {
                    tree?.retainLeaving(group, element);
                }

                // Retag first, so a key re-entering during the fade cannot collide with this element.
                element.id = `${element.id}:leave:${stringUniqueId()}`;

                void active.transition(element, toTransitionOptions(options, (options.state ?? {}) as RiplWritable))
                    .catch(() => undefined)
                    .then(() => {
                        if (group) {
                            tree?.releaseLeaving(group, element);
                        }

                        element.destroy();
                    });
            };

            const leave = () => {
                if (marker.value && tree) {
                    tree.releaseMarker(marker.value);
                    tree.releaseContainer(marker.value);
                }

                scope?.unregister(element);

                const active = renderer?.value;
                const options = scope?.resolve('leave', element);

                if (!options || !active || !tree || tree.disposing) {
                    element.destroy();
                    tree?.requestPaint();
                    return;
                }

                runLeave(active, element.parent, options);
            };

            const update = (changed: RiplWritable) => {
                const [state, fields] = partitionProps(changed, stateKeys);
                const phase = scope?.resolve('update', element);

                applyFields(element, fields);

                if (phase && renderer?.value && Object.keys(state).length) {
                    void renderer.value.transition(element, toTransitionOptions(phase, {
                        ...state,
                        ...phase.state as RiplWritable,
                    }));
                } else {
                    applyState(element, state);
                }

                if (Object.keys(state).length || Object.keys(fields).some(key => SHAPE_FIELDS.has(key))) {
                    tree?.requestPaint();
                }
            };

            let applied = initial;

            applyEnter();

            watch(() => readBoundProps(raw, propKeys), next => {
                const changed = diffProps(applied, next);

                applied = next;

                if (Object.keys(changed).length) {
                    update(changed);
                }
            });

            useForwardedEvents(() => element, ELEMENT_EVENTS, emit as (event: string, ...args: unknown[]) => void);

            onMounted(() => {
                if (!marker.value || !tree) {
                    return;
                }

                tree.registerMarker(marker.value, element);

                if (definition.container) {
                    tree.registerContainer(marker.value, () => element as unknown as Group);
                }
            });

            onUnmounted(leave);

            return () => h(MARKER_TAG, {
                ref: marker,
            }, definition.container ? slots.default?.() : undefined);
        },
    });
}
