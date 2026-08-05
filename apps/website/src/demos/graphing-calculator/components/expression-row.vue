<template>
    <div
        class="expression-row"
        :class="{
            'expression-row--hidden': !expression.visible,
            'expression-row--invalid': Boolean(expression.error),
        }"
    >
        <div class="expression-row__controls">
            <RiplDropdown class="expression-row__color">
                <template #trigger>
                    <button
                        type="button"
                        class="expression-row__swatch"
                        :aria-label="`Color for expression ${index + 1}`"
                        :title="`Color for expression ${index + 1}`"
                    >
                        <span class="expression-row__ordinal">{{ index + 1 }}</span>
                        <span class="expression-row__dot" :style="{ backgroundColor: expression.color }"></span>
                    </button>
                </template>
                <RiplDropdownLabel>Curve color</RiplDropdownLabel>
                <div class="expression-row__picker">
                    <RiplColorInput
                        :model-value="expression.color"
                        @update:model-value="$emit('update:color', $event)"
                    />
                </div>
            </RiplDropdown>

            <span class="expression-row__field">
                <RiplInputText
                    live
                    :model-value="expression.source"
                    :aria-label="`Expression ${index + 1}`"
                    :aria-invalid="Boolean(expression.error)"
                    :aria-describedby="expression.error ? errorId : undefined"
                    placeholder="y = sin(x)"
                    @update:model-value="$emit('update:source', $event)"
                />
            </span>

            <RiplButton
                icon
                :aria-label="`Toggle visibility of expression ${index + 1}`"
                :aria-pressed="expression.visible"
                :title="expression.visible ? 'Hide' : 'Show'"
                @click="$emit('update:visible', !expression.visible)"
            >
                <Eye v-if="expression.visible" :size="14" />
                <EyeOff v-else :size="14" />
            </RiplButton>

            <RiplButton
                icon
                :aria-label="`Delete expression ${index + 1}`"
                title="Delete"
                @click="$emit('remove')"
            >
                <Trash2 :size="14" />
            </RiplButton>
        </div>

        <p v-if="expression.error" :id="errorId" class="expression-row__error">
            <TriangleAlert :size="13" />
            <span>{{ expression.error }}</span>
        </p>
    </div>
</template>

<script lang="ts" setup>
import RiplButton from '../../../.vitepress/components/ripl-button.vue';
import RiplColorInput from '../../../.vitepress/components/ripl-color-input.vue';
import RiplDropdown from '../../../.vitepress/components/ripl-dropdown.vue';
import RiplDropdownLabel from '../../../.vitepress/components/ripl-dropdown-label.vue';
import RiplInputText from '../../../.vitepress/components/ripl-input-text.vue';

import {
    Eye,
    EyeOff,
    Trash2,
    TriangleAlert,
} from 'lucide-vue-next';

import {
    computed,
} from 'vue';

import type {
    GraphExpression,
} from '../types';

const props = defineProps<{
    /** The expression this row edits. */
    expression: GraphExpression;
    /** Zero-based position in the list, shown as the row's ordinal. */
    index: number;
}>();

defineEmits<{
    /** The user committed new text for the expression. */
    'update:source': [source: string];
    /** The user toggled whether the expression is drawn. */
    'update:visible': [visible: boolean];
    /** The user picked a new stroke color. */
    'update:color': [color: string];
    /** The user asked for this row to be deleted. */
    'remove': [];
}>();

const errorId = computed(() => `${props.expression.id}-error`);
</script>

<style scoped>
.expression-row {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    padding: 0.5rem 0.625rem;
    border-bottom: 1px solid var(--vp-c-divider);
    transition: background-color 150ms ease-out;
}

.expression-row:hover {
    background-color: var(--vp-c-bg-soft);
}

.expression-row__controls {
    display: flex;
    align-items: center;
    gap: 0.375rem;
}

.expression-row__color {
    flex-shrink: 0;
}

.expression-row__swatch {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.3rem 0.4rem;
    font: inherit;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    color: var(--vp-c-text-2);
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.375rem;
    background-color: var(--vp-button-alt-bg);
    cursor: pointer;
    transition: border-color 150ms ease-out, color 150ms ease-out;
}

.expression-row__swatch:hover {
    color: var(--vp-c-text-1);
    border-color: var(--vp-c-brand-1);
}

.expression-row__swatch:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
}

.expression-row__ordinal {
    min-width: 1ch;
    text-align: right;
}

.expression-row__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 1px solid var(--vp-c-divider);
    transition: opacity 150ms ease-out;
}

.expression-row__picker {
    padding: 0.25rem 0.625rem 0.375rem;
}

.expression-row__field {
    flex: 1;
    min-width: 0;
}

.expression-row__field :deep(.ripl-input-text) {
    width: 100%;
    font-family: var(--vp-font-family-mono);
    font-size: 0.8125rem;
}

.expression-row--invalid .expression-row__field :deep(.ripl-input-text) {
    border-color: var(--vp-c-danger-2);
}

.expression-row--hidden .expression-row__dot {
    opacity: 0.3;
}

.expression-row--hidden .expression-row__field {
    opacity: 0.55;
}

.expression-row__error {
    display: flex;
    align-items: flex-start;
    gap: 0.375rem;
    margin: 0;
    padding-left: 0.125rem;
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--vp-c-danger-1);
}

.expression-row__error svg {
    flex-shrink: 0;
    margin-top: 0.1rem;
}
</style>
