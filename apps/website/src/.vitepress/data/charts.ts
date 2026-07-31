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
        description: 'Render one or more data series as smooth or straight lines with optional markers, grid lines, crosshair, and legend.',
        category: 'Cartesian',
    },
    {
        text: 'Bar',
        link: '/charts/bar',
        factory: 'createBarChart',
        description: 'Grouped and stacked modes with vertical and horizontal orientations, animated transitions, tooltips, and legend.',
        category: 'Cartesian',
    },
    {
        text: 'Area',
        link: '/charts/area',
        factory: 'createAreaChart',
        description: 'Filled areas beneath lines with stacked mode, crosshair, grid, and smooth animations.',
        category: 'Cartesian',
    },
    {
        text: 'Trend',
        link: '/charts/trend',
        factory: 'createTrendChart',
        description: 'Mix line, bar, and area series on shared axes with stacking and a windowing navigator strip.',
        category: 'Cartesian',
    },
    {
        text: 'Pie/Donut',
        link: '/charts/pie',
        factory: 'createPieChart',
        description: 'Illustrate numerical proportions of statistical data with animated slices and tooltips.',
        category: 'Radial & Polar',
    },
    {
        text: 'Polar Area',
        link: '/charts/polar-area',
        factory: 'createPolarAreaChart',
        description: 'Equal-angle segments whose radius encodes value, making it easy to compare magnitudes across categories.',
        category: 'Radial & Polar',
    },
    {
        text: 'Polar Scatter',
        link: '/charts/polar-scatter',
        factory: 'createPolarScatterChart',
        description: 'Points on a circular grid where angle and radius each encode a variable, ideal for directional or cyclical data.',
        category: 'Radial & Polar',
    },
    {
        text: 'Radial Bar',
        link: '/charts/radial-bar',
        factory: 'createRadialBarChart',
        description: 'Concentric rings whose arc length encodes each category\'s value, a circular take on the bar chart.',
        category: 'Radial & Polar',
    },
    {
        text: 'Scatter',
        link: '/charts/scatter',
        factory: 'createScatterChart',
        description: 'Data points on a two-dimensional plane with optional size variation to represent a third dimension.',
        category: 'Cartesian',
    },
    {
        text: 'Stock',
        link: '/charts/stock',
        factory: 'createStockChart',
        description: 'OHLC candlestick data with optional volume bars, crosshair, grid lines, and tooltips.',
        category: 'Cartesian',
    },
    {
        text: 'Radar',
        link: '/charts/radar',
        factory: 'createRadarChart',
        description: 'Multivariate data on a radial grid, ideal for comparing multiple dimensions across series.',
        category: 'Radial & Polar',
    },
    {
        text: 'Heatmap',
        link: '/charts/heatmap',
        factory: 'createHeatmapChart',
        description: 'Data displayed as a matrix of colored cells, with color intensity representing values.',
        category: 'Specialized',
    },
    {
        text: 'Histogram',
        link: '/charts/histogram',
        factory: 'createHistogramChart',
        description: 'The distribution of a numeric field, binned into bars over a continuous value axis.',
        category: 'Cartesian',
    },
    {
        text: 'Box Plot',
        link: '/charts/box-plot',
        factory: 'createBoxPlotChart',
        description: 'Summarize a numeric field per category with an interquartile box, median, whiskers, and outliers.',
        category: 'Cartesian',
    },
    {
        text: 'Treemap',
        link: '/charts/treemap',
        factory: 'createTreemapChart',
        description: 'Hierarchical data as nested rectangles, where each rectangle\'s area is proportional to its value.',
        category: 'Hierarchical',
    },
    {
        text: 'Packed Circle',
        link: '/charts/packed-circle',
        factory: 'createPackedCircleChart',
        description: 'Each datum as a circle whose area encodes its value, arranged in a tight non-overlapping cluster.',
        category: 'Hierarchical',
    },
    {
        text: 'Funnel',
        link: '/charts/funnel',
        factory: 'createFunnelChart',
        description: 'Progressively narrowing horizontal bars, ideal for visualizing conversion pipelines and drop-off rates.',
        category: 'Network & Flow',
    },
    {
        text: 'Gantt',
        link: '/charts/gantt',
        factory: 'createGanttChart',
        description: 'Tasks as horizontal bars along a time axis with progress overlays, today marker, and tooltips.',
        category: 'Specialized',
    },
    {
        text: 'Gauge',
        link: '/charts/gauge',
        factory: 'createGaugeChart',
        description: 'A single value on a semi-circular arc, ideal for KPIs, progress indicators, and dashboard metrics.',
        category: 'Radial & Polar',
    },
    {
        text: 'Sunburst',
        link: '/charts/sunburst',
        factory: 'createSunburstChart',
        description: 'Hierarchical data as concentric rings, where each ring represents a level and arc size represents value.',
        category: 'Hierarchical',
    },
    {
        text: 'Sankey',
        link: '/charts/sankey',
        factory: 'createSankeyChart',
        description: 'Flow between nodes using weighted links. Ideal for energy flows, budget allocations, or user journeys.',
        category: 'Network & Flow',
    },
    {
        text: 'Force-Directed',
        link: '/charts/force-directed',
        factory: 'createForceDirectedChart',
        description: 'A network of nodes and links laid out by a physics simulation, ideal for relationship and dependency data.',
        category: 'Network & Flow',
    },
    {
        text: 'Arc Diagram',
        link: '/charts/arc-diagram',
        factory: 'createArcDiagramChart',
        description: 'Nodes along a line connected by arcs whose thickness encodes relationship strength.',
        category: 'Network & Flow',
    },
    {
        text: 'Realtime',
        link: '/charts/realtime',
        factory: 'createRealtimeChart',
        description: 'Smoothly visualize streaming data with a sliding window and animated transitions. Ideal for live dashboards.',
        category: 'Specialized',
    },
    {
        text: 'Chord',
        link: '/charts/chord',
        factory: 'createChordChart',
        description: 'Relationships between groups using arcs and ribbons arranged in a circle. Ideal for inter-group flows.',
        category: 'Network & Flow',
    },
];
