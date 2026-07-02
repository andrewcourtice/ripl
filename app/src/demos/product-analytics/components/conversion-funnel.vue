<template>
    <dashboard-card title="Conversion Funnel">
        <div ref="chartEl" class="dashboard-chart"></div>
        <div class="chart-readout">{{ readout }}</div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    computed,
    ref,
    watch,
} from 'vue';

import {
    createFunnelChart,
} from '@ripl/charts';

import DashboardCard from './dashboard-card.vue';
import { useChartContext } from '../composables/use-chart-context';
import { useAnalyticsStore } from '../store/analytics';
import type { FunnelStagePoint } from '../data/mock';

const store = useAnalyticsStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
let chart: ReturnType<typeof createFunnelChart<FunnelStagePoint>> | undefined;

const DEFAULT_READOUT = 'Hover a stage · click to pin';
const hovered = ref('');
const selected = ref('');
const readout = computed(() => hovered.value || selected.value || DEFAULT_READOUT);

// Read the current top-of-funnel value each call so the percentage stays correct after the
// data updates (the event handlers below are wired once, at creation).
function describe(label: string, value: number): string {
    const total = store.funnelData[0]?.value ?? 0;
    const pct = total > 0 ? Math.round(value / total * 100) : 0;
    return `${label}: ${value.toLocaleString()} (${pct}% of top)`;
}

function buildChart() {
    const data = store.funnelData;
    if (!context.value || data.length === 0) return;

    const options = {
        data,
        key: 'stage' as const,
        value: 'value' as const,
        label: 'stage' as const,
        gap: 4,
        borderRadius: 4,
        format: 'number' as const,
        padding: {
            top: 20,
            right: 40,
            bottom: 20,
            left: 40,
        },
    };

    if (chart) {
        chart.update(options);
        return;
    }

    chart = createFunnelChart(context.value, options);

    chart.on('segmententer', event => {
        hovered.value = describe(event.data.label, event.data.value);
    });
    chart.on('segmentleave', () => {
        hovered.value = '';
    });
    chart.on('segmentclick', event => {
        selected.value = `Pinned — ${describe(event.data.label, event.data.value)}`;
    });
}

watch(context, () => buildChart());
watch(() => store.funnelData, () => {
    if (chart) {
        chart.update({ data: store.funnelData });
    } else {
        buildChart();
    }
});
</script>
