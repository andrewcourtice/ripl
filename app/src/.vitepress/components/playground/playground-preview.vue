<template>
    <div class="playground-preview">
        <div class="playground-preview__header">
            <RiplButtonGroup>
                <RiplButton :active="contextType === 'canvas'" @click="$emit('update:contextType', 'canvas')">Canvas</RiplButton>
                <RiplButton :active="contextType === 'svg'" @click="$emit('update:contextType', 'svg')">SVG</RiplButton>
            </RiplButtonGroup>
        </div>
        <div class="playground-preview__body">
            <iframe
                ref="iframeRef"
                class="playground-preview__iframe"
                sandbox="allow-scripts allow-same-origin"
                :srcdoc="srcdoc"
            ></iframe>
        </div>
        <div v-if="error" class="playground-preview__error">
            {{ error }}
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
    onMounted,
    onBeforeUnmount,
} from 'vue';

import RiplButton from '../ripl-button.vue';
import RiplButtonGroup from '../ripl-button-group.vue';

import type {
    ContextType,
} from './sandbox';

const props = defineProps<{
    srcdoc: string;
    contextType: ContextType;
}>();

defineEmits<{
    'update:contextType': [value: ContextType];
}>();

const iframeRef = ref<HTMLIFrameElement>();
const error = ref('');

watch(() => props.srcdoc, () => {
    error.value = '';
});

function onMessage(event: MessageEvent) {
    if (event.data?.type === 'playground-error') {
        error.value = event.data.message;
    }
}

onMounted(() => {
    window.addEventListener('message', onMessage);
});

onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage);
});
</script>

<style lang="scss">
.playground-preview {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
}

.playground-preview__header {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--vp-c-divider);
    background-color: var(--vp-c-bg);
    flex-shrink: 0;
}

.playground-preview__body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    background: #1e1e2e;
}

.playground-preview__iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
}

.playground-preview__error {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    font-family: monospace;
    color: var(--vp-c-danger-1);
    background-color: var(--vp-c-danger-soft);
    border-top: 1px solid var(--vp-c-danger-1);
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 6rem;
    overflow-y: auto;
    flex-shrink: 0;
}
</style>
