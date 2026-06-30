<template>
    <div class="ripl-example">
        <div class="ripl-example__header">
            <RiplButtonGroup v-model="type" :options="[
                { label: 'Canvas', value: 'canvas' },
                { label: 'SVG', value: 'svg' },
            ]" />
            <slot name="header"></slot>
            <button
                v-if="$slots.config"
                class="ripl-example__config-button"
                type="button"
                aria-label="Customize chart"
                @click="configOpen = true"
            >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                <span>Customize</span>
            </button>
        </div>
        <div class="ripl-example__root" self="size-x1" ref="root" :key="type"></div>
        <div class="ripl-example__footer" v-if="$slots.footer">
            <slot name="footer"></slot>
        </div>
        <RiplConfigDrawer v-if="$slots.config" v-model="configOpen">
            <slot name="config"></slot>
        </RiplConfigDrawer>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
    shallowRef,
    watchEffect
} from 'vue';

import RiplButtonGroup from './ripl-button-group.vue';
import RiplConfigDrawer from './ripl-config-drawer.vue';

import {
    Context,
    createContext as createCanvasContext,
} from '@ripl/web';

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
const configOpen = ref(false);

watchEffect(() => {
    const contextInitialiser = CONTEXT_MAP[type.value];

    context.value?.destroy();

    if (root.value) {
        context.value = contextInitialiser(root.value);

        emit('context-changed', context.value);
    }
});
</script>

<style lang="scss">

    .ripl-example {
        position: relative;
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
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.75rem;
        border-bottom: 1px solid var(--vp-c-divider);
    }

    .ripl-example__config-button {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        margin-left: auto;
        padding: 0.35rem 0.75rem;
        font-size: 0.8125rem;
        line-height: 1.5;
        color: var(--vp-button-alt-text);
        border: 1px solid var(--vp-c-divider);
        border-radius: 0.375rem;
        background-color: var(--vp-button-alt-bg);
        cursor: pointer;
        transition: color 150ms ease-out, background-color 150ms ease-out, border-color 150ms ease-out;
    }

    .ripl-example__config-button:hover {
        border-color: var(--vp-c-gray-2);
        background-color: var(--vp-button-alt-hover-bg);
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