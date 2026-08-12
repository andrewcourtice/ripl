import {
    CONTEXT_EVENTS,
    useForwardedEvents,
} from '../core/events';

import {
    RIPL_CONTEXT,
    RIPL_PARENT,
    RIPL_TREE,
} from '../core/injection';

import {
    createRiplTree,
} from '../core/tree';

import type {
    RiplComponent,
    RiplPointerListeners,
} from '../types';

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

/** Props accepted by {@link RiplContext}. */
export interface RiplContextProps extends RiplPointerListeners {
    /**
     * An existing context to draw into instead of creating one. Use this to render through a
     * backend other than canvas, or to keep a context alive across re-mounts.
     */
    context?: Context;
    /** Whether the context listens for and emits pointer and drag events. Defaults to `true`. */
    interactive?: boolean;
    /** Minimum pointer movement, in pixels, before a drag gesture is recognised. Defaults to `3`. */
    dragThreshold?: number;
    /** Arbitrary metadata attached to the context. */
    meta?: Record<string, unknown>;
    /** Fired once the context exists and its host element is in the document. */
    onReady?: (context: Context) => void;
    /** Fired when the context's surface is resized. */
    onResize?: () => void;
    /** Fired when the context requests a repaint that no element change triggered. */
    onRender?: () => void;
}

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
        context: {
            type: null,
            default: undefined,
        },
        interactive: {
            type: Boolean,
            default: undefined,
        },
        dragThreshold: {
            type: Number,
            default: undefined,
        },
        meta: {
            type: null,
            default: undefined,
        },
    },
    emits: [
        ...CONTEXT_EVENTS,
        'ready',
    ],
    setup(props, { slots, emit }) {
        const tree = createRiplTree();
        const root = shallowRef<HTMLElement>();
        const graph = shallowRef<HTMLElement>();

        let host: HTMLElement | undefined;
        let owned = false;
        let resize: Disposable | undefined;

        if (props.context) {
            tree.context.value = markRaw(props.context as Context);
        } else if (hasWindow) {
            host = document.createElement('div');
            Object.assign(host.style, HOST_STYLE);

            tree.context.value = markRaw(createContext(host, {
                interactive: props.interactive,
                dragThreshold: props.dragThreshold,
                meta: props.meta,
            }));

            owned = true;
        }

        provide(RIPL_TREE, tree);
        provide(RIPL_CONTEXT, tree.context);
        provide(RIPL_PARENT, shallowRef(tree.rootGroup));

        useForwardedEvents(() => tree.context.value, CONTEXT_EVENTS, emit as (event: string, ...args: unknown[]) => void);

        onMounted(() => {
            const context = tree.context.value;

            if (host && root.value) {
                root.value.appendChild(host);
            }

            if (graph.value) {
                tree.attach(graph.value);
            }

            if (!context) {
                return;
            }

            // The surface has no size until the host lands in the document, so the first real
            // paint comes from the resize the attachment triggers, not from this frame.
            resize = context.on('resize', () => tree.requestPaint());
            tree.requestPaint();

            emit('ready', context);
        });

        onBeforeUnmount(() => tree.dispose());

        onUnmounted(() => {
            resize?.dispose();
            tree.destroy();

            if (owned) {
                tree.context.value?.destroy();
            }

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
}) as unknown as RiplComponent<RiplContextProps>;
