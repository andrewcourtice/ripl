<template>
    <dashboard-card :title="store.commodityLabel()" :loading="store.commodityLoading">
        <template #actions>
            <RiplSelect :modelValue="store.commodity" @update:modelValue="onCommodityChange">
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="WTI">Crude Oil (WTI)</option>
                <option value="BRENT">Brent Crude</option>
            </RiplSelect>
            <RiplButtonGroup :modelValue="store.commodityTimeRange" @update:modelValue="onRangeChange($event as TimeRange)" :options="rangeOptions" />
        </template>
        <div ref="chartEl" class="dashboard-chart"></div>
        <div class="chart-readout">{{ readout }}</div>
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

import {
    createDevtools,
} from '@ripl/devtools';

import RiplSelect from '../../../.vitepress/components/ripl-select.vue';
import RiplButtonGroup from '../../../.vitepress/components/ripl-button-group.vue';
import DashboardCard from './dashboard-card.vue';

import {
    useChartContext,
} from '../composables/use-chart-context';

import {
    useDashboardStore,
} from '../store/dashboard';

import type {
    MockCommodityPoint,
} from '../data/mock';

import type {
    CommodityType,
    TimeRange,
} from '../store/dashboard';

const ranges: TimeRange[] = ['1M', '3M', '6M', '1Y'];
const rangeOptions = ranges.map(r => ({
    label: r,
    value: r,
}));
const store = useDashboardStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
let chart: ReturnType<typeof createLineChart<MockCommodityPoint>> | undefined;

const DEFAULT_READOUT = 'Hover a point for the price on that day';
const readout = ref(DEFAULT_READOUT);

function buildChart() {
    const data = store.commodityData();
    if (!context.value || data.length === 0) return;

    const series = [
        {
            id: 'value',
            value: 'value' as const,
            label: store.commodityLabel(),
            lineType: 'monotoneX' as const,
        },
    ];

    if (chart) {
        chart.update({
            data,
            series,
        });
        return;
    }

    chart = createLineChart(context.value, {
        data,
        key: 'date',
        format: (value: number) => `$${value.toFixed(2)}`,
        padding: { bottom: 30 },
        series,
    });

    createDevtools(chart.context, chart.scene, chart.renderer, {
        label: 'Commodity chart',
    });

    chart.on('markerenter', event => {
        readout.value = `${event.data.xValue} · ${store.commodityLabel()}: $${event.data.yValue.toFixed(2)}`;
    });
    chart.on('markerleave', () => {
        readout.value = DEFAULT_READOUT;
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
