<template>
    <dashboard-card title="Feature Adoption">
        <div ref="chartEl" class="dashboard-chart"></div>
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
    createBarChart,
} from '@ripl/charts';

import DashboardCard from './dashboard-card.vue';

import {
    useChartContext,
} from '../composables/use-chart-context';

import {
    useAnalyticsStore,
} from '../store/analytics';

import type {
    FeatureAdoptionPoint,
} from '../data/mock';

const store = useAnalyticsStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
let chart: ReturnType<typeof createBarChart<FeatureAdoptionPoint>> | undefined;

const DEFAULT_READOUT = 'Hover a bar for adoption counts · click to pin';
const hovered = ref('');
const selected = ref('');
const readout = computed(() => hovered.value || selected.value || DEFAULT_READOUT);

function seriesLabel(seriesId: string): string {
    return seriesId === 'previous' ? 'Previous' : 'Current';
}

function describe(feature: string, seriesId: string, value: number): string {
    return `${feature} · ${seriesLabel(seriesId)}: ${value.toLocaleString()} users`;
}

function buildChart() {
    const data = store.featureAdoptionData;
    if (!context.value || data.length === 0) return;

    const options = {
        data,
        key: 'feature' as const,
        padding: {
            top: 16,
            right: 16,
            bottom: 16,
            left: 12,
        },
        grid: true,
        legend: true,
        mode: 'grouped' as const,
        borderRadius: 4,
        // Show the count on top of each bar, and format axis/tooltip values as whole numbers.
        labels: true,
        format: 'number' as const,
        series: [
            {
                id: 'current',
                value: 'currentPeriod' as const,
                label: 'Current Period',
            },
            {
                id: 'previous',
                value: 'previousPeriod' as const,
                label: 'Previous Period',
            },
        ],
    };

    if (chart) {
        chart.update(options);
        return;
    }

    chart = createBarChart(context.value, options);

    chart.on('barenter', event => {
        hovered.value = describe(event.data.xValue, event.data.seriesId, event.data.yValue);
    });
    chart.on('barleave', () => {
        hovered.value = '';
    });
    chart.on('barclick', event => {
        selected.value = `Pinned — ${describe(event.data.xValue, event.data.seriesId, event.data.yValue)}`;
    });
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
