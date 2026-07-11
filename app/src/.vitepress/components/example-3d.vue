<template>
    <div class="ripl-example">
        <div class="ripl-example__header">
            <RiplButtonGroup v-model="type" :options="[
                { label: 'Canvas', value: 'canvas' },
                { label: 'WebGPU', value: 'webgpu' },
            ]" />
            <slot name="header"></slot>
            <div class="ripl-example__actions">
                <RiplExportButton v-if="context" :context="context" />
            </div>
        </div>
        <div class="ripl-example__root">
            <div class="ripl-example__mount" self="size-x1" ref="root" :key="type"></div>
            <RiplSpinner v-if="loading" overlay label="Loading WebGPU…" />
            <div v-if="error" class="ripl-example__error">{{ error }}</div>
        </div>
        <div class="ripl-example__footer" v-if="$slots.footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    onUnmounted,
    ref,
    shallowRef,
    watchEffect,
} from 'vue';

import RiplButtonGroup from './ripl-button-group.vue';
import RiplExportButton from './ripl-export-button.vue';
import RiplSpinner from './ripl-spinner.vue';

import {
    createContext as createCanvasContext,
} from '@ripl/3d';

import {
    createContext as createWebGPUContext,
} from '@ripl/webgpu';

import type {
    Context3D,
} from '@ripl/3d';

type ContextType = 'canvas' | 'webgpu';

const emit = defineEmits<{
    'context-changed': [context: Context3D]
}>();

const type = ref<ContextType>('canvas');
const root = ref<HTMLElement>();
const context = shallowRef<Context3D>();
const loading = ref(false);
const error = ref('');

let generation = 0;

watchEffect(async () => {
    const element = root.value;
    const currentType = type.value;
    const token = ++generation;

    context.value?.destroy();
    context.value = undefined;
    error.value = '';

    if (!element) {
        return;
    }

    if (currentType !== 'webgpu') {
        const created = createCanvasContext(element);
        context.value = created;
        emit('context-changed', created);
        return;
    }

    loading.value = true;

    try {
        const created = await createWebGPUContext(element);

        if (token !== generation) {
            created.destroy();
            return;
        }

        context.value = created;
        emit('context-changed', created);
    } catch {
        if (token === generation) {
            error.value = 'WebGPU is not supported in this browser. Try Chrome 113+ or Edge 113+.';
        }
    } finally {
        if (token === generation) {
            loading.value = false;
        }
    }
});

onUnmounted(() => {
    context.value?.destroy();
});
</script>

<style scoped>
.ripl-example__error {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    font-size: 14px;
    color: var(--vp-c-text-2);
}
</style>
