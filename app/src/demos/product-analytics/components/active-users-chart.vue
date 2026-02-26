<template>
    <dashboard-card title="Daily Active Users">
        <div ref="chartEl" class="dashboard-chart"></div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    createLineChart,
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
    const data = store.dauData;
    if (!context.value || data.length === 0) return;

    if (chart) {
        chart.update({ data });
        return;
    }

    chart = createLineChart(context.value, {
        data,
        keyBy: 'date',
        padding: {
            top: 20,
            right: 20,
            bottom: 30,
            left: 50,
        },
        showGrid: true,
        series: [
            {
                id: 'users',
                valueBy: 'users',
                labelBy: 'Daily Active Users',
                lineType: 'monotoneX',
                showMarkers: false,
            },
        ],
    });
}

watch(context, () => buildChart());
watch(() => store.dauData, () => {
    if (chart) {
        chart.update({ data: store.dauData });
    } else {
        buildChart();
    }
});
</script>
