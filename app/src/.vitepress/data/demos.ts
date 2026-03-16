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
        text: 'Product Analytics',
        link: '/demos/product-analytics/',
        description: 'A product analytics dashboard with mock data featuring line, bar, pie, heatmap, sankey, funnel, gauge, and scatter charts with a period selector.',
    },
    {
        text: 'Mermaid Diagrams',
        link: '/demos/mermaid-diagram/',
        description: 'A live Mermaid flowchart renderer that parses Mermaid syntax and draws diagrams using Ripl core elements with animated transitions and hover interactions.',
    },
    {
        text: 'Jet Engine 3D (Canvas)',
        link: '/demos/jet-engine/',
        description: 'An interactive 3D exploded view of a jet engine showcasing @ripl/3d with shaded wireframe rendering, orbit controls, and hover highlighting.',
    },
    {
        text: 'Jet Engine 3D (WebGPU)',
        link: '/demos/jet-engine-webgpu/',
        description: 'The jet engine exploded view demo re-implemented with @ripl/webgpu — GPU-accelerated rendering with hardware depth testing, WGSL shaders, and 4× MSAA.',
    },
    {
        text: 'Combustion Engine 3D',
        link: '/demos/combustion-engine/',
        description: 'An animated inline 4-cylinder combustion engine with crankshaft, pistons, connecting rods, camshaft, valves, and full mechanical motion — built with @ripl/3d.',
    },
    {
        text: 'Interactive Terminal',
        link: '/demos/terminal/',
        description: 'An interactive terminal powered by @ripl/terminal with a menu-driven interface — choose from basic shapes, animations, or full chart demos (line, bar, stock, Gantt) rendered in Unicode braille.',
    },
];
