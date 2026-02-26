<template>
    <dashboard-card title="Feature Adoption">
        <div ref="chartEl" class="dashboard-chart"></div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    createBarChart,
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
    const data = store.featureAdoptionData;
    if (!context.value || data.length === 0) return;

    const options = {
        data,
        keyBy: 'feature' as const,
        padding: {
            top: 20,
            right: 20,
            bottom: 30,
            left: 50,
        },
        showGrid: true,
        showLegend: true,
        mode: 'grouped' as const,
        borderRadius: 4,
        series: [
            {
                id: 'current',
                valueBy: 'currentPeriod' as const,
                label: 'Current Period',
            },
            {
                id: 'previous',
                valueBy: 'previousPeriod' as const,
                label: 'Previous Period',
            },
        ],
    };

    if (chart) {
        chart.update(options);
        return;
    }

    chart = createBarChart(context.value, options);
}

watch(context, () => buildChart());
watch(() => store.featureAdoptionData, () => {
    if (chart) {
        chart.update({
            data: store.featureAdoptionData,
        });
    } else {
        buildChart();
    }
});
</script>
