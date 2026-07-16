<template>
    <dashboard-card title="Browser Share">
        <div ref="chartEl" class="dashboard-chart dashboard-chart--square"></div>
        <div class="chart-readout">{{ readout }}</div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    createPieChart,
} from '@ripl/charts';

import DashboardCard from './dashboard-card.vue';

import {
    useChartContext,
} from '../composables/use-chart-context';

import {
    useAnalyticsStore,
} from '../store/analytics';

import type {
    BrowserSharePoint,
} from '../data/mock';

const store = useAnalyticsStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
let chart: ReturnType<typeof createPieChart<BrowserSharePoint>> | undefined;

const DEFAULT_READOUT = 'Hover a segment to see its share';
const readout = ref(DEFAULT_READOUT);

function buildChart() {
    const data = store.browserShareData;
    if (!context.value || data.length === 0) return;

    const options = {
        data,
        key: 'browser' as const,
        value: 'share' as const,
        label: 'browser' as const,
        innerRadius: 0.55,
        legend: true,
        // Values are already a 0–100 percentage, so append a literal `%` rather than
        // re-percentaging via the built-in 'percentage' formatter.
        format: (value: number) => `${value}%`,
        // Leader-line labels sit outside the donut and animate with their connectors.
        labels: 'outside' as const,
        padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        },
    };

    if (chart) {
        chart.update(options);
        return;
    }

    chart = createPieChart(context.value, options);

    chart.on('segmententer', event => {
        readout.value = `${event.data.label}: ${event.data.value}% of sessions`;
    });
    chart.on('segmentleave', () => {
        readout.value = DEFAULT_READOUT;
    });
}

watch(context, () => buildChart());
watch(() => store.browserShareData, () => {
    if (chart) {
        chart.update({ data: store.browserShareData });
    } else {
        buildChart();
    }
});
</script>
