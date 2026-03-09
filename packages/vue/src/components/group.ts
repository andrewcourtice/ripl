import {
    defineComponent,
    onBeforeUnmount,
    onMounted,
    shallowRef,
} from 'vue';

import {
    provideParent,
    useParent,
} from '../composables/use-parent';

import {
    createGroup,
} from '@ripl/core';

import type {
    Group,
} from '@ripl/core';

import {
    BASE_ELEMENT_PROPS,
} from '../utilities/prop-mapping';

export const RiplGroup = defineComponent({
    name: 'RiplGroup',

    props: {
        ...BASE_ELEMENT_PROPS,
    },

    setup(props, { slots }) {
        const parent = useParent();
        const group = shallowRef<Group>();

        provideParent(group);

        onMounted(() => {
            const options: Record<string, unknown> = {};

            for (const [key, value] of Object.entries(props)) {
                if (value !== undefined) {
                    options[key] = value;
                }
            }

            const gr = createGroup(options);

            group.value = gr;

            if (parent.value) {
                parent.value.add(gr);
            }
        });

        onBeforeUnmount(() => {
            const gr = group.value;

            if (gr) {
                if (parent.value) {
                    parent.value.remove(gr);
                }

                gr.destroy();
            }
        });

        return () => slots.default?.();
    },
});
