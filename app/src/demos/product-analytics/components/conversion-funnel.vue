<template>
    <dashboard-card title="Conversion Funnel">
        <div ref="chartEl" class="dashboard-chart"></div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    createFunnelChart,
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
    const data = store.funnelData;
    if (!context.value || data.length === 0) return;

    const options = {
        data,
        key: 'stage' as const,
        value: 'value' as const,
        label: 'stage' as const,
        gap: 4,
        borderRadius: 4,
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
