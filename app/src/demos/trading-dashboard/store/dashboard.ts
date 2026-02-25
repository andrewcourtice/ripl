import {
    defineStore,
} from 'pinia';

import {
    ref,
} from 'vue';

import {
    fetchCrudeOil,
    fetchDailyTimeSeries,
    fetchGoldSilverHistory,
    fetchIntradayTimeSeries,
    fetchSymbolSearch,
} from '../composables/use-alphavantage';

import {
    generateMockCommodityData,
    generateMockDailyData,
    generateMockIntradayData,
    MOCK_PRICES,
} from '../data/mock';

import type {
    MockCommodityPoint,
    MockDailyPoint,
    MockIntradayPoint,
    MockSearchResult,
} from '../data/mock';

export type TimeRange = '7D' | '1M' | '3M' | '6M' | '1Y';
export type MarketIndex = 'SPY' | 'QQQ' | 'DIA' | 'STW.AX';
export type CommodityType = 'GOLD' | 'SILVER' | 'WTI' | 'BRENT';

const MARKET_LABELS: Record<MarketIndex, string> = {
    SPY: 'S&P 500',
    QQQ: 'NASDAQ',
    DIA: 'Dow Jones',
    'STW.AX': 'ASX 200',
};

const COMMODITY_LABELS: Record<CommodityType, string> = {
    GOLD: 'Gold',
    SILVER: 'Silver',
    WTI: 'Crude Oil (WTI)',
    BRENT: 'Brent Crude',
};

function daysForRange(range: TimeRange): number {
    switch (range) {
        case '7D': return 7;
        case '1M': return 30;
        case '3M': return 90;
        case '6M': return 180;
        case '1Y': return 365;
        default: return 30;
    }
}

function sliceByRange<T extends { date: string }>(data: T[], range: TimeRange): T[] {
    const days = daysForRange(range);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return data.filter(item => item.date >= cutoffStr);
}

export const useDashboardStore = defineStore('trading-dashboard', () => {
    const selectedSymbol = ref('AAPL');
    const selectedSymbolName = ref('Apple Inc');
    const marketIndex = ref<MarketIndex>('SPY');
    const marketTimeRange = ref<TimeRange>('1M');
    const commodity = ref<CommodityType>('GOLD');
    const commodityTimeRange = ref<TimeRange>('1M');
    const stockTimeRange = ref<TimeRange>('1M');

    const marketDataRaw = ref<MockDailyPoint[]>([]);
    const commodityDataRaw = ref<MockCommodityPoint[]>([]);
    const stockDailyDataRaw = ref<MockDailyPoint[]>([]);
    const stockIntradayData = ref<MockIntradayPoint[]>([]);
    const searchResults = ref<MockSearchResult[]>([]);

    const marketLoading = ref(false);
    const commodityLoading = ref(false);
    const stockLoading = ref(false);
    const searchLoading = ref(false);

    function marketLabel(): string {
        return MARKET_LABELS[marketIndex.value] ?? marketIndex.value;
    }

    function commodityLabel(): string {
        return COMMODITY_LABELS[commodity.value] ?? commodity.value;
    }

    function marketData(): MockDailyPoint[] {
        return sliceByRange(marketDataRaw.value, marketTimeRange.value);
    }

    function commodityData(): MockCommodityPoint[] {
        return sliceByRange(commodityDataRaw.value, commodityTimeRange.value);
    }

    function stockDailyData(): MockDailyPoint[] {
        return sliceByRange(stockDailyDataRaw.value, stockTimeRange.value);
    }

    async function fetchMarketData() {
        marketLoading.value = true;
        try {
            marketDataRaw.value = await fetchDailyTimeSeries(marketIndex.value);
        } catch {
            marketDataRaw.value = generateMockDailyData(100, MOCK_PRICES[marketIndex.value] ?? 450);
        } finally {
            marketLoading.value = false;
        }
    }

    async function fetchCommodityData() {
        commodityLoading.value = true;
        try {
            if (commodity.value === 'GOLD' || commodity.value === 'SILVER') {
                commodityDataRaw.value = await fetchGoldSilverHistory(commodity.value);
            } else {
                commodityDataRaw.value = await fetchCrudeOil(commodity.value);
            }
        } catch {
            let base = 78;
            if (commodity.value === 'GOLD') base = 2340;
            else if (commodity.value === 'SILVER') base = 29.5;
            commodityDataRaw.value = generateMockCommodityData(100, base);
        } finally {
            commodityLoading.value = false;
        }
    }

    async function fetchStockData() {
        stockLoading.value = true;
        try {
            const [daily, intraday] = await Promise.all([
                fetchDailyTimeSeries(selectedSymbol.value),
                fetchIntradayTimeSeries(selectedSymbol.value),
            ]);
            stockDailyDataRaw.value = daily;
            stockIntradayData.value = intraday;
        } catch {
            const base = MOCK_PRICES[selectedSymbol.value] ?? 200;
            stockDailyDataRaw.value = generateMockDailyData(100, base);
            stockIntradayData.value = generateMockIntradayData(78, base);
        } finally {
            stockLoading.value = false;
        }
    }

    async function searchSymbols(keywords: string) {
        if (!keywords || keywords.length < 1) {
            searchResults.value = [];
            return;
        }
        searchLoading.value = true;
        try {
            searchResults.value = await fetchSymbolSearch(keywords);
        } finally {
            searchLoading.value = false;
        }
    }

    function selectSymbol(symbol: string, name: string) {
        selectedSymbol.value = symbol;
        selectedSymbolName.value = name;
        searchResults.value = [];
        fetchStockData();
    }

    async function init() {
        await Promise.all([
            fetchMarketData(),
            fetchCommodityData(),
            fetchStockData(),
        ]);
    }

    return {
        selectedSymbol,
        selectedSymbolName,
        marketIndex,
        marketTimeRange,
        commodity,
        commodityTimeRange,
        stockTimeRange,

        marketDataRaw,
        commodityDataRaw,
        stockDailyDataRaw,
        stockIntradayData,
        searchResults,

        marketLoading,
        commodityLoading,
        stockLoading,
        searchLoading,

        marketLabel,
        commodityLabel,
        marketData,
        commodityData,
        stockDailyData,

        fetchMarketData,
        fetchCommodityData,
        fetchStockData,
        searchSymbols,
        selectSymbol,
        init,
    };
});
