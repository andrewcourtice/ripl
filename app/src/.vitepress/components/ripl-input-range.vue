<template>
    <span class="ripl-input-range">
        <input
            type="range"
            class="ripl-input-range__slider"
            :value="modelValue"
            :min="min"
            :max="max"
            :step="step"
            @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
        >
        <span class="ripl-input-range__value">{{ modelValue }}</span>
    </span>
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
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
}

.ripl-input-range__slider {
    appearance: none;
    flex: 1;
    min-width: 0;
    height: 4px;
    border-radius: 2px;
    background: var(--vp-c-divider);
    outline: none;
    cursor: pointer;
}

.ripl-input-range__value {
    flex-shrink: 0;
    min-width: 2.5ch;
    font-family: var(--vp-font-family-mono);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--vp-c-text-3);
}

.ripl-input-range__slider::-webkit-slider-thumb {
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

.ripl-input-range__slider::-webkit-slider-thumb:hover {
    background: var(--vp-c-brand-2);
}

.ripl-input-range__slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--vp-c-brand-3);
    border: 2px solid var(--vp-c-bg);
    box-shadow: 0 0 0 1px var(--vp-c-divider);
    cursor: pointer;
}

.ripl-input-range__slider::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: var(--vp-c-divider);
}

.ripl-input-range__slider:focus-visible {
    outline: none;
}

.ripl-input-range__slider:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 2px var(--vp-c-brand-1);
}
</style>
