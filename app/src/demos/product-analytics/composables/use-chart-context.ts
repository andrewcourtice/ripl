import {
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from 'vue';

import {
    createContext,
} from '@ripl/core';

import type {
    Ref,
} from 'vue';

import type {
    Context,
} from '@ripl/core';

export function useChartContext(elRef: Ref<HTMLElement | undefined>) {
    const context = ref<Context>();

    function create() {
        if (context.value) {
            context.value.destroy();
            context.value = undefined;
        }

        if (elRef.value) {
            context.value = createContext(elRef.value, {
                buffer: false,
            });
        }
    }

    onMounted(() => create());

    watch(elRef, () => create());

    onBeforeUnmount(() => {
        if (context.value) {
            context.value.destroy();
            context.value = undefined;
        }
    });

    return context as Ref<Context | undefined>;
}
