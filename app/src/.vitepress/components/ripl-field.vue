<template>
    <label class="ripl-field" :class="{ 'ripl-field--inline': inline }">
        <span class="ripl-field__label">{{ label }}</span>
        <span class="ripl-field__control">
            <slot></slot>
        </span>
    </label>
</template>

<script lang="ts" setup>
defineProps<{
    label: string;
    /** Lay the label and control out on a single row instead of stacked. */
    inline?: boolean;
}>();
</script>

<style scoped>
.ripl-field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    font-size: 0.8125rem;
    color: var(--vp-c-text-2);
}

.ripl-field--inline {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.ripl-field__label {
    font-weight: 500;
}

.ripl-field--inline .ripl-field__control {
    flex-shrink: 0;
}

.ripl-field__control :deep(.ripl-select),
.ripl-field__control :deep(.ripl-input-text) {
    width: 100%;
}
</style>
