<template>
    <button class="ripl-dropdown-item" :class="{ 'ripl-dropdown-item--active': active }" @click="$emit('click')">
        <slot></slot>
    </button>
</template>

<script lang="ts" setup>
defineProps<{
    active?: boolean;
}>();

defineEmits<{
    click: [];
}>();
</script>

<style scoped>
.ripl-dropdown-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.375rem 0.625rem;
    font: inherit;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--vp-c-text-2);
    border: none;
    border-radius: 0.25rem;
    background: none;
    cursor: pointer;
    text-align: left;
    white-space: nowrap;
    transition: color 100ms ease-out, background-color 100ms ease-out;
}

.ripl-dropdown-item:hover {
    color: var(--vp-c-text-1);
    background-color: var(--vp-c-default-soft);
}

.ripl-dropdown-item--active {
    color: var(--vp-c-brand-1);
}

.ripl-dropdown-item--active:hover {
    color: var(--vp-c-brand-1);
}
</style>
