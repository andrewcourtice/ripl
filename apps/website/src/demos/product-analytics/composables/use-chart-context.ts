import {
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
} from 'vue';

import type {
    Ref,
} from 'vue';

import {
    createContext,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

export function useChartContext(elRef: Ref<HTMLElement | undefined>) {
    const context = ref<Context>();

    function create() {
        if (context.value) {
            context.value.destroy();
            context.value = undefined;
        }

        if (elRef.value) {
            context.value = createContext(elRef.value);
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
