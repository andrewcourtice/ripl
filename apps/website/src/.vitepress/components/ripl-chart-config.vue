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

        <RiplConfigSection
            v-if="(series && series.length) || $slots.colors"
            title="Colors"
            :default-open="true"
        >
            <RiplField
                v-for="item in series"
                :key="item.id"
                :label="item.label"
                option="color"
                inline
            >
                <RiplColorInput v-model="config.colors[item.id]" />
            </RiplField>
            <slot name="colors"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('dataLabels')" title="Data labels" :default-open="false">
            <RiplField
                v-if="config.features.dataLabels"
                label="Show labels"
                option="labels"
                inline
            >
                <RiplSwitch v-model="config.dataLabelsVisible" />
            </RiplField>
            <slot name="labels"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('legend')" title="Legend" :default-open="true">
            <template v-if="config.features.legend">
                <RiplField label="Show legend" option="legend" inline>
                    <RiplSwitch v-model="config.legendVisible" />
                </RiplField>
                <RiplField v-if="config.legendVisible" label="Position" option="legend">
                    <RiplSelect v-model="config.legendPosition">
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                    </RiplSelect>
                </RiplField>
            </template>
            <slot name="legend"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('title')" title="Title" :default-open="!hasLeadSection">
            <template v-if="config.features.title">
                <RiplField label="Show title" option="title" inline>
                    <RiplSwitch v-model="config.titleVisible" />
                </RiplField>
                <RiplField v-if="config.titleVisible" label="Title text" option="title">
                    <RiplInputText v-model="config.title" placeholder="Chart title" />
                </RiplField>
            </template>
            <slot name="title"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('axes')" title="Axes" :default-open="false">
            <template v-if="config.features.axes">
                <RiplField label="Show axes" option="axis" inline>
                    <RiplSwitch v-model="config.axesVisible" />
                </RiplField>
                <RiplField label="X axis title" option="axis">
                    <RiplInputText v-model="config.axisX" placeholder="e.g. Month" />
                </RiplField>
                <RiplField label="Y axis title" option="axis">
                    <RiplInputText v-model="config.axisY" placeholder="e.g. Value" />
                </RiplField>
                <RiplField label="X label rotation" option="axis">
                    <RiplInputRange
                        v-model="config.axisXLabelRotation"
                        :min="-90"
                        :max="90"
                        :step="15"
                    />
                </RiplField>
                <template v-if="config.features.axisScale">
                    <RiplField label="Y scale" option="axis">
                        <RiplSelect v-model="config.axisScale">
                            <option value="linear">Linear</option>
                            <option value="log">Logarithmic</option>
                            <option value="pow">Power</option>
                            <option value="sqrt">Square root</option>
                        </RiplSelect>
                    </RiplField>
                    <RiplField label="Y ticks" option="axis">
                        <RiplInputRange
                            v-model="config.axisTicks"
                            :min="2"
                            :max="20"
                            :step="1"
                        />
                    </RiplField>
                    <RiplField label="Y min" option="axis">
                        <RiplInputNumber v-model="config.axisMin" placeholder="auto" />
                    </RiplField>
                    <RiplField label="Y max" option="axis">
                        <RiplInputNumber v-model="config.axisMax" placeholder="auto" />
                    </RiplField>
                    <RiplField label="Y format" option="axis">
                        <RiplSelect v-model="config.axisYFormat">
                            <option value="none">Default</option>
                            <option value="number">Number</option>
                            <option value="percentage">Percentage</option>
                            <option value="date">Date</option>
                            <option value="string">String</option>
                        </RiplSelect>
                    </RiplField>
                </template>
            </template>
            <slot name="axes"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('grid')" title="Grid" :default-open="false">
            <RiplField
                v-if="config.features.grid"
                label="Show grid"
                option="grid"
                inline
            >
                <RiplSwitch v-model="config.gridVisible" />
            </RiplField>
            <slot name="grid"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('tooltip')" title="Tooltip" :default-open="false">
            <template v-if="config.features.tooltip">
                <RiplField label="Show tooltip" option="tooltip" inline>
                    <RiplSwitch v-model="config.tooltipVisible" />
                </RiplField>
                <RiplField v-if="config.tooltipVisible" label="Trigger" option="tooltip">
                    <RiplSelect v-model="config.tooltipTrigger">
                        <option value="item">Item</option>
                        <option value="axis">Axis</option>
                    </RiplSelect>
                </RiplField>
            </template>
            <slot name="tooltip"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('crosshair')" title="Crosshair" :default-open="false">
            <template v-if="config.features.crosshair">
                <RiplField label="Show crosshair" option="crosshair" inline>
                    <RiplSwitch v-model="config.crosshairVisible" />
                </RiplField>
                <RiplField v-if="config.crosshairVisible" label="Track axis" option="crosshair">
                    <RiplSelect v-model="config.crosshairAxis">
                        <option value="x">X</option>
                        <option value="y">Y</option>
                        <option value="both">Both</option>
                    </RiplSelect>
                </RiplField>
            </template>
            <slot name="crosshair"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('annotations')" title="Annotations" :default-open="false">
            <RiplField
                v-if="config.features.annotations"
                label="Sample annotations"
                option="annotations"
                inline
            >
                <RiplSwitch v-model="config.annotationsVisible" />
            </RiplField>
            <slot name="annotations"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('navigator')" title="Navigation" :default-open="false">
            <template v-if="config.features.navigator">
                <RiplField label="Navigator" option="navigator" inline>
                    <RiplSwitch v-model="config.navigatorEnabled" />
                </RiplField>
                <RiplField v-if="config.navigatorEnabled" label="Zoom sensitivity" option="navigator">
                    <RiplInputRange
                        v-model="config.navigatorSensitivity"
                        :min="0.1"
                        :max="2"
                        :step="0.1"
                    />
                </RiplField>
                <RiplField label="Overview strip" option="overview" inline>
                    <RiplSwitch v-model="config.overviewEnabled" />
                </RiplField>
            </template>
            <slot name="navigator"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('format')" title="Value format" :default-open="false">
            <RiplField v-if="config.features.format" label="Format" option="format">
                <RiplSelect v-model="config.valueFormat">
                    <option value="none">Default</option>
                    <option value="number">Number</option>
                    <option value="percentage">Percentage</option>
                    <option value="date">Date</option>
                    <option value="string">String</option>
                </RiplSelect>
            </RiplField>
            <slot name="format"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('layout')" title="Layout" :default-open="false">
            <RiplField
                v-if="config.features.layout"
                label="Padding"
                option="padding"
            >
                <RiplInputRange
                    v-model="config.padding"
                    :min="0"
                    :max="48"
                    :step="4"
                />
            </RiplField>
            <slot name="layout"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('theme')" title="Theme" :default-open="false">
            <RiplField v-if="config.features.theme" label="Theme" option="theme">
                <RiplSelect v-model="config.theme">
                    <option value="auto">Auto</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="colorblind">Colorblind</option>
                </RiplSelect>
            </RiplField>
            <slot name="theme"></slot>
        </RiplConfigSection>

        <RiplConfigSection v-if="shows('animation')" title="Animation" :default-open="false">
            <template v-if="config.features.animation">
                <RiplField label="Animate" option="animation" inline>
                    <RiplSwitch v-model="config.animationEnabled" />
                </RiplField>
                <RiplField v-if="config.animationEnabled" label="Duration (ms)" option="animation">
                    <RiplInputRange
                        v-model="config.animationDuration"
                        :min="0"
                        :max="2000"
                        :step="100"
                    />
                </RiplField>
            </template>
            <slot name="animation"></slot>
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
    ChartConfigFeatures,
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
    /** Per-series / per-segment entries to render color pickers for. */
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

