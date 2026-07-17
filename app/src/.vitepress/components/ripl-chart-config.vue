<template>
    <div class="ripl-chart-config">
        <div class="ripl-chart-config__toolbar">
            <button
                class="ripl-chart-config__reset"
                type="button"
                @click="onReset"
            >
                Reset
            </button>
        </div>

        <RiplConfigSection v-if="$slots.default" :title="extraTitle" :default-open="true">
            <slot></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="series && series.length" title="Colours" :default-open="true">
            <RiplField
                v-for="item in series"
                :key="item.id"
                :label="item.label"
                inline
            >
                <RiplColorInput v-model="config.colors[item.id]" />
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.legend" title="Legend" :default-open="true">
            <RiplField label="Show legend" inline>
                <RiplSwitch v-model="config.legendVisible" />
            </RiplField>
            <RiplField v-if="config.legendVisible" label="Position">
                <RiplSelect v-model="config.legendPosition">
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                </RiplSelect>
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.title" title="Title" :default-open="!hasLeadSection">
            <RiplField label="Show title" inline>
                <RiplSwitch v-model="config.titleVisible" />
            </RiplField>
            <RiplField v-if="config.titleVisible" label="Title text">
                <RiplInputText v-model="config.title" placeholder="Chart title" />
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.axes" title="Axes" :default-open="false">
            <RiplField label="Show axes" inline>
                <RiplSwitch v-model="config.axesVisible" />
            </RiplField>
            <RiplField label="X axis title">
                <RiplInputText v-model="config.axisX" placeholder="e.g. Month" />
            </RiplField>
            <RiplField label="Y axis title">
                <RiplInputText v-model="config.axisY" placeholder="e.g. Value" />
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.grid" title="Grid" :default-open="false">
            <RiplField label="Show grid" inline>
                <RiplSwitch v-model="config.gridVisible" />
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.navigator" title="Navigation" :default-open="false">
            <RiplField label="Pan &amp; zoom" inline>
                <RiplSwitch v-model="config.navigatorEnabled" />
            </RiplField>
            <RiplField v-if="config.navigatorEnabled" label="Zoom sensitivity">
                <RiplInputRange v-model="config.navigatorSensitivity" :min="0.1" :max="2" :step="0.1" />
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.animation" title="Animation" :default-open="false">
            <RiplField label="Animate" inline>
                <RiplSwitch v-model="config.animationEnabled" />
            </RiplField>
        </RiplConfigSection>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
    useSlots,
} from 'vue';

import type {
    ChartConfig,
} from '../compositions/use-chart-config';

import {
    resetChartConfig,
} from '../compositions/use-chart-config';

import RiplConfigSection from './ripl-config-section.vue';
import RiplField from './ripl-field.vue';
import RiplSwitch from './ripl-switch.vue';
import RiplSelect from './ripl-select.vue';
import RiplInputText from './ripl-input-text.vue';
import RiplInputRange from './ripl-input-range.vue';
import RiplColorInput from './ripl-color-input.vue';

export interface ChartConfigSeriesMeta {
    id: string;
    label: string;
}

const props = withDefaults(defineProps<{
    config: ChartConfig;
    /** Per-series / per-segment entries to render colour pickers for. */
    series?: ChartConfigSeriesMeta[];
    /** Heading for the chart-specific controls passed via the default slot. */
    extraTitle?: string;
    /** Optional reset for a demo's chart-specific state (from {@link useChartExtras}). */
    extrasReset?: () => void;
}>(), {
    series: () => [],
    extraTitle: 'Options',
    extrasReset: undefined,
});

const slots = useSlots();

// The lead (default-open) sections are Options / Colours / Legend. When a chart has none of
// them, open Title instead so the panel never opens fully collapsed.
const hasLeadSection = computed(() => !!slots.default
    || (props.series?.length ?? 0) > 0
    || props.config.features.legend);

function onReset(): void {
    resetChartConfig(props.config);
    props.extrasReset?.();
}
</script>

<style scoped>
.ripl-chart-config {
    display: flex;
    flex-direction: column;
}

.ripl-chart-config__toolbar {
    display: flex;
    justify-content: flex-end;
    padding: 8px var(--ripl-panel-pad, 16px);
    border-bottom: 1px solid var(--ripl-panel-rule, var(--vp-c-divider));
}

.ripl-chart-config__reset {
    padding: 2px 6px;
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--vp-c-text-3);
    border: none;
    border-radius: 0.25rem;
    background: none;
    cursor: pointer;
    transition: color 150ms ease-out;
}

.ripl-chart-config__reset:hover {
    color: var(--vp-c-brand-1);
}
</style>
