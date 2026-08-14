import {
    RIPL_CAMERA,
    RIPL_CONTEXT_3D,
} from '../core/injection';

import type {
    RiplContext3DProps,
} from '../types';

import {
    createContext as createContext3D,
} from '@ripl/3d';

import type {
    Camera,
    CanvasContext3D,
    Context3DOptions,
    Light,
} from '@ripl/3d';

import {
    hasWindow,
} from '@ripl/dom';

import {
    ANY_PROP,
    BOOLEAN_PROP,
    CONTEXT_EVENTS,
    createRiplTree,
    NUMBER_PROP,
    RIPL_CONTEXT,
    RIPL_PARENT,
    RIPL_TREE,
    useExposedInstance,
    useForwardedEvents,
} from '@ripl/vue';

import type {
    RiplComponent,
} from '@ripl/vue';

import type {
    Disposable,
} from '@ripl/utilities';

import {
    defineComponent,
    h,
    markRaw,
    onBeforeUnmount,
    onMounted,
    onUnmounted,
    provide,
    shallowRef,
} from 'vue';

/** Fills the component's root, so the canvas inherits whatever size the consumer gives that root. */
const HOST_STYLE = {
    width: '100%',
    height: '100%',
} as const;

/** Keeps the declarative mirror out of layout; it exists only to be read for ordering. */
const GRAPH_STYLE = {
    display: 'none',
} as const;

/**
 * Creates a Ripl 3D rendering context and provides it to its subtree, mounting the canvas into its
 * own root element.
 *
 * A 3D context is an ordinary Ripl context, so `<ripl-scene>`, `<ripl-renderer>` and
 * `<ripl-transition>` from `@ripl/vue` work inside it unchanged — this component replaces
 * `<ripl-context>` and nothing else.
 *
 * Like its 2D counterpart the context is built during `setup()` against a detached host, which Vue
 * attaches on mount, so every descendant finds a live context in its own `setup()`.
 *
 * @example
 * <ripl-context-3d>
 *     <ripl-scene>
 *         <ripl-renderer :auto-stop="false">
 *             <ripl-camera :position="[0, 2, 5]" interactions/>
 *             <ripl-cube :size="1" fill="#4488ff"/>
 *         </ripl-renderer>
 *     </ripl-scene>
 * </ripl-context-3d>
 */
export const RiplContext3D = defineComponent({
    name: 'RiplContext3D',
    props: {
        context: ANY_PROP,
        interactive: BOOLEAN_PROP,
        dragThreshold: NUMBER_PROP,
        meta: ANY_PROP,
        fov: NUMBER_PROP,
        near: NUMBER_PROP,
        far: NUMBER_PROP,
        lightDirection: ANY_PROP,
        lightMode: ANY_PROP,
        lights: ANY_PROP,
        ambientIntensity: NUMBER_PROP,
        fog: ANY_PROP,
    },
    emits: [
        ...CONTEXT_EVENTS,
        'ready',
    ],
    setup(props, { slots, emit }) {
        const tree = createRiplTree();
        const root = shallowRef<HTMLElement>();
        const graph = shallowRef<HTMLElement>();
        const context = shallowRef<CanvasContext3D>();

        let host: HTMLElement | undefined;
        let owned = false;
        let resize: Disposable | undefined;

        if (props.context) {
            context.value = markRaw(props.context as CanvasContext3D);
        } else if (hasWindow) {
            host = document.createElement('div');
            Object.assign(host.style, HOST_STYLE);

            context.value = markRaw(createContext3D(host, {
                interactive: props.interactive,
                dragThreshold: props.dragThreshold,
                meta: props.meta,
                fov: props.fov,
                near: props.near,
                far: props.far,
                lightDirection: props.lightDirection,
                lightMode: props.lightMode,
                lights: props.lights as Light[] | undefined,
                ambientIntensity: props.ambientIntensity,
                fog: props.fog,
            } as Context3DOptions));

            owned = true;
        }

        // A declared light must not stack on the default ambient-plus-directional rig, and binding
        // `lights` is the only signal that the consumer intends to own the lighting.
        if (props.lights && context.value) {
            context.value.lights.clear();
            context.value.lights.add(...props.lights as Light[]);
        }

        tree.context.value = context.value;

        provide(RIPL_TREE, tree);
        provide(RIPL_CONTEXT, tree.context);
        provide(RIPL_CONTEXT_3D, context);

        // A camera belongs to the context, not to a subtree, so the slot it is declared in must not
        // decide who can reach it; the context holds the ref and the camera component fills it in.
        provide(RIPL_CAMERA, shallowRef<Camera>());
        provide(RIPL_PARENT, shallowRef(tree.rootGroup));

        if (context.value) {
            useExposedInstance(context.value);
        }

        useForwardedEvents(() => context.value, emit);

        onMounted(() => {
            const value = context.value;

            if (host && root.value) {
                root.value.appendChild(host);
            }

            if (graph.value) {
                tree.attach(graph.value);
            }

            if (!value) {
                return;
            }

            // The surface has no size until the host lands in the document, so the first real
            // paint comes from the resize the attachment triggers, not from this frame.
            resize = value.on('resize', () => tree.requestPaint());
            tree.requestPaint();

            emit('ready', value);
        });

        onBeforeUnmount(() => tree.dispose());

        onUnmounted(() => {
            resize?.dispose();
            tree.destroy();

            if (owned) {
                context.value?.destroy();
            }

            context.value = undefined;
            tree.context.value = undefined;
        });

        return () => h('div', {
            ref: root,
        }, [
            h('div', {
                ref: graph,
                style: GRAPH_STYLE,
            }, slots.default?.()),
        ]);
    },
}) as unknown as RiplComponent<RiplContext3DProps, CanvasContext3D>;
