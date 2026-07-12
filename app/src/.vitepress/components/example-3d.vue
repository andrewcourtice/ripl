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
    watch,
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

/** Upper bound on WebGPU acquisition — a present-but-broken adapter can leave `requestAdapter()` pending forever. */
const WEBGPU_TIMEOUT_MS = 10000;

/** Rejects with `message` if `promise` has not settled within `ms`, so a hung device never strands the spinner. */
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
            },
        );
    });
}

const emit = defineEmits<{
    'context-changed': [context: Context3D]
}>();

const type = ref<ContextType>('canvas');
const root = ref<HTMLElement>();
const context = shallowRef<Context3D>();
const loading = ref(false);
const error = ref('');

let generation = 0;

// Driven by an explicit `watch` on `[root, type]` rather than `watchEffect`: the handler both reads
// (`context.value?.destroy()`) and — in the WebGPU branch — writes `context.value` after an `await`, and a
// `watchEffect` would track that read and re-trigger itself on the write, churning contexts forever. `watch`
// tracks only its declared sources, so the post-await assignment settles state once.
async function updateContext([element, currentType]: [HTMLElement | undefined, ContextType]) {
    const token = ++generation;

    context.value?.destroy();
    context.value = undefined;
    error.value = '';
    // Reset on every run so switching back to Canvas (or superseding an in-flight WebGPU run) never strands the spinner.
    loading.value = false;

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
        const created = await withTimeout(
            createWebGPUContext(element),
            WEBGPU_TIMEOUT_MS,
            'WebGPU initialisation timed out.',
        );

        if (token !== generation) {
            created.destroy();
            return;
        }

        context.value = created;
        emit('context-changed', created);
    } catch {
        if (token === generation) {
            error.value = 'WebGPU is unavailable or timed out. Try Chrome 113+ or Edge 113+.';
        }
    } finally {
        if (token === generation) {
            loading.value = false;
        }
    }
}

watch([root, type], updateContext, { immediate: true });

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
