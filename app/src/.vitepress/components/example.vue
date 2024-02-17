<template>
    <div class="ripl-example" layout="row stretch-stretch">
        <div class="ripl-example__root" self="size-x1" ref="root" :key="type"></div>
        <div class="ripl-example__sidebar" self="size-x0">
            <div class="ripl-example__context-type-options" layout="row">
                <label class="ripl-example__context-type-option">
                    <input type="radio" name="context-type" value="canvas" v-model="type"> Canvas
                </label>
                <label class="ripl-example__context-type-option">
                    <input type="radio" name="context-type" value="svg" v-model="type"> SVG
                </label>
            </div>
            <div class="ripl-example__user-options" v-if="$slots.default">
                <slot></slot>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
    shallowRef,
    watchEffect
} from 'vue';

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
        border: 1px solid var(--vp-c-divider);
        border-radius: 0.5rem;
        overflow: hidden;
    }

    .ripl-example__sidebar {
        border-left: 1px solid var(--vp-c-divider);
        background-color: var(--vp-sidebar-bg-color);
    }

    .ripl-example__context-type-options,
    .ripl-example__user-options {
        padding: 1rem;
    }

    .ripl-example__context-type-options {
        gap: 0.25rem;
        border-bottom: 1px solid var(--vp-c-gray-1);
    }

    .ripl-example__context-type-option {
        display: block;
        padding: 0.25rem 1rem;
        border: 1px solid var(--vp-c-gray-1);
        border-radius: 0.25rem;
        background-color: var(--vp-c-bg);
        cursor: pointer;
        
        & input {
            display: none;
        }

        &:hover {
            background-color: var(--vp-c-bg-alt);
        }

        &:has(:checked) {
            color: var(--vp-button-brand-text);
            border-color: var(--vp-button-brand-border);
            background-color: var(--vp-button-brand-bg);
            
            &:hover {
                border-color: var(--vp-button-brand-active-border);
                background-color: var(--vp-button-brand-active-bg);
            }
        }
    }

    .ripl-example__user-options {

    }

    .ripl-example__root {
        aspect-ratio: 1 / 1;
    }

</style>