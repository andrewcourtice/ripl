import {
    defineComponent,
    onBeforeUnmount,
    shallowRef,
    watch,
} from 'vue';

import {
    provideRenderer,
} from '../composables/use-renderer';

import {
    useScene,
} from '../composables/use-scene';

import {
    Renderer,
} from '@ripl/core';

export const RiplRenderer = defineComponent({
    name: 'RiplRenderer',

    props: {
        autoStart: {
            type: Boolean,
            default: true,
        },
        autoStop: {
            type: Boolean,
            default: true,
        },
    },

    setup(props, { slots }) {
        const scene = useScene();
        const renderer = shallowRef<Renderer>();

        provideRenderer(renderer);

        watch(scene, sc => {
            if (renderer.value) {
                renderer.value.destroy();
            }

            if (sc) {
                renderer.value = new Renderer(sc, {
                    autoStart: props.autoStart,
                    autoStop: props.autoStop,
                });
            }
        }, { immediate: true });

        onBeforeUnmount(() => {
            renderer.value?.destroy();
            renderer.value = undefined;
        });

        return () => slots.default?.();
    },
});
