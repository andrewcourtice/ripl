<template>
    <div class="parameter-sliders">
        <p v-if="!params.length" class="parameter-sliders__empty">
            Free symbols in your expressions, such as <code>a</code> in <code>y = a*sin(x)</code>, appear here as sliders.
        </p>

        <div v-for="param in params" :key="param.name" class="parameter-sliders__param">
            <div class="parameter-sliders__header">
                <label class="parameter-sliders__control">
                    <span class="parameter-sliders__name">{{ param.name }}</span>
                    <RiplInputRange
                        :model-value="param.value"
                        :min="param.min"
                        :max="param.max"
                        :step="param.step"
                        @update:model-value="onPatch(param.name, { value: $event })"
                    />
                </label>
                <span class="parameter-sliders__value">{{ format(param) }}</span>
                <RiplButton
                    icon
                    :active="param.animating"
                    :aria-label="`Animate ${param.name}`"
                    :aria-pressed="param.animating"
                    :title="param.animating ? 'Pause' : 'Animate'"
                    @click="$emit('toggle-animation', param.name)"
                >
                    <Pause v-if="param.animating" :size="14" />
                    <Play v-else :size="14" />
                </RiplButton>
            </div>

            <div class="parameter-sliders__bounds">
                <RiplField label="Min" inline>
                    <RiplInputNumber
                        :model-value="param.min"
                        :step="param.step"
                        @update:model-value="onBound(param.name, 'min', $event)"
                    />
                </RiplField>
                <RiplField label="Max" inline>
                    <RiplInputNumber
                        :model-value="param.max"
                        :step="param.step"
                        @update:model-value="onBound(param.name, 'max', $event)"
                    />
                </RiplField>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import RiplButton from '../../../.vitepress/components/ripl-button.vue';
import RiplField from '../../../.vitepress/components/ripl-field.vue';
import RiplInputNumber from '../../../.vitepress/components/ripl-input-number.vue';
import RiplInputRange from '../../../.vitepress/components/ripl-input-range.vue';

import {
    Pause,
    Play,
} from 'lucide-vue-next';

import type {
    ParameterState,
} from '../types';

/** A change to one parameter, addressed by the symbol it stands for. */
export interface ParameterUpdate {
    /** The {@link ParameterState.name} of the parameter that changed. */
    name: string;
    /** The fields to merge into that parameter. */
    patch: Partial<ParameterState>;
}

defineProps<{
    /** The parameters to render, one slider each. */
    params: ParameterState[];
}>();

const emit = defineEmits<{
    /** The user moved a slider or edited one of its bounds. */
    'update:param': [update: ParameterUpdate];
    /** The user started or stopped animating a parameter. */
    'toggle-animation': [name: string];
}>();

function decimals(step: number): number {
    const text = String(step);
    const point = text.indexOf('.');

    return point < 0 ? 0 : text.length - point - 1;
}

function format(param: ParameterState): string {
    return param.value.toFixed(decimals(param.step));
}

function onPatch(name: string, patch: Partial<ParameterState>): void {
    emit('update:param', {
        name,
        patch,
    });
}

function onBound(name: string, bound: 'min' | 'max', value: number | undefined): void {
    if (value === undefined || !Number.isFinite(value)) {
        return;
    }

    onPatch(name, bound === 'min' ? { min: value } : { max: value });
}
</script>

<style scoped>
.parameter-sliders {
    display: flex;
    flex-direction: column;
}

.parameter-sliders__empty {
    margin: 0;
    padding: 1rem 0.75rem;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--vp-c-text-2);
}

.parameter-sliders__empty code {
    font-family: var(--vp-font-family-mono);
    font-size: 0.75rem;
}

.parameter-sliders__param {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.625rem;
    border-bottom: 1px solid var(--vp-c-divider);
}

.parameter-sliders__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.parameter-sliders__control {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
    cursor: pointer;
}

.parameter-sliders__name {
    flex-shrink: 0;
    font-family: var(--vp-font-family-mono);
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--vp-c-brand-1);
}

.parameter-sliders__value {
    flex-shrink: 0;
    min-width: 4ch;
    font-family: var(--vp-font-family-mono);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--vp-c-text-2);
}

.parameter-sliders__bounds {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
    gap: 0.375rem 0.75rem;
}

/* The row's own readout is rounded to the step, so hide the kit's raw one rather than show float noise. */
.parameter-sliders__param :deep(.ripl-input-range__value) {
    display: none;
}
</style>
