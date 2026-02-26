<template>
    <dashboard-card title="Error Rate">
        <div ref="chartEl" class="dashboard-chart"></div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    createGaugeChart,
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
    const value = store.errorRate;
    if (!context.value) return;

    const options = {
        value,
        min: 0,
        max: 5,
        label: 'Error Rate',
        color: value > 3 ? '#dc2626' : value > 1.5 ? '#f59e0b' : '#16a34a',
        formatValue: (v: number) => `${v.toFixed(2)}%`,
        tickCount: 5,
        showTickLabels: true,
        formatTickLabel: (v: number) => `${v}%`,
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

    chart = createGaugeChart(context.value, options);
}

watch(context, () => buildChart());
watch(() => store.errorRate, () => {
    if (chart) {
        const value = store.errorRate;
        chart.update({
            value,
            color: value > 3 ? '#dc2626' : value > 1.5 ? '#f59e0b' : '#16a34a',
        });
    } else {
        buildChart();
    }
});
</script>
