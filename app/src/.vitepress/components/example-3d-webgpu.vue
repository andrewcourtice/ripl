<template>
    <div class="ripl-example">
        <div class="ripl-example__header">
            <div class="ripl-example__context-type-options" layout="row">
                <label class="ripl-example__context-type-option" style="pointer-events: none;">
                    WebGPU 3D
                </label>
            </div>
            <slot name="header"></slot>
        </div>
        <div class="ripl-example__root" self="size-x1" ref="root"></div>
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

import {
    createContext,
} from '@ripl/webgpu';

import type {
    Context3D,
} from '@ripl/3d';

const emit = defineEmits<{
    'context-changed': [context: Context3D]
}>();

const root = ref<HTMLElement>();
let context: Context3D | undefined;

watchEffect(async () => {
    context?.destroy();

    if (root.value) {
        try {
            context = await createContext(root.value, {
                clearColor: [0.05, 0.05, 0.1, 1],
            });

            emit('context-changed', context);
        } catch (e) {
            if (root.value) {
                root.value.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--vp-c-text-2);font-size:14px;padding:2rem;text-align:center;">WebGPU is not supported in this browser. Try Chrome 113+ or Edge 113+.</div>';
            }
        }
    }
});

onUnmounted(() => {
    context?.destroy();
});
</script>
