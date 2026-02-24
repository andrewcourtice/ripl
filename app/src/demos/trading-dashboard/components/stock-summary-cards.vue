<template>
    <div class="summary-cards">
        <div class="summary-card">
            <span class="summary-card__label">Price</span>
            <span class="summary-card__value">${{ formatNum(latestClose) }}</span>
        </div>
        <div class="summary-card">
            <span class="summary-card__label">Change</span>
            <span class="summary-card__value" :class="changeClass">{{ changeText }}</span>
        </div>
        <div class="summary-card">
            <span class="summary-card__label">Day High</span>
            <span class="summary-card__value">${{ formatNum(latestHigh) }}</span>
        </div>
        <div class="summary-card">
            <span class="summary-card__label">Day Low</span>
            <span class="summary-card__value">${{ formatNum(latestLow) }}</span>
        </div>
        <div class="summary-card">
            <span class="summary-card__label">Volume</span>
            <span class="summary-card__value">{{ formatVolume(latestVolume) }}</span>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
} from 'vue';

import {
    useDashboardStore,
} from '../store/dashboard';

const store = useDashboardStore();

const latestIntraday = computed(() => {
    const data = store.stockIntradayData;
    return data.length > 0 ? data[data.length - 1] : null;
});

const prevIntraday = computed(() => {
    const data = store.stockIntradayData;
    return data.length > 1 ? data[data.length - 2] : null;
});

const latestClose = computed(() => latestIntraday.value?.close ?? 0);
const latestHigh = computed(() => latestIntraday.value?.high ?? 0);
const latestLow = computed(() => latestIntraday.value?.low ?? 0);
const latestVolume = computed(() => latestIntraday.value?.volume ?? 0);

const change = computed(() => {
    if (!latestIntraday.value || !prevIntraday.value) return 0;
    return latestIntraday.value.close - prevIntraday.value.close;
});

const changePct = computed(() => {
    if (!prevIntraday.value || prevIntraday.value.close === 0) return 0;
    return (change.value / prevIntraday.value.close) * 100;
});

const changeClass = computed(() => ({
    'summary-card__value--positive': change.value > 0,
    'summary-card__value--negative': change.value < 0,
}));

const changeText = computed(() => {
    const sign = change.value >= 0 ? '+' : '';
    return `${sign}${formatNum(change.value)} (${sign}${changePct.value.toFixed(2)}%)`;
});

function formatNum(val: number): string {
    return val.toFixed(2);
}

function formatVolume(val: number): string {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(1)}K`;
    return String(val);
}
</script>
