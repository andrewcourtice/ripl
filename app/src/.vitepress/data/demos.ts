export interface DemoMeta {
    text: string;
    link: string;
    description: string;
}

export const demos: DemoMeta[] = [
    {
        text: 'Trading Dashboard',
        link: '/demos/trading-dashboard/',
        description: 'A live stock trading dashboard featuring market indices, commodities, symbol search, candlestick charts, and historical performance — all powered by the Alpha Vantage API.',
    },
];
