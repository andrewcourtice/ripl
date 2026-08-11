<template>
    <span class="ripl-color-input">
        <input
            type="color"
            class="ripl-color-input__picker"
            :value="modelValue"
            @input="onInput"
        >
        <span class="ripl-color-input__value" aria-hidden="true">{{ modelValue }}</span>
    </span>
</template>

<script lang="ts" setup>
import {
    createFrameBuffer,
} from '@ripl/web';

import {
    onBeforeUnmount,
} from 'vue';

defineProps<{
    modelValue: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: string];
}>();

// Live while dragging (`input`, not `change`), coalesced so a drag can't flood chart updates.
const scheduleFlush = createFrameBuffer();

let unmounted = false;

function onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    scheduleFlush(() => {
        if (!unmounted) {
            emit('update:modelValue', value);
        }
    });
}

onBeforeUnmount(() => {
    unmounted = true;
});
</script>

<style scoped>
.ripl-color-input {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
}

.ripl-color-input__picker {
    appearance: none;
    width: 28px;
    height: 28px;
    padding: 0;
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.375rem;
    background: none;
    cursor: pointer;
}

.ripl-color-input__picker::-webkit-color-swatch-wrapper {
    padding: 2px;
}

.ripl-color-input__picker::-webkit-color-swatch {
    border: none;
    border-radius: 0.25rem;
}

.ripl-color-input__value {
    font-family: var(--vp-font-family-mono);
    font-size: 0.75rem;
    color: var(--vp-c-text-3);
    text-transform: uppercase;
}
</style>
