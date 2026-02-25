<template>
    <dashboard-card :title="store.marketLabel() + ' Overview'" :loading="store.marketLoading">
        <template #actions>
            <select class="ripl-select" :value="store.marketIndex" @change="onMarketChange">
                <option value="SPY">S&amp;P 500</option>
                <option value="QQQ">NASDAQ</option>
                <option value="DIA">Dow Jones</option>
                <option value="STW.AX">ASX 200</option>
            </select>
            <div class="ripl-control-group">
                <button
                    v-for="range in ranges"
                    :key="range"
                    class="ripl-button"
                    :class="{ 'ripl-button--active': store.marketTimeRange === range }"
                    @click="onRangeChange(range)"
                >{{ range }}</button>
            </div>
        </template>
        <div ref="chartEl" class="dashboard-chart"></div>
    </dashboard-card>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    createLineChart,
} from '@ripl/charts';

import DashboardCard from './dashboard-card.vue';
import { useChartContext } from '../composables/use-chart-context';
import { useDashboardStore } from '../store/dashboard';

import type {
    TimeRange,
} from '../store/dashboard';

const ranges: TimeRange[] = ['7D', '1M', '3M', '6M', '1Y'];
const store = useDashboardStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chart: any;

function buildChart() {
    const data = store.marketData();
    if (!context.value || data.length === 0) return;

    if (chart) {
        chart.update({ data });
        return;
    }

    chart = createLineChart(context.value, {
        data,
        keyBy: 'date',
        padding: {
            top: 20,
            right: 20,
            bottom: 30,
            left: 20,
        },
        series: [
            {
                id: 'close',
                valueBy: 'close',
                labelBy: 'Close',
                lineType: 'monotoneX',
            },
        ],
    });
}

function onMarketChange(ev: Event) {
    const target = ev.target as HTMLSelectElement;
    store.marketIndex = target.value as typeof store.marketIndex;
    store.fetchMarketData().then(() => buildChart());
}

function onRangeChange(range: TimeRange) {
    store.marketTimeRange = range;
    buildChart();
}

watch(context, () => buildChart());
watch(() => store.marketDataRaw, () => buildChart());
</script>
