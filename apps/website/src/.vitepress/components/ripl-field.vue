<template>
    <label class="ripl-field" :class="{ 'ripl-field--inline': inline }">
        <span class="ripl-field__label" :title="label">{{ label }}</span>
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
    color: var(--ripl-panel-label, var(--vp-c-text-2));
}

.ripl-field--inline {
    display: grid;
    grid-template-columns: var(--ripl-panel-label-col, auto) minmax(0, 1fr);
    align-items: center;
    gap: var(--ripl-panel-gap, 0.75rem);
    min-height: var(--ripl-panel-row-min-h, 30px);
}

.ripl-field__label {
    font-weight: 500;
    overflow-wrap: break-word;
}

/* Inline: full-width controls (select/text/number/range) fill the value column; fixed-size
   controls (switch/colour swatch) sit at the right edge. */
.ripl-field--inline .ripl-field__control {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 0;
}

.ripl-field__control :deep(.ripl-select),
.ripl-field__control :deep(.ripl-input-text),
.ripl-field__control :deep(.ripl-input-number),
.ripl-field__control :deep(.ripl-input-range) {
    width: 100%;
}
</style>
