export interface ChartMeta {
    text: string;
    link: string;
    description: string;
}

export const charts: ChartMeta[] = [
    {
        text: 'Line',
        link: '/charts/line',
        description: 'Render one or more data series as smooth or straight lines with optional markers, grid lines, crosshair, and legend.',
    },
    {
        text: 'Bar',
        link: '/charts/bar',
        description: 'Grouped and stacked modes with vertical and horizontal orientations, animated transitions, tooltips, and legend.',
    },
    {
        text: 'Area',
        link: '/charts/area',
        description: 'Filled areas beneath lines with stacked mode, crosshair, grid, and smooth animations.',
    },
    {
        text: 'Trend',
        link: '/charts/trend',
        description: 'Combine x/y series such as bar, line, or area into a single composite chart.',
    },
    {
        text: 'Pie/Donut',
        link: '/charts/pie',
        description: 'Illustrate numerical proportions of statistical data with animated slices and tooltips.',
    },
    {
        text: 'Polar Area',
        link: '/charts/polar-area',
        description: 'Equal-angle segments whose radius encodes value, making it easy to compare magnitudes across categories.',
    },
    {
        text: 'Polar Scatter',
        link: '/charts/polar-scatter',
        description: 'Points on a circular grid where angle and radius each encode a variable, ideal for directional or cyclical data.',
    },
    {
        text: 'Radial Bar',
        link: '/charts/radial-bar',
        description: 'Concentric rings whose arc length encodes each category\'s value — a circular take on the bar chart.',
    },
    {
        text: 'Scatter',
        link: '/charts/scatter',
        description: 'Data points on a two-dimensional plane with optional size variation to represent a third dimension.',
    },
    {
        text: 'Stock',
        link: '/charts/stock',
        description: 'OHLC candlestick data with optional volume bars, crosshair, grid lines, and tooltips.',
    },
    {
        text: 'Radar',
        link: '/charts/radar',
        description: 'Multivariate data on a radial grid, ideal for comparing multiple dimensions across series.',
    },
    {
        text: 'Heatmap',
        link: '/charts/heatmap',
        description: 'Data displayed as a matrix of colored cells, with color intensity representing values.',
    },
    {
        text: 'Histogram',
        link: '/charts/histogram',
        description: 'The distribution of a numeric field, binned into bars over a continuous value axis.',
    },
    {
        text: 'Box Plot',
        link: '/charts/box-plot',
        description: 'Summarise a numeric field per category with an interquartile box, median, whiskers, and outliers.',
    },
    {
        text: 'Treemap',
        link: '/charts/treemap',
        description: 'Hierarchical data as nested rectangles, where each rectangle\'s area is proportional to its value.',
    },
    {
        text: 'Packed Circle',
        link: '/charts/packed-circle',
        description: 'Each datum as a circle whose area encodes its value, arranged in a tight non-overlapping cluster.',
    },
    {
        text: 'Funnel',
        link: '/charts/funnel',
        description: 'Progressively narrowing horizontal bars, ideal for visualizing conversion pipelines and drop-off rates.',
    },
    {
        text: 'Gantt',
        link: '/charts/gantt',
        description: 'Tasks as horizontal bars along a time axis with progress overlays, today marker, and tooltips.',
    },
    {
        text: 'Gauge',
        link: '/charts/gauge',
        description: 'A single value on a semi-circular arc, ideal for KPIs, progress indicators, and dashboard metrics.',
    },
    {
        text: 'Sunburst',
        link: '/charts/sunburst',
        description: 'Hierarchical data as concentric rings, where each ring represents a level and arc size represents value.',
    },
    {
        text: 'Sankey',
        link: '/charts/sankey',
        description: 'Flow between nodes using weighted links. Ideal for energy flows, budget allocations, or user journeys.',
    },
    {
        text: 'Force-Directed',
        link: '/charts/force-directed',
        description: 'A network of nodes and links laid out by a physics simulation, ideal for relationship and dependency data.',
    },
    {
        text: 'Arc Diagram',
        link: '/charts/arc-diagram',
        description: 'Nodes along a line connected by arcs whose thickness encodes relationship strength.',
    },
    {
        text: 'Realtime',
        link: '/charts/realtime',
        description: 'Smoothly visualize streaming data with a sliding window and animated transitions. Ideal for live dashboards.',
    },
    {
        text: 'Chord',
        link: '/charts/chord',
        description: 'Relationships between groups using arcs and ribbons arranged in a circle. Ideal for inter-group flows.',
    },
];
