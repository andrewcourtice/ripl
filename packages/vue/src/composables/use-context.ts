import {
    inject,
    provide,
    ref,
} from 'vue';

import {
    CONTEXT_KEY,
} from '../constants';

import type {
    Ref,
} from 'vue';

import type {
    Context,
} from '@ripl/core';

export function provideContext(context: Ref<Context | undefined>) {
    provide(CONTEXT_KEY, context);
}

export function useContext(): Ref<Context | undefined> {
    return inject(CONTEXT_KEY, ref(undefined));
}
