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

// The candle currently hovered/selected in the candlestick chart, falling back to the most recent
// point when nothing is active — so the cards reflect whatever candle the user is inspecting.
const activeIndex = computed(() => {
    const data = store.stockIntradayData;
    if (data.length === 0) return -1;

    const key = store.selectedCandleKey;
    if (key) {
        const index = data.findIndex(point => point.datetime === key);
        if (index >= 0) return index;
    }

    return data.length - 1;
});

const activeIntraday = computed(() => {
    const data = store.stockIntradayData;
    return activeIndex.value >= 0 ? data[activeIndex.value] : null;
});

const prevIntraday = computed(() => {
    const data = store.stockIntradayData;
    return activeIndex.value > 0 ? data[activeIndex.value - 1] : null;
});

const latestClose = computed(() => activeIntraday.value?.close ?? 0);
const latestHigh = computed(() => activeIntraday.value?.high ?? 0);
const latestLow = computed(() => activeIntraday.value?.low ?? 0);
const latestVolume = computed(() => activeIntraday.value?.volume ?? 0);

const change = computed(() => {
    if (!activeIntraday.value || !prevIntraday.value) return 0;
    return activeIntraday.value.close - prevIntraday.value.close;
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
