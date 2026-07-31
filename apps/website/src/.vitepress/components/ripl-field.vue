<template>
    <label class="ripl-field" :class="{ 'ripl-field--inline': inline }">
        <span class="ripl-field__label" :title="hint">{{ label }}</span>
        <span class="ripl-field__control">
            <slot></slot>
        </span>
    </label>
</template>

<script lang="ts" setup>
import {
    computed,
} from 'vue';

const props = defineProps<{
    label: string;
    /** Lay the label and control out on a single row instead of stacked. */
    inline?: boolean;
    /**
     * The chart option this field sets, e.g. `borderRadius` or `axis`. Surfaced as the label's
     * tooltip so a reader can connect a control to the option it drives, and read by
     * `scripts/check-config-coverage.mjs` to prove every option of every chart has a control.
     *
     * Several fields may declare the same option when one option is driven by more than one control
     * (a heatmap's low and high colour both set `gradient`).
     */
    option?: string;
}>();

const hint = computed(() => (props.option ? `${props.label} — sets \`${props.option}\`` : props.label));
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
   controls (switch/color swatch) sit at the right edge. */
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
