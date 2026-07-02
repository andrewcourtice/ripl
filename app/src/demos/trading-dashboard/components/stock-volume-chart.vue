<template>
    <dashboard-card title="Volume" :loading="store.stockLoading">
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
import { useChartContext } from '../composables/use-chart-context';
import { useDashboardStore } from '../store/dashboard';
import type { MockDailyPoint } from '../data/mock';

const store = useDashboardStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
let chart: ReturnType<typeof createBarChart<MockDailyPoint>> | undefined;

const DEFAULT_READOUT = 'Hover a bar for the day’s volume · click to pin';
const hovered = ref('');
const selected = ref('');
const readout = computed(() => hovered.value || selected.value || DEFAULT_READOUT);

function formatVolume(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return String(Math.round(value));
}

function buildChart() {
    const data = store.stockDailyData();
    if (!context.value || data.length === 0) return;

    if (chart) {
        chart.update({ data });
        return;
    }

    chart = createBarChart(context.value, {
        data,
        key: 'date',
        format: formatVolume,
        padding: {
            top: 20,
            right: 20,
            bottom: 30,
            left: 20,
        },
        series: [
            {
                id: 'volume',
                value: 'volume',
                label: 'Volume',
            },
        ],
    });

    chart.on('barenter', event => {
        hovered.value = `${event.data.xValue}: ${formatVolume(event.data.yValue)}`;
    });
    chart.on('barleave', () => {
        hovered.value = '';
    });
    chart.on('barclick', event => {
        selected.value = `Pinned — ${event.data.xValue}: ${formatVolume(event.data.yValue)}`;
    });
}

watch(context, () => buildChart());
watch(() => store.stockDailyDataRaw, () => buildChart());
</script>
