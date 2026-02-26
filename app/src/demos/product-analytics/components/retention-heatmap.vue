<template>
    <dashboard-card title="Retention Cohorts">
        <div ref="chartEl" class="dashboard-chart dashboard-chart--wide"></div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    createHeatmapChart,
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
    const { data, cohorts, weeks } = store.retentionData;
    if (!context.value || data.length === 0) return;

    const options = {
        data,
        xBy: 'week' as const,
        yBy: 'cohort' as const,
        valueBy: 'retention' as const,
        xCategories: weeks,
        yCategories: cohorts,
        colorRange: ['#dbeafe', '#1d4ed8'] as [string, string],
        borderRadius: 4,
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
