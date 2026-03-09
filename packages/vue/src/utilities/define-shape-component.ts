import {
    defineComponent,
    inject,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
} from 'vue';

import {
    TRANSITION_KEY,
} from '../constants';

import {
    useParent,
} from '../composables/use-parent';

import {
    useRenderer,
} from '../composables/use-renderer';

import {
    useScene,
} from '../composables/use-scene';

import {
    resolveEase,
} from './prop-mapping';

import type {
    Component,
    PropType,
} from 'vue';

import type {
    Element,
    Event,
} from '@ripl/core';

import {
    transition,
} from '@ripl/core';

import type {
    TransitionContext,
} from '../constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapeFactory = (options: Record<string, unknown>) => any;

export interface ShapePropDefinition {
    type: PropType<unknown> | null;
    default: unknown;
}

function collectProps(props: Record<string, unknown>, propKeys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const key of propKeys) {
        if (props[key] !== undefined) {
            result[key] = props[key];
        }
    }

    return result;
}

export function defineShapeComponent(
    name: string,
    factory: ShapeFactory,
    shapePropDefs: Record<string, ShapePropDefinition>,
    allPropKeys: string[]
): Component {
    return defineComponent({
        name,
        inheritAttrs: false,

        props: shapePropDefs as Record<string, {
            type: PropType<unknown> | null;
            default: unknown;
        }>,

        emits: [
            'mouseenter',
            'mouseleave',
            'mousemove',
            'click',
        ],

        setup(props, { emit, attrs }) {
            const parent = useParent();
            const renderer = useRenderer();
            const scene = useScene();
            const transitionCtx = inject(TRANSITION_KEY, ref(undefined));
            const element = shallowRef<Element>();

            const listeners = Object.keys(attrs).filter(key => key.startsWith('on'));

            onMounted(() => {
                const initialProps = collectProps(props as unknown as Record<string, unknown>, allPropKeys);
                const el = factory(initialProps);

                element.value = el;

                listeners.forEach(name => el.on(name, (ev: Event) => emit(name, ev.data)));

                if (parent.value) {
                    parent.value.add(el);
                }
            });

            watch(() => {
                const result: Record<string, unknown> = {};

                for (const key of allPropKeys) {
                    result[key] = (props as unknown as Record<string, unknown>)[key];
                }

                return result;
            }, newProps => {
                const el = element.value;

                if (!el) {
                    return;
                }

                const tc = transitionCtx.value;

                if (tc) {
                    applyTransition(el, newProps, tc, renderer.value, scene.value);
                } else {
                    applyDirect(el, newProps);
                }
            }, {
                deep: true,
            });

            onBeforeUnmount(() => {
                const el = element.value;

                if (el) {
                    if (parent.value) {
                        parent.value.remove(el);
                    }

                    el.destroy();
                }
            });

            return {
                element,
            };
        },

        render() {
            return this.$slots.default?.() ?? [];
        },
    });
}

function applyDirect(element: Element, newProps: Record<string, unknown>) {
    for (const [key, value] of Object.entries(newProps)) {
        if (value !== undefined) {
            (element as unknown as Record<string, unknown>)[key] = value;
        }
    }
}

function applyTransition(
    element: Element,
    newProps: Record<string, unknown>,
    tc: TransitionContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderer?: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scene?: any
) {
    const state: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(newProps)) {
        if (value !== undefined) {
            state[key] = value;
        }
    }

    const ease = resolveEase(tc.ease);

    if (renderer) {
        renderer.transition(element, {
            duration: tc.duration,
            ease,
            delay: tc.delay,
            loop: tc.loop,
            direction: tc.direction,
            state,
        });
    } else {
        const interpolator = element.interpolate(state);

        transition(time => {
            interpolator(time);

            if (scene) {
                scene.render();
            }
        }, {
            duration: tc.duration,
            ease,
            delay: tc.delay,
            loop: tc.loop,
            direction: tc.direction,
        });
    }
}
