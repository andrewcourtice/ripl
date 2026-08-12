import {
    ELEMENT_EVENTS,
    useForwardedEvents,
} from '../core/events';

import {
    RIPL_CONTEXT,
    RIPL_ELEMENT,
    RIPL_PARENT,
    RIPL_SCENE,
    RIPL_TREE,
} from '../core/injection';

import {
    BASE_STATE_KEYS,
    createProps,
    ELEMENT_OPTION_KEYS,
} from '../core/props';

import {
    applyFields,
    applyState,
    diffProps,
    partitionProps,
    readBoundProps,
    resolveClassNames,
} from '../core/state';

import type {
    RiplWritable,
} from '../core/state';

import type {
    RiplComponent,
    RiplElementListeners,
    RiplElementOptionProps,
} from '../types';

import {
    factory,
} from '@ripl/web';

import type {
    BaseElementState,
    Scene,
} from '@ripl/web';

import {
    createScene,
} from '@ripl/web';

import {
    defineComponent,
    inject,
    markRaw,
    onUnmounted,
    provide,
    shallowRef,
    watch,
} from 'vue';

const PROP_KEYS = [
    'renderOnResize',
    ...ELEMENT_OPTION_KEYS,
    ...BASE_STATE_KEYS,
];

const STATE_KEYS = new Set<string>(BASE_STATE_KEYS);

/** Props accepted by {@link RiplScene}. */
export interface RiplSceneProps extends Partial<BaseElementState>, RiplElementOptionProps, RiplElementListeners {
    /** Whether the scene re-renders automatically when its context is resized. Defaults to `true`. */
    renderOnResize?: boolean;
}

/**
 * Creates a scene bound to the enclosing context and parents its subtree to it.
 *
 * A scene hoists the element tree into a flat instruction stream, so it is what makes z-ordering,
 * group clipping and large graphs efficient. State props set here cascade to every descendant that
 * does not set its own — `<ripl-scene fill="#333">` gives the whole tree a default fill.
 *
 * @example
 * <ripl-context>
 *     <ripl-scene fill="#333">
 *         <ripl-circle :cx="50" :cy="50" :radius="20"/>
 *     </ripl-scene>
 * </ripl-context>
 */
export const RiplScene = defineComponent({
    name: 'RiplScene',
    props: createProps(PROP_KEYS),
    emits: [...ELEMENT_EVENTS],
    inheritAttrs: false,
    setup(props, { slots, emit }) {
        const tree = inject(RIPL_TREE, undefined);
        const context = inject(RIPL_CONTEXT, undefined);
        const raw = props as RiplWritable;
        const initial = readBoundProps(raw, PROP_KEYS);

        if (initial.class !== undefined) {
            initial.class = resolveClassNames(initial.class);
        }

        const scene = context?.value
            ? markRaw(createScene(context.value, initial))
            : undefined;

        if (tree && scene) {
            tree.scene.value = scene;
        }

        provide(RIPL_SCENE, tree?.scene ?? shallowRef<Scene>());
        provide(RIPL_PARENT, shallowRef(scene));
        provide(RIPL_ELEMENT, shallowRef(scene));

        // The scene seeds its font from the host's computed style, which resolves to nothing while
        // the host is still detached, so re-read it once the context component attaches.
        tree?.onAttached(() => {
            if (!scene || initial.font !== undefined || !context?.value) {
                return;
            }

            const font = factory.getComputedStyle?.(context.value.element)?.font;

            if (font) {
                scene.font = font;
            }
        });

        let applied = initial;

        watch(() => readBoundProps(raw, PROP_KEYS), next => {
            const changed = diffProps(applied, next);

            applied = next;

            if (!scene || !Object.keys(changed).length) {
                return;
            }

            const [state, fields] = partitionProps(changed, STATE_KEYS);

            applyFields(scene, fields);
            applyState(scene, state);
            tree?.requestPaint();
        });

        useForwardedEvents(() => scene, ELEMENT_EVENTS, emit as (event: string, ...args: unknown[]) => void);

        onUnmounted(() => {
            if (!scene) {
                return;
            }

            // `false`: the context component owns the context and destroys it itself.
            scene.destroy(false);

            if (tree) {
                tree.scene.value = undefined;
            }
        });

        return () => slots.default?.() ?? null;
    },
}) as unknown as RiplComponent<RiplSceneProps>;
