import {
    defineComponent,
    shallowRef,
} from 'vue';

import type {
    InjectionKey,
    ShallowRef,
} from 'vue';

import type {
    Context,
} from '@ripl/web';

/** Injection key carrying the nearest ancestor {@link Context}. */
export const RIPL_CONTEXT_KEY: InjectionKey<ShallowRef<Context | undefined>> = Symbol('ripl-context');

/** Temporary packaging probe; replaced by the real component surface. */
export const RiplProbe = defineComponent({
    name: 'RiplProbe',
    props: {
        label: {
            type: String,
            default: '',
        },
    },
    setup(props) {
        const context = shallowRef<Context>();

        return () => `${props.label}${context.value ? '!' : ''}`;
    },
});
