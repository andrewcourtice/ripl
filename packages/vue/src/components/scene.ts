import {
    defineComponent,
    onBeforeUnmount,
    ref,
    watch,
} from 'vue';

import {
    useContext,
} from '../composables/use-context';

import {
    provideParent,
} from '../composables/use-parent';

import {
    provideScene,
} from '../composables/use-scene';

import {
    Scene,
} from '@ripl/core';

export const RiplScene = defineComponent({
    name: 'RiplScene',

    props: {
        renderOnResize: {
            type: Boolean,
            default: true,
        },
    },

    setup(props, { slots }) {
        const context = useContext();
        const scene = ref<Scene>();

        provideScene(scene);
        provideParent(scene);

        watch(context, ctx => {
            if (scene.value) {
                scene.value.destroy();
            }

            if (ctx) {
                scene.value = new Scene(ctx, {
                    renderOnResize: props.renderOnResize,
                });
            }
        }, { immediate: true });

        onBeforeUnmount(() => {
            scene.value?.destroy();
            scene.value = undefined;
        });

        return () => slots.default?.();
    },
});
