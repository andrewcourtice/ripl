<template>
    <dashboard-card title="Retention Cohorts">
        <div ref="chartEl" class="dashboard-chart dashboard-chart--wide"></div>
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
    createHeatmapChart,
} from '@ripl/charts';

import DashboardCard from './dashboard-card.vue';
import { useChartContext } from '../composables/use-chart-context';
import { useAnalyticsStore } from '../store/analytics';
import type { RetentionPoint } from '../data/mock';

const store = useAnalyticsStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
let chart: ReturnType<typeof createHeatmapChart<RetentionPoint>> | undefined;

const DEFAULT_READOUT = 'Hover a cell for retention · click to pin';
const hovered = ref('');
const selected = ref('');
const readout = computed(() => hovered.value || selected.value || DEFAULT_READOUT);

function describe(xLabel: string, yLabel: string, value: number): string {
    return `${yLabel} · ${xLabel}: ${value}% retained`;
}

function buildChart() {
    const { data, cohorts, weeks } = store.retentionData;
    if (!context.value || data.length === 0) return;

    const options = {
        data,
        xBy: 'week' as const,
        yBy: 'cohort' as const,
        value: 'retention' as const,
        xCategories: weeks,
        yCategories: cohorts,
        colorRange: ['#dbeafe', '#1d4ed8'] as [string, string],
        borderRadius: 4,
        axis: {
            x: { title: 'Weeks Since Signup' },
            y: { title: 'Cohort' },
        },
        padding: {
            top: 20,
            right: 20,
            bottom: 40,
            left: 70,
        },
    };

    if (chart) {
        chart.update(options);
        return;
    }

    chart = createHeatmapChart(context.value, options);

    chart.on('cellenter', event => {
        hovered.value = describe(event.data.xLabel, event.data.yLabel, event.data.value);
    });
    chart.on('cellleave', () => {
        hovered.value = '';
    });
    chart.on('cellclick', event => {
        selected.value = `Pinned — ${describe(event.data.xLabel, event.data.yLabel, event.data.value)}`;
    });
}

watch(context, () => buildChart());
watch(() => store.retentionData, () => {
    if (chart) {
        const { data, cohorts, weeks } = store.retentionData;
        chart.update({
            data,
            xCategories: weeks,
            yCategories: cohorts,
        });
    } else {
        buildChart();
    }
});
</script>