/**
 * Which slot each section exposes for chart-specific controls. A section's own slot name usually
 * matches its feature flag; `dataLabels` is the exception, because the option it drives is `labels`
 * and the slot is named for the option.
 */
const SECTION_SLOTS: Record<keyof ChartConfigFeatures, string> = {
    title: 'title',
    legend: 'legend',
    axes: 'axes',
    axisScale: 'axes',
    grid: 'grid',
    tooltip: 'tooltip',
    crosshair: 'crosshair',
    dataLabels: 'labels',
    annotations: 'annotations',
    navigator: 'navigator',
    format: 'format',
    layout: 'layout',
    theme: 'theme',
    animation: 'animation',
};

/**
 * Whether a section renders: either the shared feature is on, or the demo has put chart-specific
 * controls in that section's slot. The second case is what lets a chart contribute to a category it
 * does not use the shared controls for — a heatmap has no `ChartLegendInput`, but its colour-scale
 * legend controls still belong under **Legend** rather than in a lump of their own.
 */
function shows(feature: keyof ChartConfigFeatures): boolean {
    return !!props.config.features[feature] || !!slots[SECTION_SLOTS[feature]];
}

// The lead (default-open) sections are Options / Colors / Legend. When a chart has none of
// them, open Title instead so the panel never opens fully collapsed.
const hasLeadSection = computed(() => !!slots.default
    || (props.series?.length ?? 0) > 0
    || !!slots.colors
    || shows('legend'));

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
