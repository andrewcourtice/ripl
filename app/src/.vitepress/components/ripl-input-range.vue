<template>
    <input
        type="range"
        class="ripl-input-range"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    >
</template>

<script lang="ts" setup>
defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
}>();

defineEmits<{
    'update:modelValue': [value: number];
}>();
</script>

<style scoped>
.ripl-input-range {
    appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: var(--vp-c-divider);
    outline: none;
    cursor: pointer;
}

.ripl-input-range::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--vp-c-brand-3);
    border: 2px solid var(--vp-c-bg);
    box-shadow: 0 0 0 1px var(--vp-c-divider);
    cursor: pointer;
    transition: background-color 150ms ease-out, box-shadow 150ms ease-out;
}

.ripl-input-range::-webkit-slider-thumb:hover {
    background: var(--vp-c-brand-2);
}

.ripl-input-range::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--vp-c-brand-3);
    border: 2px solid var(--vp-c-bg);
    box-shadow: 0 0 0 1px var(--vp-c-divider);
    cursor: pointer;
}

.ripl-input-range::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: var(--vp-c-divider);
}

.ripl-input-range:focus-visible {
    outline: none;
}

.ripl-input-range:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 2px var(--vp-c-brand-1);
}
</style>
