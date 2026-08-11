/** The family a chart belongs to, used to group the charts sidebar. */
export type ChartCategory =
    | 'Cartesian'
    | 'Radial & Polar'
    | 'Hierarchical'
    | 'Network & Flow'
    | 'Specialized';

export interface ChartMeta {
    text: string;
    link: string;
    /** The `createXChart` factory that builds this chart. */
    factory: string;
    description: string;
    category: ChartCategory;
}

/** Sidebar ordering of the chart families. */
export const chartCategories: ChartCategory[] = [
    'Cartesian',
    'Radial & Polar',
    'Hierarchical',
    'Network & Flow',
    'Specialized',
];

export const charts: ChartMeta[] = [
    {
        text: 'Line',
        link: '/charts/line',
        factory: 'createLineChart',
        description: 'One or more series as lines, with 13 interpolation modes per series, optional markers, dual y-axes, crosshair, grid and legend.',
        category: 'Cartesian',
    },
    {
        text: 'Bar',
        link: '/charts/bar',
        factory: 'createBarChart',
        description: 'Grouped, stacked or 100% stacked bars, vertical or horizontal, with rounded corners, value labels, tooltips and a legend.',
        category: 'Cartesian',
    },
    {
        text: 'Area',
        link: '/charts/area',
        factory: 'createAreaChart',
        description: 'Filled bands beneath line series, stacked or overlaid, with per-series fill opacity, crosshair, grid and tooltips.',
        category: 'Cartesian',
    },
    {
        text: 'Trend',
        link: '/charts/trend',
        factory: 'createTrendChart',
        description: 'Line, bar and area series mixed on shared axes, with per-type stacking and an overview strip for windowing the x-range.',
        category: 'Cartesian',
    },
    {
        text: 'Pie/Donut',
        link: '/charts/pie',
        factory: 'createPieChart',
        description: 'Proportions as angular slices, with an inner radius for a donut, constant-width slice gaps, labels and hover dimming.',
        category: 'Radial & Polar',
    },
    {
        text: 'Polar Area',
        link: '/charts/polar-area',
        factory: 'createPolarAreaChart',
        description: 'Equal-angle segments whose radius encodes value, over configurable value rings, with labels and a legend.',
        category: 'Radial & Polar',
    },
    {
        text: 'Polar Scatter',
        link: '/charts/polar-scatter',
        factory: 'createPolarScatterChart',
        description: 'Points on a circular grid where angle and radius each encode a variable, and a third can drive marker size.',
        category: 'Radial & Polar',
    },
    {
        text: 'Radial Bar',
        link: '/charts/radial-bar',
        factory: 'createRadialBarChart',
        description: 'Concentric rings whose arcs sweep to each value, with a faint track behind, configurable angular range and rounded caps.',
        category: 'Radial & Polar',
    },
    {
        text: 'Scatter',
        link: '/charts/scatter',
        factory: 'createScatterChart',
        description: 'Points across x and y for two continuous measures, with optional size-encoded bubbles, dual-axis crosshair and pan-zoom.',
        category: 'Cartesian',
    },
    {
        text: 'Stock',
        link: '/charts/stock',
        factory: 'createStockChart',
        description: 'OHLC candlesticks with a labeled volume sub-chart, separate up and down colors, crosshair, annotations and pan-zoom.',
        category: 'Cartesian',
    },
    {
        text: 'Radar',
        link: '/charts/radar',
        factory: 'createRadarChart',
        description: 'One polygon per series across shared category spokes, with configurable grid rings, markers, labels and a legend.',
        category: 'Radial & Polar',
    },
    {
        text: 'Heatmap',
        link: '/charts/heatmap',
        factory: 'createHeatmapChart',
        description: 'One value across two categorical axes as colored cells, with a configurable gradient and a continuous color legend.',
        category: 'Specialized',
    },
    {
        text: 'Histogram',
        link: '/charts/histogram',
        factory: 'createHistogramChart',
        description: 'The distribution of a numeric field, binned into bars over a continuous value axis with nice bins or explicit thresholds.',
        category: 'Cartesian',
    },
    {
        text: 'Box Plot',
        link: '/charts/box-plot',
        factory: 'createBoxPlotChart',
        description: 'An interquartile box, median, 1.5x IQR whiskers and outliers per category, from the shared boxplotStats transform.',
        category: 'Cartesian',
    },
    {
        text: 'Treemap',
        link: '/charts/treemap',
        factory: 'createTreemapChart',
        description: 'A total tiled into nested rectangles whose areas encode value, with configurable gaps, corner radius and automatic labels.',
        category: 'Hierarchical',
    },
    {
        text: 'Packed Circle',
        link: '/charts/packed-circle',
        factory: 'createPackedCircleChart',
        description: 'Circles whose areas encode value, packed tightly without overlap inside one containing circle, with labels on the larger ones.',
        category: 'Hierarchical',
    },
    {
        text: 'Funnel',
        link: '/charts/funnel',
        factory: 'createFunnelChart',
        description: 'Ordered stages as progressively narrowing bars, so each step\'s drop-off is the width it loses. Gaps and corners are configurable.',
        category: 'Network & Flow',
    },
    {
        text: 'Gantt',
        link: '/charts/gantt',
        factory: 'createGanttChart',
        description: 'Tasks as bars on a time axis, with progress overlays, finish-to-start dependency connectors, a today marker and tooltips.',
        category: 'Specialized',
    },
    {
        text: 'Gauge',
        link: '/charts/gauge',
        factory: 'createGaugeChart',
        description: 'A single value on a semi-circular arc between a min and max, with tick marks, tick labels and a custom value formatter.',
        category: 'Radial & Polar',
    },
    {
        text: 'Sunburst',
        link: '/charts/sunburst',
        factory: 'createSunburstChart',
        description: 'A tree as concentric rings, one ring per depth level, where each arc\'s width is its share of its parent.',
        category: 'Hierarchical',
    },
    {
        text: 'Sankey',
        link: '/charts/sankey',
        factory: 'createSankeyChart',
        description: 'Weighted flows between nodes as proportional links, laid out automatically. For energy flows, budgets and user journeys.',
        category: 'Network & Flow',
    },
    {
        text: 'Force-Directed',
        link: '/charts/force-directed',
        factory: 'createForceDirectedChart',
        description: 'A node-link graph laid out by a deterministic physics simulation, with tunable charge, link distance and centering.',
        category: 'Network & Flow',
    },
    {
        text: 'Arc Diagram',
        link: '/charts/arc-diagram',
        factory: 'createArcDiagramChart',
        description: 'Nodes along one axis joined by arcs whose thickness encodes link weight, horizontally or vertically, sized by degree.',
        category: 'Network & Flow',
    },
    {
        text: 'Realtime',
        link: '/charts/realtime',
        factory: 'createRealtimeChart',
        description: 'A sliding window of streaming values that scrolls as you push new ones, with a fixed window size and optional area fills.',
        category: 'Specialized',
    },
    {
        text: 'Chord',
        link: '/charts/chord',
        factory: 'createChordChart',
        description: 'Group-to-group flows from a square matrix as ribbons inside a ring of arcs, with hover dimming and configurable gaps.',
        category: 'Network & Flow',
    },
];
