<script setup lang="ts">
import {
    formatNumber,
} from '../../../shared/format';

import {
    computed,
    ref,
} from 'vue';

import type {
    SerializedProperty,
} from '@ripl/devtools';

const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const props = defineProps<{
    property: SerializedProperty;
}>();

const emit = defineEmits<{
    (event: 'commit', key: string, value: number | string | boolean | number[]): void;
}>();

// While an input is focused the user's draft wins; otherwise the polled value
// from the page (the source of truth) is displayed.
const focused = ref(false);
const draft = ref('');

function formatEditableValue(property: SerializedProperty): string {
    if (property.valueType === 'number-array' && Array.isArray(property.value)) {
        return property.value.map(formatNumber).join(', ');
    }

    if (property.valueType === 'number' && typeof property.value === 'number') {
        return formatNumber(property.value);
    }

    return String(property.value ?? '');
}

const displayValue = computed(() => {
    if (focused.value) {
        return draft.value;
    }

    return formatEditableValue(props.property);
});

const swatchColor = computed(() => {
    const value = String(props.property.value ?? '');

    return HEX_COLOR_PATTERN.test(value) ? value : 'transparent';
});

function onFocus(): void {
    focused.value = true;
    draft.value = formatEditableValue(props.property);
}

function onInput(event: Event): void {
    draft.value = (event.target as HTMLInputElement).value;
}

function onBlur(): void {
    focused.value = false;
}

function commitText(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    const {
        property,
    } = props;

    if (!property.editable) {
        return;
    }

    if (property.valueType === 'number') {
        const parsed = Number.parseFloat(raw);

        if (!Number.isNaN(parsed)) {
            emit('commit', property.key, parsed);
        }

        return;
    }

    if (property.valueType === 'number-array') {
        const values = raw
            .split(',')
            .map(part => Number.parseFloat(part.trim()))
            .filter(value => !Number.isNaN(value));

        emit('commit', property.key, values);
        return;
    }

    emit('commit', property.key, raw);
}

function commitCheckbox(event: Event): void {
    if (props.property.editable) {
        emit('commit', props.property.key, (event.target as HTMLInputElement).checked);
    }
}

function onEnter(event: KeyboardEvent): void {
    (event.target as HTMLInputElement).blur();
}
</script>

<template>
    <div class="property-row" :class="{ 'property-row--readonly': !property.editable }">
        <span class="property-row__key" :title="property.key">{{ property.key }}</span>
        <div class="property-row__editor">
            <input
                v-if="property.valueType === 'number'"
                type="number"
                step="any"
                :value="displayValue"
                :disabled="!property.editable"
                @focus="onFocus"
                @input="onInput"
                @blur="onBlur"
                @change="commitText"
                @keydown.enter="onEnter"
            >
            <input
                v-else-if="property.valueType === 'boolean'"
                type="checkbox"
                :checked="property.value === true"
                :disabled="!property.editable"
                @change="commitCheckbox"
            >
            <template v-else-if="property.valueType === 'color'">
                <span class="property-row__swatch" :style="{ background: swatchColor }"></span>
                <input
                    type="text"
                    spellcheck="false"
                    :value="displayValue"
                    :disabled="!property.editable"
                    @focus="onFocus"
                    @input="onInput"
                    @blur="onBlur"
                    @change="commitText"
                    @keydown.enter="onEnter"
                >
            </template>
            <span
                v-else-if="property.valueType === 'opaque'"
                class="property-row__opaque"
                :title="property.preview"
            >{{ property.preview ?? '…' }}</span>
            <input
                v-else
                type="text"
                spellcheck="false"
                :value="displayValue"
                :disabled="!property.editable"
                @focus="onFocus"
                @input="onInput"
                @blur="onBlur"
                @change="commitText"
                @keydown.enter="onEnter"
            >
        </div>
    </div>
</template>

<style scoped>
.property-row {
    display: flex;
    align-items: center;
    gap: var(--ripl-space-2);
    padding: 2px var(--ripl-section-pad-x);
    min-height: var(--ripl-row-height);
    font-size: 11px;
}

.property-row:hover {
    background: var(--ripl-hover);
}

.property-row__key {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--ripl-attr-name);
    font-family: ui-monospace, Menlo, Consolas, monospace;
}

.property-row__editor {
    flex: 1.4;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 4px;
}

.property-row__editor input[type='number'],
.property-row__editor input[type='text'] {
    width: 100%;
    min-width: 0;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 10.5px;
}

.property-row__editor input[type='checkbox'] {
    margin: 0;
    accent-color: var(--ripl-accent);
}

.property-row__swatch {
    flex: none;
    width: 12px;
    height: 12px;
    border: 1px solid var(--ripl-border);
    border-radius: 2px;
    background-clip: padding-box;
}

.property-row__opaque {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--ripl-text-dim);
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-style: italic;
}

.property-row--readonly .property-row__key {
    opacity: 0.7;
}
</style>
