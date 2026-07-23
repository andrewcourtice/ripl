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
    onUnmounted,
    ref,
    watchEffect,
} from 'vue';

import {
    createContext,
} from '@ripl/webgpu';

import type {
    Context3D,
} from '@ripl/3d';

/** Upper bound on WebGPU acquisition — a present-but-broken adapter can leave `requestAdapter()` pending forever. */
const WEBGPU_TIMEOUT_MS = 10000;

/** Rejects with `message` if `promise` has not settled within `ms`, so a hung device fails gracefully. */
function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(message)), ms);

        promise.then(
            value => {
                clearTimeout(timer);
                resolve(value);
            },
            reason => {
                clearTimeout(timer);
                reject(reason);
            }
        );
    });
}

const emit = defineEmits<{
    'context-changed': [context: Context3D];
}>();

const root = ref<HTMLElement>();
let context: Context3D | undefined;

watchEffect(async () => {
    context?.destroy();

    if (root.value) {
        try {
            context = await withTimeout(
                createContext(root.value, {
                    clearColor: [0.05, 0.05, 0.1, 1],
                }),
                WEBGPU_TIMEOUT_MS,
                'WebGPU initialisation timed out.'
            );

            emit('context-changed', context);
        } catch {
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
