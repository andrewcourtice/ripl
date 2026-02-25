<template>
    <div class="trading-dashboard">
        <div class="trading-dashboard__header">
            <h1 class="trading-dashboard__title">Trading Dashboard</h1>
            <p class="trading-dashboard__subtitle">Live market data powered by Alpha Vantage</p>
        </div>
        <div class="trading-dashboard__top">
            <div class="trading-dashboard__market">
                <market-overview-chart />
            </div>
            <div class="trading-dashboard__commodity">
                <commodity-chart />
            </div>
        </div>

        <div class="trading-dashboard__search">
            <symbol-search />
        </div>

        <div class="trading-dashboard__stock">
            <div class="trading-dashboard__summary">
                <stock-summary-cards />
            </div>
            <div class="trading-dashboard__candlestick">
                <stock-candlestick />
            </div>
            <div class="trading-dashboard__stock-charts">
                <div class="trading-dashboard__history">
                    <stock-history-chart />
                </div>
                <div class="trading-dashboard__volume">
                    <stock-volume-chart />
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    onMounted,
} from 'vue';

import {
    useDashboardStore,
} from './store/dashboard';

import CommodityChart from './components/commodity-chart.vue';
import MarketOverviewChart from './components/market-overview-chart.vue';
import StockCandlestick from './components/stock-candlestick.vue';
import StockHistoryChart from './components/stock-history-chart.vue';
import StockSummaryCards from './components/stock-summary-cards.vue';
import StockVolumeChart from './components/stock-volume-chart.vue';
import SymbolSearch from './components/symbol-search.vue';

const store = useDashboardStore();

onMounted(() => {
    store.init();
});
</script>
