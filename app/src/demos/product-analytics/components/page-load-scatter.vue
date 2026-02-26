<template>
    <dashboard-card title="Page Load Time vs Views">
        <div ref="chartEl" class="dashboard-chart"></div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    createScatterChart,
} from '@ripl/charts';

import DashboardCard from './dashboard-card.vue';
import { useChartContext } from '../composables/use-chart-context';
import { useAnalyticsStore } from '../store/analytics';

const store = useAnalyticsStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chart: any;

function buildChart() {
    const data = store.pageLoadData;
    if (!context.value || data.length === 0) return;

    const options = {
        data,
        keyBy: 'page' as const,
        showGrid: true,
        showCrosshair: true,
        xAxisLabel: 'Load Time (ms)',
        yAxisLabel: 'Page Views',
        formatXLabel: (v: number) => `${Math.round(v)}ms`,
        formatYLabel: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v)),
        padding: {
            top: 20,
            right: 20,
            bottom: 40,
            left: 60,
        },
        series: [
            {
                id: 'pages',
                xBy: 'loadTime' as const,
                yBy: 'views' as const,
                labelBy: 'Pages',
                minRadius: 5,
                maxRadius: 12,
            },
        ],
    };

    if (chart) {
        chart.update(options);
        return;
    }

    chart = createScatterChart(context.value, options);
}

watch(context, () => buildChart());
watch(() => store.pageLoadData, () => {
    if (chart) {
        chart.update({ data: store.pageLoadData });
    } else {
        buildChart();
    }
});
</script>
