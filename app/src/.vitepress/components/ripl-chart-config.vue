<template>
    <div class="ripl-chart-config">
        <section v-if="config.features.title" class="ripl-chart-config__section">
            <h4 class="ripl-chart-config__heading">Title</h4>
            <RiplField label="Show title" inline>
                <RiplSwitch v-model="config.titleVisible" />
            </RiplField>
            <RiplField v-if="config.titleVisible" label="Title text">
                <RiplInputText v-model="config.title" placeholder="Chart title" />
            </RiplField>
        </section>

        <section v-if="config.features.legend" class="ripl-chart-config__section">
            <h4 class="ripl-chart-config__heading">Legend</h4>
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
        </section>

        <section v-if="config.features.axes" class="ripl-chart-config__section">
            <h4 class="ripl-chart-config__heading">Axes</h4>
            <RiplField label="Show axes" inline>
                <RiplSwitch v-model="config.axesVisible" />
            </RiplField>
            <RiplField label="X axis title">
                <RiplInputText v-model="config.axisX" placeholder="e.g. Month" />
            </RiplField>
            <RiplField label="Y axis title">
                <RiplInputText v-model="config.axisY" placeholder="e.g. Value" />
            </RiplField>
        </section>

        <section v-if="config.features.grid" class="ripl-chart-config__section">
            <h4 class="ripl-chart-config__heading">Grid</h4>
            <RiplField label="Show grid" inline>
                <RiplSwitch v-model="config.gridVisible" />
            </RiplField>
        </section>

        <section v-if="series && series.length" class="ripl-chart-config__section">
            <h4 class="ripl-chart-config__heading">Colours</h4>
            <RiplField
                v-for="item in series"
                :key="item.id"
                :label="item.label"
                inline
            >
                <RiplColorInput v-model="config.colors[item.id]" />
            </RiplField>
        </section>

        <section v-if="$slots.default" class="ripl-chart-config__section">
            <h4 class="ripl-chart-config__heading">{{ extraTitle }}</h4>
            <slot></slot>
        </section>

        <section v-if="config.features.navigator" class="ripl-chart-config__section">
            <h4 class="ripl-chart-config__heading">Navigation</h4>
            <RiplField label="Pan &amp; zoom" inline>
                <RiplSwitch v-model="config.navigatorEnabled" />
            </RiplField>
            <RiplField v-if="config.navigatorEnabled" label="Zoom sensitivity">
                <RiplInputRange v-model="config.navigatorSensitivity" :min="0.1" :max="2" :step="0.1" />
            </RiplField>
        </section>

        <section v-if="config.features.animation" class="ripl-chart-config__section">
            <h4 class="ripl-chart-config__heading">Animation</h4>
            <RiplField label="Animate" inline>
                <RiplSwitch v-model="config.animationEnabled" />
            </RiplField>
        </section>
    </div>
</template>

<script lang="ts" setup>
import type {
    ChartConfig,
} from '../compositions/use-chart-config';

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

withDefaults(defineProps<{
    config: ChartConfig;
    /** Per-series / per-segment entries to render colour pickers for. */
    series?: ChartConfigSeriesMeta[];
    /** Heading for the chart-specific controls passed via the default slot. */
    extraTitle?: string;
}>(), {
    series: () => [],
    extraTitle: 'Options',
});
</script>

<style scoped>
.ripl-chart-config {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.ripl-chart-config__section {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
}

.ripl-chart-config__heading {
    margin: 0;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--vp-c-text-3);
}
</style>
