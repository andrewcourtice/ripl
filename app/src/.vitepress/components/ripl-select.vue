<template>
    <select
        class="ripl-select"
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
        <slot></slot>
    </select>
</template>

<script lang="ts" setup>
defineProps<{
    modelValue: string;
}>();

defineEmits<{
    'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.ripl-select {
    display: inline-flex;
    align-items: center;
    padding: 0.35rem 2rem 0.35rem 0.75rem;
    font: inherit;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--vp-button-alt-text);
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.375rem;
    background-color: var(--vp-button-alt-bg);
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;
    appearance: none;
    cursor: pointer;
    transition: color 150ms ease-out, background-color 150ms ease-out, border-color 150ms ease-out;
}

.ripl-select:hover {
    border-color: var(--vp-c-gray-2);
    background-color: var(--vp-button-alt-hover-bg);
}

.ripl-select:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
}
</style>
