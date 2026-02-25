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
    {
        text: 'Jet Engine 3D',
        link: '/demos/jet-engine/',
        description: 'An interactive 3D exploded view of a jet engine showcasing @ripl/3d with shaded wireframe rendering, orbit controls, and hover highlighting.',
    },
];
