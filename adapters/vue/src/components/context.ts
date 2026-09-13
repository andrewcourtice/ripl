import {
    useForwardedEvents,
} from '../core/events';

import {
    useExposedInstance,
} from '../core/expose';

import {
    RIPL_CONTEXT,
    RIPL_PARENT,
    RIPL_RENDERER,
    RIPL_SCENE,
    RIPL_TREE,
} from '../core/injection';

import {
    ANY_PROP,
    BOOLEAN_PROP,
    NUMBER_PROP,
} from '../core/props';

import {
    createRiplTree,
} from '../core/tree';

import type {
    RiplComponent,
} from '../types';

import {
    CONTEXT_EVENTS,
} from '@ripl/adapters';

import type {
    RiplContextProps,
} from '@ripl/adapters';

import type {
    Disposable,
} from '@ripl/utilities';

import {
    hasWindow,
} from '@ripl/dom';

import {
    createContext,
} from '@ripl/web';

import type {
    Context,
    Renderer,
    Scene,
} from '@ripl/web';

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
 * Creates a Ripl rendering context and provides it to its subtree, mounting the canvas into its own
 * root element.
 *
 * The context is built during `setup()` against a detached host, which Vue attaches on mount. That
 * ordering is deliberate: `setup()` runs top-down, so every descendant — scene, renderer, elements
 * — finds a live context in its own `setup()` rather than having to wait for a mount hook that Vue
 * would run bottom-up, after theirs.
 *
 * Elements declared without a scene between them and this component are painted directly, so the
 * simplest useful tree is a context and a shape.
 *
 * @example
 * <ripl-context>
 *     <ripl-circle :cx="50" :cy="50" :radius="20" fill="#f00"/>
 * </ripl-context>
 */
export const RiplContext = defineComponent({
    name: 'RiplContext',
    props: {
        context: ANY_PROP,
        interactive: BOOLEAN_PROP,
        dragThreshold: NUMBER_PROP,
        meta: ANY_PROP,
    },
    emits: [
        ...CONTEXT_EVENTS,
        'ready',
    ],
    setup(props, { slots, emit }) {
        const tree = createRiplTree();
        const context = shallowRef<Context>();
        const root = shallowRef<HTMLElement>();
        const graph = shallowRef<HTMLElement>();

        let host: HTMLElement | undefined;
        let owned = false;
        let resize: Disposable | undefined;

        if (props.context) {
            context.value = markRaw(props.context as Context);
        } else if (hasWindow) {
            host = document.createElement('div');
            Object.assign(host.style, HOST_STYLE);

            context.value = markRaw(createContext(host, {
                interactive: props.interactive,
                dragThreshold: props.dragThreshold,
                meta: props.meta,
            }));

            owned = true;
        }

        tree.context = context.value;

        provide(RIPL_TREE, tree);
        provide(RIPL_CONTEXT, context);
        provide(RIPL_PARENT, shallowRef(tree.rootGroup));

        // Shadows an enclosing context's scene and renderer, which a nested context must not inherit.
        provide(RIPL_SCENE, shallowRef<Scene>());
        provide(RIPL_RENDERER, shallowRef<Renderer>());

        if (context.value) {
            useExposedInstance(context.value);
        }

        useForwardedEvents(() => context.value, emit);

        onMounted(() => {
            const active = context.value;

            if (host && root.value) {
                root.value.appendChild(host);
            }

            if (graph.value) {
                tree.attach(graph.value);
            }

            if (!active) {
                return;
            }

            // The surface has no size until the host lands in the document, so the first real
            // paint comes from the resize the attachment triggers, not from this frame.
            resize = active.on('resize', () => tree.requestPaint());
            tree.requestPaint();

            emit('ready', active);
        });

        onBeforeUnmount(() => tree.dispose());

        onUnmounted(() => {
            resize?.dispose();
            tree.destroy();

            if (owned) {
                context.value?.destroy();
            }

            context.value = undefined;
            tree.context = undefined;
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
}) as unknown as RiplComponent<RiplContextProps, Context>;
