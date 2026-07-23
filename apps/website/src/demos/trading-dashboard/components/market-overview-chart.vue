<template>
    <dashboard-card :title="store.marketLabel() + ' Overview'" :loading="store.marketLoading">
        <template #actions>
            <RiplSelect :modelValue="store.marketIndex" @update:modelValue="onMarketChange">
                <option value="SPY">S&amp;P 500</option>
                <option value="QQQ">NASDAQ</option>
                <option value="DIA">Dow Jones</option>
                <option value="STW.AX">ASX 200</option>
            </RiplSelect>
            <RiplButtonGroup :modelValue="store.marketTimeRange" @update:modelValue="onRangeChange($event as TimeRange)" :options="rangeOptions" />
        </template>
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

import {
    withMovingAverage,
} from '../data/mock';

import type {
    MockDailyPoint,
} from '../data/mock';

import type {
    TimeRange,
} from '../store/dashboard';

type MarketDatum = MockDailyPoint & { ma: number };

const ranges: TimeRange[] = ['7D', '1M', '3M', '6M', '1Y'];
const rangeOptions = ranges.map(r => ({
    label: r,
    value: r,
}));
const store = useDashboardStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
let chart: ReturnType<typeof createLineChart<MarketDatum>> | undefined;

const DEFAULT_READOUT = 'Hover a point · toggle a legend series to highlight it';
const hovered = ref('');
const selected = ref('');
const readout = computed(() => hovered.value || selected.value || DEFAULT_READOUT);

function describe(seriesId: string, xValue: string, yValue: number): string {
    const label = seriesId === 'ma' ? '7-day avg' : 'Close';
    return `${xValue} · ${label}: $${yValue.toFixed(2)}`;
}

function buildChart() {
    const data = withMovingAverage(store.marketData());
    if (!context.value || data.length === 0) return;

    if (chart) {
        chart.update({ data });
        return;
    }

    chart = createLineChart(context.value, {
        data,
        key: 'date',
        format: (value: number) => `$${value.toFixed(2)}`,
        padding: {
            top: 20,
            right: 20,
            bottom: 30,
            left: 20,
        },
        series: [
            {
                id: 'close',
                value: 'close',
                label: 'Close',
                lineType: 'monotoneX',
            },
            {
                id: 'ma',
                value: 'ma',
                label: '7-Day Average',
                lineType: 'monotoneX',
                markers: false,
            },
        ],
    });

    createDevtools(chart.context, chart.scene, chart.renderer, {
        label: 'Market overview chart',
    });

    chart.on('markerenter', event => {
        hovered.value = describe(event.data.seriesId, event.data.xValue, event.data.yValue);
    });
    chart.on('markerleave', () => {
        hovered.value = '';
    });
    chart.on('markerclick', event => {
        selected.value = `Pinned: ${describe(event.data.seriesId, event.data.xValue, event.data.yValue)}`;
    });
}

function onMarketChange(value: string) {
    store.marketIndex = value as typeof store.marketIndex;
    store.fetchMarketData().then(() => buildChart());
}

function onRangeChange(range: TimeRange) {
    store.marketTimeRange = range;
    buildChart();
}

watch(context, () => buildChart());
watch(() => store.marketDataRaw, () => buildChart());
</script>
