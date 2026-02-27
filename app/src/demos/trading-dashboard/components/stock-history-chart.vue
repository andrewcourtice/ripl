<template>
    <dashboard-card title="Historical Performance" :loading="store.stockLoading">
        <template #actions>
            <RiplButtonGroup>
                <RiplButton
                    v-for="range in ranges"
                    :key="range"
                    :active="store.stockTimeRange === range"
                    @click="onRangeChange(range)"
                >{{ range }}</RiplButton>
            </RiplButtonGroup>
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

import RiplButton from '../../../.vitepress/components/RiplButton.vue';
import RiplButtonGroup from '../../../.vitepress/components/RiplButtonGroup.vue';
import DashboardCard from './dashboard-card.vue';
import { useChartContext } from '../composables/use-chart-context';
import { useDashboardStore } from '../store/dashboard';

import type {
    TimeRange,
} from '../store/dashboard';

const ranges: TimeRange[] = ['1M', '3M', '6M', '1Y'];
const store = useDashboardStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chart: any;

function buildChart() {
    const data = store.stockDailyData();
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

function onRangeChange(range: TimeRange) {
    store.stockTimeRange = range;
    buildChart();
}

watch(context, () => buildChart());
watch(() => store.stockDailyDataRaw, () => buildChart());
</script>
