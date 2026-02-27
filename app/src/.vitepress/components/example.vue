<template>
    <div class="ripl-example">
        <div class="ripl-example__header">
            <RiplButtonGroup>
                <RiplButton :active="type === 'canvas'" @click="type = 'canvas'">Canvas</RiplButton>
                <RiplButton :active="type === 'svg'" @click="type = 'svg'">SVG</RiplButton>
            </RiplButtonGroup>
            <slot name="header"></slot>
        </div>
        <div class="ripl-example__root" self="size-x1" ref="root" :key="type"></div>
        <div class="ripl-example__footer" v-if="$slots.footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
    shallowRef,
    watchEffect
} from 'vue';

import RiplButton from './RiplButton.vue';
import RiplButtonGroup from './RiplButtonGroup.vue';

import {
    Context,
    createContext as createCanvasContext
} from '@ripl/core';

import {
    createContext as createSVGContext
} from '@ripl/svg';

type ContextType = 'canvas' | 'svg';

const CONTEXT_MAP = {
    canvas: createCanvasContext,
    svg: createSVGContext
} as Record<ContextType, typeof createCanvasContext | typeof createSVGContext>

const emit = defineEmits<{
    'ready': [context: Context]
    'context-changed': [context: Context]
}>()

const type = ref<ContextType>('canvas');
const context = shallowRef<Context>();
const root = ref<HTMLElement>();

watchEffect(() => {
    const contextInitialiser = CONTEXT_MAP[type.value];

    context.value?.destroy();

    if (root.value) {
        context.value = contextInitialiser(root.value, {
            buffer: false
        });

        emit('context-changed', context.value);
    }
});
</script>

<style lang="scss">

    .ripl-example {
        margin: 1rem 0;
        border: 1px solid var(--vp-c-divider);
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .ripl-example__header,
    .ripl-example__footer {
        padding: 1rem;
        //background-color: var(--vp-sidebar-bg-color);
    }
    
    .ripl-example__header {
        border-bottom: 1px solid var(--vp-c-divider);
    }

    .ripl-example__footer {
        border-top: 1px solid var(--vp-c-divider);
    }

    .ripl-example__root {
        aspect-ratio: 16 / 9;
    }

    .plugin-tabs--content > .ripl-example {
        margin: 0;
        border: none;
        background-color: var(--vp-c-bg);
    }

</style>