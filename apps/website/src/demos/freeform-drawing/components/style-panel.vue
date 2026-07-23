<template>
    <div class="freeform-style">
        <div class="freeform-style__section">
            <span class="freeform-style__label">Color</span>
            <div class="freeform-style__swatches">
                <button
                    v-for="color in palette"
                    :key="color"
                    class="freeform-style__swatch"
                    :class="{ 'freeform-style__swatch--active': color === style.stroke }"
                    :style="{ background: color }"
                    @click="$emit('patch', { stroke: color })"
                ></button>
            </div>
            <RiplColorInput
                :model-value="style.stroke"
                @update:model-value="$emit('patch', { stroke: $event })"
            />
        </div>

        <div class="freeform-style__section">
            <span class="freeform-style__label">Fill</span>
            <RiplSwitch
                :model-value="hasFill"
                label="Filled"
                @update:model-value="onToggleFill"
            />
            <RiplColorInput
                v-if="hasFill"
                :model-value="style.fill ?? style.stroke"
                @update:model-value="$emit('patch', { fill: $event })"
            />
        </div>

        <div class="freeform-style__section">
            <span class="freeform-style__label">Stroke width: {{ style.strokeWidth }}px</span>
            <RiplInputRange
                :model-value="style.strokeWidth"
                :min="1"
                :max="40"
                :step="1"
                @update:model-value="$emit('patch', { strokeWidth: $event })"
            />
        </div>

        <div class="freeform-style__section">
            <span class="freeform-style__label">Opacity: {{ Math.round(style.opacity * 100) }}%</span>
            <RiplInputRange
                :model-value="style.opacity"
                :min="0.1"
                :max="1"
                :step="0.05"
                @update:model-value="$emit('patch', { opacity: $event })"
            />
        </div>

        <div class="freeform-style__section freeform-style__section--row">
            <RiplSwitch
                :model-value="style.dash"
                label="Dashed"
                @update:model-value="$emit('patch', { dash: $event })"
            />
            <RiplSwitch
                :model-value="cornerRadius > 0"
                label="Rounded"
                @update:model-value="$emit('corner', $event ? 16 : 0)"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    PALETTE,
} from '../editor/constants';

import type {
    ShapeStyle,
} from '../editor/model';

import {
    computed,
} from 'vue';

const props = defineProps<{
    style: ShapeStyle;
    cornerRadius: number;
}>();

const emit = defineEmits<{
    patch: [patch: Partial<ShapeStyle>];
    corner: [radius: number];
}>();

const palette = PALETTE;

const hasFill = computed(() => props.style.fill !== null);

function onToggleFill(enabled: boolean): void {
    emit('patch', {
        fill: enabled ? props.style.stroke : null,
    });
}
</script>

<style scoped>
.freeform-style {
    display: flex;
    flex-direction: column;
    gap: 14px;
    width: 210px;
    padding: 14px;
    border-radius: 14px;
    background: var(--vp-c-bg);
    border: 1px solid var(--vp-c-divider);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
}

.freeform-style__section {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.freeform-style__section--row {
    flex-direction: row;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 4px;
}

.freeform-style__label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--vp-c-text-2);
}

.freeform-style__swatches {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 6px;
}

.freeform-style__swatch {
    width: 100%;
    aspect-ratio: 1;
    border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    padding: 0;
}

.freeform-style__swatch--active {
    border-color: var(--vp-c-brand-1);
    box-shadow: 0 0 0 1px var(--vp-c-bg);
}
</style>
