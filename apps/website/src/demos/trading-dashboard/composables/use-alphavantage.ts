import {
    generateMockCommodityData,
    generateMockDailyData,
    generateMockIntradayData,
    generateMockSearchResults,
    MOCK_PRICES,
} from '../data/mock';

import type {
    MockCommodityPoint,
    MockDailyPoint,
    MockIntradayPoint,
    MockSearchResult,
} from '../data/mock';

const API_BASE = 'https://www.alphavantage.co/query';

function getApiKey(): string {
    return import.meta.env.VITE_ALPHAVANTAGE_API_KEY ?? '';
}

const memoryCache = new Map<string, {
    data: unknown;
    timestamp: number;
}>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached<T>(key: string): T | null {
    const mem = memoryCache.get(key);
    if (mem && Date.now() - mem.timestamp < CACHE_TTL) {
        return mem.data as T;
    }

    try {
        const stored = sessionStorage.getItem(key);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Date.now() - parsed.timestamp < CACHE_TTL) {
                memoryCache.set(key, parsed);
                return parsed.data as T;
            }
        }
    } catch {
        // sessionStorage unavailable
    }

    return null;
}

function setCache(key: string, data: unknown): void {
    const entry = {
        data,
        timestamp: Date.now(),
    };

    memoryCache.set(key, entry);

    try {
        sessionStorage.setItem(key, JSON.stringify(entry));
    } catch {
        // quota exceeded or unavailable
    }
}

async function fetchAV(params: Record<string, string>): Promise<Record<string, unknown> | null> {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const url = new URL(API_BASE);
    for (const [key, val] of Object.entries(params)) {
        url.searchParams.set(key, val);
    }
    url.searchParams.set('apikey', apiKey);

    const cacheKey = `av:${url.toString()}`;
    const cached = getCached<Record<string, unknown>>(cacheKey);
    if (cached) return cached;

    try {
        const res = await fetch(url.toString());
        if (!res.ok) return null;

        const json = await res.json();

        if (json['Error Message'] || json['Note'] || json['Information']) {
            return null;
        }

        setCache(cacheKey, json);
        return json;
    } catch {
        return null;
    }
}

function parseDailyTimeSeries(json: Record<string, unknown>): MockDailyPoint[] {
    const tsKey = Object.keys(json).find(key => key.includes('Time Series'));
    if (!tsKey) return [];

    const ts = json[tsKey] as Record<string, Record<string, string>>;
    return Object.entries(ts)
        .map(([date, values]) => ({
            date,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'], 10),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

function parseIntradayTimeSeries(json: Record<string, unknown>): MockIntradayPoint[] {
    const tsKey = Object.keys(json).find(key => key.includes('Time Series'));
    if (!tsKey) return [];

    const ts = json[tsKey] as Record<string, Record<string, string>>;
    return Object.entries(ts)
        .map(([datetime, values]) => ({
            datetime,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'], 10),
        }))
        .sort((a, b) => a.datetime.localeCompare(b.datetime));
}

function parseCommodityData(json: Record<string, unknown>): MockCommodityPoint[] {
    const data = json['data'] as Array<{
        date: string;
        value: string;
    }> | undefined;
    if (!data) return [];

    return data
        .filter(d => d.value !== '.')
        .map(d => ({
            date: d.date,
            value: parseFloat(d.value),
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchDailyTimeSeries(symbol: string): Promise<MockDailyPoint[]> {
    const json = await fetchAV({
        function: 'TIME_SERIES_DAILY',
        symbol,
        outputsize: 'compact',
    });

    if (json) {
        const parsed = parseDailyTimeSeries(json);
        if (parsed.length > 0) return parsed;
    }

    return generateMockDailyData(100, MOCK_PRICES[symbol] ?? 200);
}

export async function fetchIntradayTimeSeries(symbol: string): Promise<MockIntradayPoint[]> {
    const json = await fetchAV({
        function: 'TIME_SERIES_INTRADAY',
        symbol,
        interval: '5min',
    });

    if (json) {
        const parsed = parseIntradayTimeSeries(json);
        if (parsed.length > 0) return parsed;
    }

    return generateMockIntradayData(78, MOCK_PRICES[symbol] ?? 200);
}

export async function fetchSymbolSearch(keywords: string): Promise<MockSearchResult[]> {
    const json = await fetchAV({
        function: 'SYMBOL_SEARCH',
        keywords,
    });

    if (json && json['bestMatches']) {
        const matches = json['bestMatches'] as Array<Record<string, string>>;
        return matches.map(m => ({
            symbol: m['1. symbol'],
            name: m['2. name'],
            type: m['3. type'],
            region: m['4. region'],
            currency: m['8. currency'],
            matchScore: m['9. matchScore'],
        }));
    }

    return generateMockSearchResults(keywords);
}

export async function fetchGoldSilverHistory(symbol: 'GOLD' | 'SILVER'): Promise<MockCommodityPoint[]> {
    const json = await fetchAV({
        function: 'GOLD_SILVER_HISTORY',
        symbol,
        interval: 'daily',
    });

    if (json) {
        const parsed = parseCommodityData(json);
        if (parsed.length > 0) return parsed;
    }

    const base = symbol === 'GOLD' ? 2340 : 29.5;
    return generateMockCommodityData(100, base);
}

export async function fetchCrudeOil(type: 'WTI' | 'BRENT'): Promise<MockCommodityPoint[]> {
    const json = await fetchAV({
        function: type,
        interval: 'daily',
    });

    if (json) {
        const parsed = parseCommodityData(json);
        if (parsed.length > 0) return parsed;
    }

    return generateMockCommodityData(100, 78);
}
