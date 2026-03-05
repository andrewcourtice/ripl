<template>
    <div class="ripl-button-group">
        <button
            v-for="option in options"
            :key="option.value"
            class="ripl-button-group__item"
            :class="{ 'ripl-button-group__item--active': modelValue === option.value }"
            @click="$emit('update:modelValue', option.value)"
        >{{ option.label }}</button>
    </div>
</template>

<script lang="ts" setup>
export interface ButtonGroupOption {
    label: string;
    value: string;
}

defineProps<{
    modelValue: string;
    options: ButtonGroupOption[];
}>();

defineEmits<{
    'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.ripl-button-group {
    display: inline-flex;
    align-items: center;
}

.ripl-button-group__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.35rem 0.875rem;
    font: inherit;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--vp-button-alt-text);
    border: 1px solid var(--vp-c-divider);
    background-color: var(--vp-button-alt-bg);
    cursor: pointer;
    user-select: none;
    transition: color 150ms ease-out, background-color 150ms ease-out, border-color 150ms ease-out;
    margin-left: -1px;
}

.ripl-button-group__item:first-child {
    margin-left: 0;
    border-radius: 0.375rem 0 0 0.375rem;
}

.ripl-button-group__item:last-child {
    border-radius: 0 0.375rem 0.375rem 0;
}

.ripl-button-group__item:not(:first-child):not(:last-child) {
    border-radius: 0;
}

.ripl-button-group__item:hover {
    border-color: var(--vp-c-gray-2);
    background-color: var(--vp-button-alt-hover-bg);
}

.ripl-button-group__item:active {
    background-color: var(--vp-button-alt-hover-bg);
    transition-duration: 50ms;
}

.ripl-button-group__item:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
    z-index: 1;
}

.ripl-button-group__item--active {
    color: var(--vp-button-brand-text);
    border-color: var(--vp-button-brand-border);
    background-color: var(--vp-button-brand-bg);
    z-index: 1;
}

.ripl-button-group__item--active:hover {
    border-color: var(--vp-button-brand-hover-border);
    background-color: var(--vp-button-brand-hover-bg);
}
</style>
