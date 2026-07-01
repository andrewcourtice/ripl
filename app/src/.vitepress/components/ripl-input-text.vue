<template>
    <input
        type="text"
        class="ripl-input-text"
        :value="modelValue"
        :placeholder="placeholder"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    >
</template>

<script lang="ts" setup>
defineProps<{
    modelValue: string;
    placeholder?: string;
}>();

defineEmits<{
    'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.ripl-input-text {
    display: inline-flex;
    align-items: center;
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

.ripl-input-text:hover {
    border-color: var(--vp-c-gray-2);
}

.ripl-input-text:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
}
</style>
