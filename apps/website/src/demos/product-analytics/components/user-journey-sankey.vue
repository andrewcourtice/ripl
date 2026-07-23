<template>
    <dashboard-card title="User Journeys">
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
    createSankeyChart,
} from '@ripl/charts';

import {
    createDevtools,
} from '@ripl/devtools';

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
let chart: ReturnType<typeof createSankeyChart> | undefined;

const DEFAULT_READOUT = 'Hover a node or flow · click a flow to pin';
const hovered = ref('');
const selected = ref('');
const readout = computed(() => hovered.value || selected.value || DEFAULT_READOUT);

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

    chart.on('nodeenter', event => {
        hovered.value = `${event.data.label}: ${event.data.value.toLocaleString()} users`;
    });

    createDevtools(chart.context, chart.scene, chart.renderer, {
        label: 'User journey sankey',
    });
    chart.on('nodeleave', () => {
        hovered.value = '';
    });
    chart.on('linkenter', event => {
        hovered.value = `${event.data.sourceLabel} → ${event.data.targetLabel}: ${event.data.value.toLocaleString()} users`;
    });
    chart.on('linkleave', () => {
        hovered.value = '';
    });
    chart.on('linkclick', event => {
        selected.value = `Pinned: ${event.data.sourceLabel} → ${event.data.targetLabel}: ${event.data.value.toLocaleString()} users`;
    });
}

watch(context, () => buildChart());
watch(() => store.sankeyData, () => {
    if (chart) {
        const { nodes, links } = store.sankeyData;
        chart.update({
            nodes,
            links,
        });
    } else {
        buildChart();
    }
});
</script>
