import {
    computed,
    defineComponent,
    provide,
} from 'vue';

import {
    TRANSITION_KEY,
} from '../constants';

import type {
    TransitionContext,
} from '../constants';

export const RiplTransition = defineComponent({
    name: 'RiplTransition',

    props: {
        duration: {
            type: Number,
            default: 300,
        },
        ease: {
            type: String,
            default: 'easeLinear',
        },
        delay: {
            type: Number,
            default: 0,
        },
        loop: {
            type: Boolean,
            default: false,
        },
        direction: {
            type: String,
            default: 'forward',
        },
    },

    setup(props, { slots }) {
        const transitionCtx = computed<TransitionContext>(() => ({
            duration: props.duration,
            ease: props.ease,
            delay: props.delay,
            loop: props.loop,
            direction: props.direction as 'forward' | 'reverse',
        }));

        provide(TRANSITION_KEY, transitionCtx);

        return () => slots.default?.();
    },
});
