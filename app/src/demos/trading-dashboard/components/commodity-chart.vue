<template>
    <dashboard-card :title="store.commodityLabel()" :loading="store.commodityLoading">
        <template #actions>
            <RiplSelect :modelValue="store.commodity" @update:modelValue="onCommodityChange">
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="WTI">Crude Oil (WTI)</option>
                <option value="BRENT">Brent Crude</option>
            </RiplSelect>
            <RiplButtonGroup>
                <RiplButton
                    v-for="range in ranges"
                    :key="range"
                    :active="store.commodityTimeRange === range"
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

import RiplSelect from '../../../.vitepress/components/RiplSelect.vue';
import RiplButton from '../../../.vitepress/components/RiplButton.vue';
import RiplButtonGroup from '../../../.vitepress/components/RiplButtonGroup.vue';
import DashboardCard from './dashboard-card.vue';
import { useChartContext } from '../composables/use-chart-context';
import { useDashboardStore } from '../store/dashboard';

import type {
    CommodityType,
    TimeRange,
} from '../store/dashboard';

const ranges: TimeRange[] = ['1M', '3M', '6M', '1Y'];
const store = useDashboardStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let chart: any;

function buildChart() {
    const data = store.commodityData();
    if (!context.value || data.length === 0) return;

    const series = [
        {
            id: 'value',
            valueBy: 'value' as const,
            labelBy: store.commodityLabel(),
            lineType: 'monotoneX' as const,
        },
    ];

    if (chart) {
        chart.update({ data, series });
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
        series,
    });
}

function onCommodityChange(value: string) {
    store.commodity = value as CommodityType;
    store.fetchCommodityData().then(() => buildChart());
}

function onRangeChange(range: TimeRange) {
    store.commodityTimeRange = range;
    buildChart();
}

watch(context, () => buildChart());
watch(() => store.commodityDataRaw, () => buildChart());
</script>
