<template>
    <dashboard-card title="Intraday" :loading="store.stockLoading">
        <div ref="chartEl" class="dashboard-chart"></div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    createStockChart,
} from '@ripl/charts';

import DashboardCard from './dashboard-card.vue';

import {
    useChartContext,
} from '../composables/use-chart-context';

import {
    useDashboardStore,
} from '../store/dashboard';

import type {
    MockIntradayPoint,
} from '../data/mock';

const store = useDashboardStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
let chart: ReturnType<typeof createStockChart<MockIntradayPoint>> | undefined;

function buildChart() {
    const data = store.stockIntradayData;
    if (!context.value || data.length === 0) return;

    if (chart) {
        chart.update({ data });
        return;
    }

    chart = createStockChart(context.value, {
        data,
        key: 'datetime',
        open: 'open',
        high: 'high',
        low: 'low',
        close: 'close',
        volume: 'volume',
        showVolume: true,
        upColor: '#16a34a',
        downColor: '#dc2626',
        padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        },
        axis: {
            x: {
                format: (val: string) => {
                    const parts = val.split(' ');
                    return parts.length > 1 ? parts[1].slice(0, 5) : val;
                },
            },
            y: {
                format: (val: number) => `$${val.toFixed(2)}`,
            },
        },
    });

    // Drive the summary cards from the hovered/selected candle; clear back to the latest on leave.
    chart.on('candleenter', event => store.setSelectedCandle(event.data.key));
    chart.on('candleclick', event => store.setSelectedCandle(event.data.key));
    chart.on('candleleave', () => store.setSelectedCandle(null));
}

watch(context, () => buildChart());
watch(() => store.stockIntradayData, () => buildChart());
</script>
