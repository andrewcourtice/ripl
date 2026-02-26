<template>
    <dashboard-card title="Browser Share">
        <div ref="chartEl" class="dashboard-chart"></div>
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
import { useChartContext } from '../composables/use-chart-context';
import { useAnalyticsStore } from '../store/analytics';

const store = useAnalyticsStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chart: any;

function buildChart() {
    const data = store.browserShareData;
    if (!context.value || data.length === 0) return;

    const options = {
        data,
        key: 'browser' as const,
        value: 'share' as const,
        label: 'browser' as const,
        innerRadius: 0.55,
        showLegend: true,
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
