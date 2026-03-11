<template>
    <label class="ripl-switch">
        <input
            type="checkbox"
            :checked="modelValue"
            @change="$emit('update:modelValue', !modelValue)"
        >
        <span class="ripl-switch__track">
            <span class="ripl-switch__thumb"></span>
        </span>
        <span v-if="label">{{ label }}</span>
        <slot v-else></slot>
    </label>
</template>

<script lang="ts" setup>
defineProps<{
    modelValue: boolean;
    label?: string;
}>();

defineEmits<{
    'update:modelValue': [value: boolean];
}>();
</script>

<style scoped>
.ripl-switch {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.625rem;
    cursor: pointer;
    user-select: none;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--vp-c-text-2);
}

.ripl-switch input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
}

.ripl-switch__track {
    position: relative;
    width: 34px;
    height: 20px;
    border-radius: 10px;
    background-color: var(--vp-c-gray-2);
    transition: background-color 200ms ease-out;
    flex-shrink: 0;
}

.ripl-switch__thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background-color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition: transform 200ms ease-out;
}

.ripl-switch:has(input:checked) {
    color: var(--vp-c-text-1);
}

.ripl-switch:has(input:checked) .ripl-switch__track {
    background-color: var(--vp-c-brand-3);
}

.ripl-switch:has(input:checked) .ripl-switch__thumb {
    transform: translateX(14px);
}

.ripl-switch:has(input:focus-visible) .ripl-switch__track {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
}

.ripl-switch:hover .ripl-switch__track {
    background-color: var(--vp-c-gray-1);
}

.ripl-switch:has(input:checked):hover .ripl-switch__track {
    background-color: var(--vp-c-brand-2);
}
</style>
