<template>
    <div class="ripl-example">
        <div class="ripl-example__header">
            <RiplButtonGroup v-model="type" :options="[
                { label: 'Canvas', value: 'canvas' },
                { label: 'WebGPU', value: 'webgpu' },
            ]" />
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
    watchEffect,
    onUnmounted,
} from 'vue';

import RiplButtonGroup from './ripl-button-group.vue';

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
let context: Context3D | undefined;

watchEffect(async () => {
    context?.destroy();

    if (root.value) {
        if (type.value === 'webgpu') {
            try {
                context = await createWebGPUContext(root.value);
                emit('context-changed', context);
            } catch {
                if (root.value) {
                    root.value.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vp-c-text-2);font-size:14px;padding:2rem;text-align:center;">WebGPU is not supported in this browser. Try Chrome 113+ or Edge 113+.</div>';
                }
            }
        } else {
            context = createCanvasContext(root.value);

            emit('context-changed', context);
        }
    }
});

onUnmounted(() => {
    context?.destroy();
});
</script>
