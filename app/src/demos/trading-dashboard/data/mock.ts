function randomWalk(start: number, count: number, volatility: number): number[] {
    const values: number[] = [start];
    for (let i = 1; i < count; i++) {
        const change = (Math.random() - 0.48) * volatility;
        values.push(Math.round((values[i - 1] + change) * 100) / 100);
    }
    return values;
}

function dateRange(count: number, endDate?: Date): string[] {
    const end = endDate ?? new Date();
    const dates: string[] = [];
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(end);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

export interface MockDailyPoint {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export function generateMockDailyData(count = 100, basePrice = 450): MockDailyPoint[] {
    const dates = dateRange(count);
    const closes = randomWalk(basePrice, count, basePrice * 0.02);

    return dates.map((date, i) => {
        const close = closes[i];
        const open = Math.round((close + (Math.random() - 0.5) * basePrice * 0.01) * 100) / 100;
        const high = Math.round((Math.max(open, close) + Math.random() * basePrice * 0.008) * 100) / 100;
        const low = Math.round((Math.min(open, close) - Math.random() * basePrice * 0.008) * 100) / 100;
        const volume = Math.round(Math.random() * 8_000_000 + 2_000_000);
        return {
            date,
            open,
            high,
            low,
            close,
            volume,
        };
    });
}

export interface MockIntradayPoint {
    datetime: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export function generateMockIntradayData(count = 78, basePrice = 190): MockIntradayPoint[] {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const closes = randomWalk(basePrice, count, basePrice * 0.003);

    return Array.from({ length: count }, (_, i) => {
        const hour = 9 + Math.floor((i * 5 + 30) / 60);
        const minute = (i * 5 + 30) % 60;
        const datetime = `${today} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
        const close = closes[i];
        const open = Math.round((close + (Math.random() - 0.5) * basePrice * 0.002) * 100) / 100;
        const high = Math.round((Math.max(open, close) + Math.random() * basePrice * 0.001) * 100) / 100;
        const low = Math.round((Math.min(open, close) - Math.random() * basePrice * 0.001) * 100) / 100;
        const volume = Math.round(Math.random() * 500_000 + 50_000);
        return {
            datetime,
            open,
            high,
            low,
            close,
            volume,
        };
    });
}

export interface MockCommodityPoint {
    date: string;
    value: number;
}

export function generateMockCommodityData(count = 100, basePrice = 2000): MockCommodityPoint[] {
    const dates = dateRange(count);
    const values = randomWalk(basePrice, count, basePrice * 0.01);
    return dates.map((date, i) => ({
        date,
        value: values[i],
    }));
}

export interface MockSearchResult {
    symbol: string;
    name: string;
    type: string;
    region: string;
    currency: string;
    matchScore: string;
}

export function generateMockSearchResults(keywords: string): MockSearchResult[] {
    const allResults: MockSearchResult[] = [
        {
            symbol: 'AAPL',
            name: 'Apple Inc',
            type: 'Equity',
            region: 'United States',
            currency: 'USD',
            matchScore: '1.0000',
        },
        {
            symbol: 'MSFT',
            name: 'Microsoft Corporation',
            type: 'Equity',
            region: 'United States',
            currency: 'USD',
            matchScore: '1.0000',
        },
        {
            symbol: 'GOOGL',
            name: 'Alphabet Inc',
            type: 'Equity',
            region: 'United States',
            currency: 'USD',
            matchScore: '1.0000',
        },
        {
            symbol: 'AMZN',
            name: 'Amazon.com Inc',
            type: 'Equity',
            region: 'United States',
            currency: 'USD',
            matchScore: '1.0000',
        },
        {
            symbol: 'TSLA',
            name: 'Tesla Inc',
            type: 'Equity',
            region: 'United States',
            currency: 'USD',
            matchScore: '1.0000',
        },
        {
            symbol: 'NVDA',
            name: 'NVIDIA Corporation',
            type: 'Equity',
            region: 'United States',
            currency: 'USD',
            matchScore: '1.0000',
        },
        {
            symbol: 'META',
            name: 'Meta Platforms Inc',
            type: 'Equity',
            region: 'United States',
            currency: 'USD',
            matchScore: '1.0000',
        },
        {
            symbol: 'JPM',
            name: 'JPMorgan Chase & Co',
            type: 'Equity',
            region: 'United States',
            currency: 'USD',
            matchScore: '1.0000',
        },
        {
            symbol: 'V',
            name: 'Visa Inc',
            type: 'Equity',
            region: 'United States',
            currency: 'USD',
            matchScore: '1.0000',
        },
        {
            symbol: 'SPY',
            name: 'SPDR S&P 500 ETF Trust',
            type: 'ETF',
            region: 'United States',
            currency: 'USD',
            matchScore: '1.0000',
        },
    ];

    const kw = keywords.toLowerCase();
    return allResults.filter(r =>
        r.symbol.toLowerCase().includes(kw) || r.name.toLowerCase().includes(kw)
    );
}

export const MOCK_PRICES: Record<string, number> = {
    SPY: 520,
    QQQ: 445,
    DIA: 395,
    'STW.AX': 72,
    AAPL: 192,
    MSFT: 415,
    GOOGL: 175,
    AMZN: 185,
    TSLA: 245,
    NVDA: 880,
    META: 505,
    GOLD: 2340,
    SILVER: 29.5,
};
