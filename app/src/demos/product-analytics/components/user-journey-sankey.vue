<template>
    <dashboard-card title="User Journeys">
        <div ref="chartEl" class="dashboard-chart dashboard-chart--wide"></div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    createSankeyChart,
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
    const { nodes, links } = store.sankeyData;
    if (!context.value || nodes.length === 0) return;

    const options = {
        nodes,
        links,
        nodeWidth: 18,
        nodePadding: 14,
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

    chart = createSankeyChart(context.value, options);
}

watch(context, () => buildChart());
watch(() => store.sankeyData, () => {
    if (chart) {
        const { nodes, links } = store.sankeyData;
        chart.update({ nodes, links });
    } else {
        buildChart();
    }
});
</script>
