import {
    RIPL_RENDERER,
    RIPL_TRANSITION,
} from '../core/injection';

import {
    ANY_PROP,
    BOOLEAN_PROP,
} from '../core/props';

import {
    RiplTransitionScope,
} from '../core/transition';

import type {
    RiplTransitionPhase,
    RiplTransitionPhases,
} from '../core/transition';

import type {
    RiplComponent,
} from '../types';

import {
    computed,
    defineComponent,
    inject,
    markRaw,
    provide,
} from 'vue';

/** Props accepted by {@link RiplTransition}. */
export interface RiplTransitionProps {
    /**
     * The state descendants animate *from* when they enter, with the options to animate by. The
     * target is read off the element before the enter state is applied, so a property the template
     * never bound still animates back to its inherited or default value.
     */
    enter?: RiplTransitionPhase;
    /**
     * The options used when a descendant's props change. Its own `state`, if given, is merged over
     * the changed props to form the target.
     */
    update?: RiplTransitionPhase;
    /**
     * The state descendants animate *to* when they leave, with the options to animate by. The
     * element is destroyed once the transition finishes.
     */
    leave?: RiplTransitionPhase;
    /** Whether descendants present on the initial mount run their enter phase. Defaults to `true`. */
    appear?: boolean;
}

/**
 * Animates the descendants it wraps as they enter, update and leave, mirroring Vue's own
 * enter-from / leave-to model.
 *
 * Each phase is either an options object or a factory called per element with its index and the
 * scope's size, which is what makes staggering work. Requires a `<ripl-renderer>` ancestor:
 * transitions are scheduled through the renderer's loop.
 *
 * @example
 * <ripl-transition
 *     :enter="(el, i, n) => ({ duration: 400, delay: (i / n) * 200, state: { opacity: 0, radius: 0 } })"
 *     :update="{ duration: 250 }"
 *     :leave="{ duration: 200, state: { opacity: 0 } }"
 * >
 *     <ripl-circle v-for="item in items" :key="item.id" :cx="item.x" :cy="item.y" :radius="item.r"/>
 * </ripl-transition>
 */
export const RiplTransition = defineComponent({
    name: 'RiplTransition',
    props: {
        enter: ANY_PROP,
        update: ANY_PROP,
        leave: ANY_PROP,
        appear: BOOLEAN_PROP,
    },
    inheritAttrs: false,
    setup(props, { slots }) {
        const renderer = inject(RIPL_RENDERER, undefined);

        if (!renderer?.value) {
            console.warn('[@ripl/vue] <ripl-transition> needs a <ripl-renderer> ancestor; its children will apply their props directly.');
        }

        // Computed, not a plain closure: the scope resolves phases once per element per phase, and
        // a closure would hand back a freshly built object every one of those calls.
        const phases = computed<RiplTransitionPhases>(() => ({
            enter: props.enter as RiplTransitionPhase | undefined,
            update: props.update as RiplTransitionPhase | undefined,
            leave: props.leave as RiplTransitionPhase | undefined,
            appear: props.appear,
        }));

        provide(RIPL_TRANSITION, markRaw(new RiplTransitionScope(() => phases.value)));

        return () => slots.default?.() ?? null;
    },
}) as unknown as RiplComponent<RiplTransitionProps>;
