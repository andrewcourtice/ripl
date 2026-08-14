/**
 * The options every chart accepts, whatever its type.
 *
 * The cartesian furniture — axis, grid, crosshair, navigator, overview, annotations — is declared
 * here rather than per chart so a chart that grows one later needs no change on this side. A chart
 * that has no use for an option ignores it, and each component's prop *types* stay exact.
 */
export const BASE_CHART_OPTION_KEYS = [
    'animation',
    'annotations',
    'autoRender',
    'axis',
    'crosshair',
    'description',
    'grid',
    'legend',
    'navigator',
    'overview',
    'padding',
    'theme',
    'title',
    'tooltip',
] as const;

/** The options specific to each chart type, on top of {@link BASE_CHART_OPTION_KEYS}. */
export const CHART_OPTION_KEYS = {
    /** The options specific to a arc diagram chart. */
    arcDiagram: [
        'format',
        'links',
        'nodeRadius',
        'nodes',
        'orientation',
        'sizeByConnections',
    ],
    /** The options specific to a area chart. */
    area: [
        'data',
        'format',
        'key',
        'labels',
        'series',
        'stacked',
    ],
    /** The options specific to a bar chart. */
    bar: [
        'borderRadius',
        'data',
        'format',
        'key',
        'labels',
        'orientation',
        'series',
        'stacked',
    ],
    /** The options specific to a box plot chart. */
    boxPlot: [
        'categoryOrder',
        'color',
        'data',
        'format',
        'key',
        'value',
    ],
    /** The options specific to a chord chart. */
    chord: [
        'format',
        'groups',
        'matrix',
        'padAngle',
        'padWidth',
        'palette',
    ],
    /** The options specific to a force directed chart. */
    forceDirected: [
        'centerStrength',
        'charge',
        'format',
        'iterations',
        'linkDistance',
        'linkStrength',
        'links',
        'nodeRadius',
        'nodes',
        'root',
    ],
    /** The options specific to a funnel chart. */
    funnel: [
        'borderRadius',
        'colorBy',
        'data',
        'format',
        'gap',
        'key',
        'label',
        'value',
    ],
    /** The options specific to a gantt chart. */
    gantt: [
        'borderRadius',
        'colorBy',
        'data',
        'dependencies',
        'end',
        'format',
        'key',
        'label',
        'progress',
        'showToday',
        'start',
        'todayColor',
    ],
    /** The options specific to a gauge chart. */
    gauge: [
        'color',
        'format',
        'label',
        'max',
        'min',
        'tickFormat',
        'tickLabels',
        'ticks',
        'trackColor',
        'value',
    ],
    /** The options specific to a heatmap chart. */
    heatmap: [
        'borderRadius',
        'data',
        'format',
        'gradient',
        'keyX',
        'keyY',
        'labels',
        'value',
        'xCategories',
        'yCategories',
    ],
    /** The options specific to a histogram chart. */
    histogram: [
        'bins',
        'borderRadius',
        'color',
        'data',
        'format',
        'thresholds',
        'value',
    ],
    /** The options specific to a line chart. */
    line: [
        'data',
        'format',
        'key',
        'labels',
        'series',
    ],
    /** The options specific to a packed circle chart. */
    packedCircle: [
        'colorBy',
        'data',
        'format',
        'key',
        'label',
        'value',
    ],
    /** The options specific to a pie chart. */
    pie: [
        'colorBy',
        'data',
        'format',
        'innerRadius',
        'key',
        'label',
        'labels',
        'padWidth',
        'value',
    ],
    /** The options specific to a polar area chart. */
    polarArea: [
        'colorBy',
        'data',
        'format',
        'innerRadius',
        'key',
        'label',
        'labels',
        'levels',
        'maxRadiusRatio',
        'padAngle',
        'padWidth',
        'value',
    ],
    /** The options specific to a polar scatter chart. */
    polarScatter: [
        'data',
        'format',
        'labels',
        'levels',
        'max',
        'sectors',
        'series',
    ],
    /** The options specific to a radar chart. */
    radar: [
        'categories',
        'data',
        'format',
        'labels',
        'levels',
        'max',
        'series',
    ],
    /** The options specific to a radial bar chart. */
    radialBar: [
        'colorBy',
        'data',
        'format',
        'gap',
        'innerRadius',
        'key',
        'label',
        'labels',
        'max',
        'range',
        'rounded',
        'trackColor',
        'value',
    ],
    /** The options specific to a realtime chart. */
    realtime: [
        'format',
        'series',
        'showYAxis',
        'transitionDuration',
        'windowSize',
        'yMax',
        'yMin',
    ],
    /** The options specific to a sankey chart. */
    sankey: [
        'format',
        'iterations',
        'links',
        'nodePadding',
        'nodeWidth',
        'nodes',
    ],
    /** The options specific to a scatter chart. */
    scatter: [
        'data',
        'format',
        'key',
        'labels',
        'series',
    ],
    /** The options specific to a stock chart. */
    stock: [
        'close',
        'data',
        'downColor',
        'format',
        'high',
        'key',
        'low',
        'open',
        'showVolume',
        'upColor',
        'volume',
    ],
    /** The options specific to a sunburst chart. */
    sunburst: [
        'data',
        'format',
        'padWidth',
    ],
    /** The options specific to a treemap chart. */
    treemap: [
        'borderRadius',
        'colorBy',
        'data',
        'format',
        'gap',
        'key',
        'label',
        'value',
    ],
    /** The options specific to a trend chart. */
    trend: [
        'borderRadius',
        'data',
        'format',
        'key',
        'labels',
        'series',
        'stacked',
    ],
} as const satisfies Record<string, readonly string[]>;
