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
import { useChartContext } from '../composables/use-chart-context';
import { useDashboardStore } from '../store/dashboard';

const store = useDashboardStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chart: any;

function buildChart() {
    const data = store.stockIntradayData;
    if (!context.value || data.length === 0) return;

    if (chart) {
        chart.update({ data });
        return;
    }

    chart = createStockChart(context.value, {
        data,
        keyBy: 'datetime',
        openBy: 'open',
        highBy: 'high',
        lowBy: 'low',
        closeBy: 'close',
        volumeBy: 'volume',
        showVolume: true,
        padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        },
        formatXLabel: (val: string) => {
            const parts = val.split(' ');
            return parts.length > 1 ? parts[1].slice(0, 5) : val;
        },
    });
}

watch(context, () => buildChart());
watch(() => store.stockIntradayData, () => buildChart());
</script>
