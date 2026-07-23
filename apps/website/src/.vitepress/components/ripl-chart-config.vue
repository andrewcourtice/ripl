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

        <RiplConfigSection v-if="config.features.dataLabels" title="Data labels" :default-open="false">
            <RiplField label="Show labels" inline>
                <RiplSwitch v-model="config.dataLabelsVisible" />
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
            <template v-if="config.features.axisScale">
                <RiplField label="Y scale">
                    <RiplSelect v-model="config.axisScale">
                        <option value="linear">Linear</option>
                        <option value="log">Logarithmic</option>
                        <option value="pow">Power</option>
                        <option value="sqrt">Square root</option>
                    </RiplSelect>
                </RiplField>
                <RiplField label="Y ticks">
                    <RiplInputRange v-model="config.axisTicks" :min="2" :max="20" :step="1" />
                </RiplField>
                <RiplField label="Y min">
                    <RiplInputNumber v-model="config.axisMin" placeholder="auto" />
                </RiplField>
                <RiplField label="Y max">
                    <RiplInputNumber v-model="config.axisMax" placeholder="auto" />
                </RiplField>
                <RiplField label="Y format">
                    <RiplSelect v-model="config.axisYFormat">
                        <option value="none">Default</option>
                        <option value="number">Number</option>
                        <option value="percentage">Percentage</option>
                        <option value="date">Date</option>
                        <option value="string">String</option>
                    </RiplSelect>
                </RiplField>
            </template>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.grid" title="Grid" :default-open="false">
            <RiplField label="Show grid" inline>
                <RiplSwitch v-model="config.gridVisible" />
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.tooltip" title="Tooltip" :default-open="false">
            <RiplField label="Show tooltip" inline>
                <RiplSwitch v-model="config.tooltipVisible" />
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.crosshair" title="Crosshair" :default-open="false">
            <RiplField label="Show crosshair" inline>
                <RiplSwitch v-model="config.crosshairVisible" />
            </RiplField>
            <RiplField v-if="config.crosshairVisible" label="Track axis">
                <RiplSelect v-model="config.crosshairAxis">
                    <option value="x">X</option>
                    <option value="y">Y</option>
                    <option value="both">Both</option>
                </RiplSelect>
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.annotations" title="Annotations" :default-open="false">
            <RiplField label="Sample annotations" inline>
                <RiplSwitch v-model="config.annotationsVisible" />
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.navigator" title="Navigation" :default-open="false">
            <RiplField label="Navigator" inline>
                <RiplSwitch v-model="config.navigatorEnabled" />
            </RiplField>
            <RiplField v-if="config.navigatorEnabled" label="Zoom sensitivity">
                <RiplInputRange v-model="config.navigatorSensitivity" :min="0.1" :max="2" :step="0.1" />
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.format" title="Value format" :default-open="false">
            <RiplField label="Format">
                <RiplSelect v-model="config.valueFormat">
                    <option value="none">Default</option>
                    <option value="number">Number</option>
                    <option value="percentage">Percentage</option>
                    <option value="date">Date</option>
                    <option value="string">String</option>
                </RiplSelect>
            </RiplField>
        </RiplConfigSection>

        <RiplConfigSection v-if="config.features.theme" title="Theme" :default-open="false">
            <RiplField label="Theme">
                <RiplSelect v-model="config.theme">
                    <option value="auto">Auto</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="colorblind">Colourblind</option>
                </RiplSelect>
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
import RiplInputNumber from './ripl-input-number.vue';
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
