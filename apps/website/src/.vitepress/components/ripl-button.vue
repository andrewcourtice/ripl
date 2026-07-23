<template>
    <button
        class="ripl-button"
        :class="{
            'ripl-button--active': active,
            'ripl-button--icon': icon,
        }"
        @click="$emit('click', $event)"
    >
        <slot></slot>
    </button>
</template>

<script lang="ts" setup>
defineProps<{
    active?: boolean;
    icon?: boolean;
}>();

defineEmits<{
    'click': [event: MouseEvent];
}>();
</script>

<style scoped>
.ripl-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.35rem 0.875rem;
    font: inherit;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--vp-button-alt-text);
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.375rem;
    background-color: var(--vp-button-alt-bg);
    cursor: pointer;
    user-select: none;
    transition: color 150ms ease-out, background-color 150ms ease-out, border-color 150ms ease-out;
}

.ripl-button:hover {
    border-color: var(--vp-c-gray-2);
    background-color: var(--vp-button-alt-hover-bg);
}

.ripl-button:active {
    background-color: var(--vp-button-alt-hover-bg);
    transition-duration: 50ms;
}

.ripl-button:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
}

.ripl-button--active {
    color: var(--vp-button-brand-text);
    border-color: var(--vp-button-brand-border);
    background-color: var(--vp-button-brand-bg);
}

.ripl-button--active:hover {
    border-color: var(--vp-button-brand-hover-border);
    background-color: var(--vp-button-brand-hover-bg);
}

.ripl-button--icon {
    padding: 0.35rem;
    gap: 0;
}
</style>
