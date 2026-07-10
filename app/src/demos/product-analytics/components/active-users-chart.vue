<template>
    <dashboard-card title="Daily Active Users">
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

import DashboardCard from './dashboard-card.vue';
import { useChartContext } from '../composables/use-chart-context';
import { useAnalyticsStore } from '../store/analytics';
import type { DailyActiveUsersPoint } from '../data/mock';

type ActiveUsersDatum = DailyActiveUsersPoint & { ma: number };

const store = useAnalyticsStore();
const chartEl = ref<HTMLElement>();
const context = useChartContext(chartEl);
let chart: ReturnType<typeof createLineChart<ActiveUsersDatum>> | undefined;

const DEFAULT_READOUT = 'Hover a point · toggle a legend series to highlight it';
const hovered = ref('');
const selected = ref('');
const readout = computed(() => hovered.value || selected.value || DEFAULT_READOUT);

// Trailing simple moving average, exposed as a second series so the legend appears and its
// hover-highlight can dim the raw line.
function withMovingAverage(data: DailyActiveUsersPoint[], window = 7): ActiveUsersDatum[] {
    return data.map((item, index) => {
        const slice = data.slice(Math.max(0, index - window + 1), index + 1);
        const avg = slice.reduce((sum, entry) => sum + entry.users, 0) / slice.length;
        return { ...item, ma: Math.round(avg) };
    });
}

function describe(seriesId: string, xValue: string, yValue: number): string {
    const label = seriesId === 'ma' ? '7-day avg' : 'Daily active users';
    return `${xValue} · ${label}: ${Math.round(yValue).toLocaleString()}`;
}

function buildChart() {
    const data = withMovingAverage(store.dauData);
    if (!context.value || data.length === 0) return;

    if (chart) {
        chart.update({ data });
        return;
    }

    chart = createLineChart(context.value, {
        data,
        key: 'date',
        format: 'number',
        padding: {
            top: 16,
            right: 16,
            bottom: 16,
            left: 12,
        },
        grid: true,
        series: [
            {
                id: 'users',
                value: 'users',
                label: 'Daily Active Users',
                lineType: 'monotoneX',
                markers: true,
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

    chart.on('markerenter', event => {
        hovered.value = describe(event.data.seriesId, event.data.xValue, event.data.yValue);
    });
    chart.on('markerleave', () => {
        hovered.value = '';
    });
    chart.on('markerclick', event => {
        selected.value = `Pinned — ${describe(event.data.seriesId, event.data.xValue, event.data.yValue)}`;
    });
}

watch(context, () => buildChart());
watch(() => store.dauData, () => {
    if (chart) {
        chart.update({ data: withMovingAverage(store.dauData) });
    } else {
        buildChart();
    }
});
</script>
