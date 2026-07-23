<template>
    <input
        type="number"
        class="ripl-input-number"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :placeholder="placeholder"
        @change="onChange"
    >
</template>

<script lang="ts" setup>
defineProps<{
    /** Current value, or `undefined` when the field is blank (e.g. "auto"). */
    modelValue: number | undefined;
    /** Minimum allowed value. */
    min?: number;
    /** Maximum allowed value. */
    max?: number;
    /** Step increment. */
    step?: number;
    /** Placeholder shown when the field is blank (e.g. "auto"). */
    placeholder?: string;
}>();

const emit = defineEmits<{
    'update:modelValue': [value: number | undefined];
}>();

// A blank field emits `undefined` so callers can express "auto"/unbounded (e.g. axis min/max).
function onChange(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    emit('update:modelValue', raw === '' ? undefined : Number(raw));
}
</script>

<style scoped>
.ripl-input-number {
    display: inline-flex;
    align-items: center;
    width: 100%;
    padding: 0.35rem 0.625rem;
    font: inherit;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--vp-c-text-1);
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.375rem;
    background-color: var(--vp-c-bg);
    transition: border-color 150ms ease-out;
}

.ripl-input-number:hover {
    border-color: var(--vp-c-gray-2);
}

.ripl-input-number:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
}
</style>
