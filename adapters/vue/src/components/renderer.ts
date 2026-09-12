import {
    RENDERER_EVENTS,
    useForwardedEvents,
} from '../core/events';

import {
    useExposedInstance,
} from '../core/expose';

import {
    RIPL_RENDERER,
    RIPL_SCENE,
    RIPL_TREE,
} from '../core/injection';

import {
    ANY_PROP,
    BOOLEAN_PROP,
} from '../core/props';

import type {
    RiplComponent,
    RiplListener,
} from '../types';

import {
    createRenderer,
} from '@ripl/web';

import type {
    Renderer,
    RendererDebugOptions,
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

/** The payload carried by the renderer's `tick` event. */
export interface RiplTickPayload {
    /** Timestamp of the current frame, in milliseconds. */
    time: number;
    /** Elapsed time since the previous frame, in milliseconds. */
    deltaTime: number;
}

/** Props accepted by {@link RiplRenderer}. */
export interface RiplRendererProps {
    /** Whether the renderer starts its animation loop on creation. Defaults to `true`. */
    autoStart?: boolean;
    /** Whether the loop stops when idle: no active transitions and the pointer has left. Defaults to `true`. */
    autoStop?: boolean;
    /** Whether transitions apply their final state immediately rather than animating. */
    immediate?: boolean;
    /** Debug overlays: `true` for all, or an object toggling individual overlays. */
    debug?: boolean | RendererDebugOptions;
    /** Fired when the animation loop starts. */
    onStart?: RiplListener<{
        /** Timestamp at which the loop started, in milliseconds. */
        startTime: number;
    }>;
    /** Fired when the animation loop stops. */
    onStop?: RiplListener<{
        /** Timestamp at which the loop originally started, in milliseconds. */
        startTime: number;
        /** Timestamp at which the loop stopped, in milliseconds. */
        endTime: number;
    }>;
    /** Fired once per animation frame. */
    onTick?: RiplListener<RiplTickPayload>;
}

/**
 * Drives the enclosing scene with a `requestAnimationFrame` loop, and makes transitions available
 * to its subtree.
 *
 * A renderer is what `<ripl-transition>` needs: enter, update and leave phases are scheduled
 * through it. Without one, elements still paint, they just snap to each new value.
 *
 * @example
 * <ripl-context>
 *     <ripl-scene>
 *         <ripl-renderer :auto-stop="false">
 *             <ripl-circle :cx="x" :cy="50" :radius="20"/>
 *         </ripl-renderer>
 *     </ripl-scene>
 * </ripl-context>
 */
export const RiplRenderer = defineComponent({
    name: 'RiplRenderer',
    props: {
        autoStart: BOOLEAN_PROP,
        autoStop: BOOLEAN_PROP,
        immediate: BOOLEAN_PROP,
        debug: ANY_PROP,
    },
    emits: RENDERER_EVENTS,
    inheritAttrs: false,
    setup(props, { slots, emit }) {
        const tree = inject(RIPL_TREE, undefined);
        const scene = inject(RIPL_SCENE, undefined);

        if (!scene?.value) {
            console.warn('[@ripl/vue] <ripl-renderer> needs a <ripl-scene> ancestor; rendering falls back to the scene or context.');
        }

        const renderer = scene?.value
            ? markRaw(createRenderer(scene.value, {
                autoStart: props.autoStart,
                autoStop: props.autoStop,
                immediate: props.immediate,
                debug: props.debug as boolean | RendererDebugOptions | undefined,
            }))
            : undefined;

        if (tree && renderer) {
            tree.renderer.value = renderer;
        }

        provide(RIPL_RENDERER, tree?.renderer ?? shallowRef<Renderer>());

        watch(() => props.autoStop, value => {
            if (renderer && value !== undefined) {
                renderer.autoStop = value;
            }
        });

        watch(() => props.debug, value => {
            if (renderer && value !== undefined) {
                renderer.debug = value as boolean | RendererDebugOptions;
            }
        });

        if (renderer) {
            useExposedInstance(renderer);
        }

        useForwardedEvents(() => renderer, emit);

        onUnmounted(() => {
            renderer?.destroy();

            if (tree) {
                tree.renderer.value = undefined;
            }
        });

        return () => slots.default?.() ?? null;
    },
}) as unknown as RiplComponent<RiplRendererProps, Renderer>;
