<template>
    <dashboard-card title="Error Rate">
        <div ref="chartEl" class="dashboard-chart"></div>
        <div class="chart-readout">{{ readout }}</div>
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

import {
    useChartContext,
} from '../composables/use-chart-context';

import {
    useAnalyticsStore,
} from '../store/analytics';

const store = useAnalyticsStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
let chart: ReturnType<typeof createGaugeChart> | undefined;

const DEFAULT_READOUT = 'Hover the gauge for the current rate';
const readout = ref(DEFAULT_READOUT);

function errorColor(rate: number): string {
    if (rate > 3) {
        return '#dc2626';
    }

    if (rate > 1.5) {
        return '#f59e0b';
    }

    return '#16a34a';
}

function buildChart() {
    const value = store.errorRate;
    if (!context.value) return;

    const options = {
        value,
        minValue: 0,
        maxValue: 5,
        label: 'Error Rate',
        color: errorColor(value),
        format: (v: number) => `${v.toFixed(2)}%`,
        tickCount: 5,
        showTickLabels: true,
        formatTick: (v: number) => `${v}%`,
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

    chart.on('valueenter', event => {
        readout.value = `Current error rate: ${event.data.value.toFixed(2)}%`;
    });
    chart.on('valueleave', () => {
        readout.value = DEFAULT_READOUT;
    });
}

watch(context, () => buildChart());
watch(() => store.errorRate, () => {
    if (chart) {
        const value = store.errorRate;
        chart.update({
            value,
            color: errorColor(value),
        });
    } else {
        buildChart();
    }
});
</script>
