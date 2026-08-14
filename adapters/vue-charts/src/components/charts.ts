import {
    chartFactory,
    defineRiplChart,
} from '../core/define-chart';

import {
    CHART_OPTION_KEYS,
} from '../core/props';

import type {
    RiplChartListeners,
} from '../types';

import {
    ArcDiagramChart,
    AreaChart,
    BarChart,
    BoxPlotChart,
    ChordChart,
    createArcDiagramChart,
    createAreaChart,
    createBarChart,
    createBoxPlotChart,
    createChordChart,
    createForceDirectedChart,
    createFunnelChart,
    createGanttChart,
    createGaugeChart,
    createHeatmapChart,
    createHistogramChart,
    createLineChart,
    createPackedCircleChart,
    createPieChart,
    createPolarAreaChart,
    createPolarScatterChart,
    createRadarChart,
    createRadialBarChart,
    createRealtimeChart,
    createSankeyChart,
    createScatterChart,
    createStockChart,
    createSunburstChart,
    createTreemapChart,
    createTrendChart,
    ForceDirectedChart,
    FunnelChart,
    GanttChart,
    GaugeChart,
    HeatmapChart,
    HistogramChart,
    LineChart,
    PackedCircleChart,
    PieChart,
    PolarAreaChart,
    PolarScatterChart,
    RadarChart,
    RadialBarChart,
    RealtimeChart,
    SankeyChart,
    ScatterChart,
    StockChart,
    SunburstChart,
    TreemapChart,
    TrendChart,
} from '@ripl/charts';

import type {
    ArcDiagramChartEventMap,
    ArcDiagramChartOptions,
    AreaChartEventMap,
    AreaChartOptions,
    BarChartEventMap,
    BarChartOptions,
    BoxPlotChartEventMap,
    BoxPlotChartOptions,
    ChordChartEventMap,
    ChordChartOptions,
    ForceDirectedChartEventMap,
    ForceDirectedChartOptions,
    FunnelChartEventMap,
    FunnelChartOptions,
    GanttChartEventMap,
    GanttChartOptions,
    GaugeChartEventMap,
    GaugeChartOptions,
    HeatmapChartEventMap,
    HeatmapChartOptions,
    HistogramChartEventMap,
    HistogramChartOptions,
    LineChartEventMap,
    LineChartOptions,
    PackedCircleChartEventMap,
    PackedCircleChartOptions,
    PieChartEventMap,
    PieChartOptions,
    PolarAreaChartEventMap,
    PolarAreaChartOptions,
    PolarScatterChartEventMap,
    PolarScatterChartOptions,
    RadarChartEventMap,
    RadarChartOptions,
    RadialBarChartEventMap,
    RadialBarChartOptions,
    RealtimeChartOptions,
    SankeyChartEventMap,
    SankeyChartOptions,
    ScatterChartEventMap,
    ScatterChartOptions,
    StockChartEventMap,
    StockChartOptions,
    SunburstChartEventMap,
    SunburstChartOptions,
    TreemapChartEventMap,
    TreemapChartOptions,
    TrendChartEventMap,
    TrendChartOptions,
} from '@ripl/charts';

import type {
    RiplComponent,
} from '@ripl/vue';

/** An arc diagram: nodes on a line, links drawn as arcs above it. */
export const RiplArcDiagramChart = defineRiplChart({
    name: 'RiplArcDiagramChart',
    optionKeys: CHART_OPTION_KEYS.arcDiagram,
    events: ArcDiagramChart.prototype.$events as string[],
    create: chartFactory<ArcDiagramChartOptions<unknown>>(createArcDiagramChart),
}) as unknown as RiplComponent<ArcDiagramChartOptions<unknown> & RiplChartListeners<ArcDiagramChartEventMap<unknown>>, ArcDiagramChart>;

/** An area chart: one or more filled series over a shared category axis. */
export const RiplAreaChart = defineRiplChart({
    name: 'RiplAreaChart',
    optionKeys: CHART_OPTION_KEYS.area,
    events: AreaChart.prototype.$events as string[],
    create: chartFactory<AreaChartOptions<unknown>>(createAreaChart),
}) as unknown as RiplComponent<AreaChartOptions<unknown> & RiplChartListeners<AreaChartEventMap>, AreaChart>;

/** A bar chart, vertical or horizontal, grouped or stacked. */
export const RiplBarChart = defineRiplChart({
    name: 'RiplBarChart',
    optionKeys: CHART_OPTION_KEYS.bar,
    events: BarChart.prototype.$events as string[],
    create: chartFactory<BarChartOptions<unknown>>(createBarChart),
}) as unknown as RiplComponent<BarChartOptions<unknown> & RiplChartListeners<BarChartEventMap>, BarChart>;

/** A box plot showing the quartiles and outliers of each category. */
export const RiplBoxPlotChart = defineRiplChart({
    name: 'RiplBoxPlotChart',
    optionKeys: CHART_OPTION_KEYS.boxPlot,
    events: BoxPlotChart.prototype.$events as string[],
    create: chartFactory<BoxPlotChartOptions<unknown>>(createBoxPlotChart),
}) as unknown as RiplComponent<BoxPlotChartOptions<unknown> & RiplChartListeners<BoxPlotChartEventMap>, BoxPlotChart>;

/** A chord diagram of flows between groups arranged around a circle. */
export const RiplChordChart = defineRiplChart({
    name: 'RiplChordChart',
    optionKeys: CHART_OPTION_KEYS.chord,
    events: ChordChart.prototype.$events as string[],
    create: chartFactory<ChordChartOptions>(createChordChart),
}) as unknown as RiplComponent<ChordChartOptions & RiplChartListeners<ChordChartEventMap>, ChordChart>;

/** A force-directed graph, laid out by simulated attraction and repulsion. */
export const RiplForceDirectedChart = defineRiplChart({
    name: 'RiplForceDirectedChart',
    optionKeys: CHART_OPTION_KEYS.forceDirected,
    events: ForceDirectedChart.prototype.$events as string[],
    create: chartFactory<ForceDirectedChartOptions<unknown>>(createForceDirectedChart),
}) as unknown as RiplComponent<ForceDirectedChartOptions<unknown> & RiplChartListeners<ForceDirectedChartEventMap<unknown>>, ForceDirectedChart>;

/** A funnel chart of values narrowing through successive stages. */
export const RiplFunnelChart = defineRiplChart({
    name: 'RiplFunnelChart',
    optionKeys: CHART_OPTION_KEYS.funnel,
    events: FunnelChart.prototype.$events as string[],
    create: chartFactory<FunnelChartOptions<unknown>>(createFunnelChart),
}) as unknown as RiplComponent<FunnelChartOptions<unknown> & RiplChartListeners<FunnelChartEventMap>, FunnelChart>;

/** A gantt chart of tasks across time, with optional dependencies and progress. */
export const RiplGanttChart = defineRiplChart({
    name: 'RiplGanttChart',
    optionKeys: CHART_OPTION_KEYS.gantt,
    events: GanttChart.prototype.$events as string[],
    create: chartFactory<GanttChartOptions<unknown>>(createGanttChart),
}) as unknown as RiplComponent<GanttChartOptions<unknown> & RiplChartListeners<GanttChartEventMap>, GanttChart>;

/** A gauge showing a single value within a range. */
export const RiplGaugeChart = defineRiplChart({
    name: 'RiplGaugeChart',
    optionKeys: CHART_OPTION_KEYS.gauge,
    events: GaugeChart.prototype.$events as string[],
    create: chartFactory<GaugeChartOptions>(createGaugeChart),
}) as unknown as RiplComponent<GaugeChartOptions & RiplChartListeners<GaugeChartEventMap>, GaugeChart>;

/** A heatmap of values across two categorical axes. */
export const RiplHeatmapChart = defineRiplChart({
    name: 'RiplHeatmapChart',
    optionKeys: CHART_OPTION_KEYS.heatmap,
    events: HeatmapChart.prototype.$events as string[],
    create: chartFactory<HeatmapChartOptions<unknown>>(createHeatmapChart),
}) as unknown as RiplComponent<HeatmapChartOptions<unknown> & RiplChartListeners<HeatmapChartEventMap>, HeatmapChart>;

/** A histogram binning a continuous value into buckets. */
export const RiplHistogramChart = defineRiplChart({
    name: 'RiplHistogramChart',
    optionKeys: CHART_OPTION_KEYS.histogram,
    events: HistogramChart.prototype.$events as string[],
    create: chartFactory<HistogramChartOptions<unknown>>(createHistogramChart),
}) as unknown as RiplComponent<HistogramChartOptions<unknown> & RiplChartListeners<HistogramChartEventMap>, HistogramChart>;

/** A line chart: one or more series over a shared category axis. */
export const RiplLineChart = defineRiplChart({
    name: 'RiplLineChart',
    optionKeys: CHART_OPTION_KEYS.line,
    events: LineChart.prototype.$events as string[],
    create: chartFactory<LineChartOptions<unknown>>(createLineChart),
}) as unknown as RiplComponent<LineChartOptions<unknown> & RiplChartListeners<LineChartEventMap>, LineChart>;

/** A packed circle chart sizing each datum by value. */
export const RiplPackedCircleChart = defineRiplChart({
    name: 'RiplPackedCircleChart',
    optionKeys: CHART_OPTION_KEYS.packedCircle,
    events: PackedCircleChart.prototype.$events as string[],
    create: chartFactory<PackedCircleChartOptions<unknown>>(createPackedCircleChart),
}) as unknown as RiplComponent<PackedCircleChartOptions<unknown> & RiplChartListeners<PackedCircleChartEventMap>, PackedCircleChart>;

/** A pie or donut chart of values as angular segments. */
export const RiplPieChart = defineRiplChart({
    name: 'RiplPieChart',
    optionKeys: CHART_OPTION_KEYS.pie,
    events: PieChart.prototype.$events as string[],
    create: chartFactory<PieChartOptions<unknown>>(createPieChart),
}) as unknown as RiplComponent<PieChartOptions<unknown> & RiplChartListeners<PieChartEventMap>, PieChart>;

/** A polar area chart: segments of equal angle and value-driven radius. */
export const RiplPolarAreaChart = defineRiplChart({
    name: 'RiplPolarAreaChart',
    optionKeys: CHART_OPTION_KEYS.polarArea,
    events: PolarAreaChart.prototype.$events as string[],
    create: chartFactory<PolarAreaChartOptions<unknown>>(createPolarAreaChart),
}) as unknown as RiplComponent<PolarAreaChartOptions<unknown> & RiplChartListeners<PolarAreaChartEventMap>, PolarAreaChart>;

/** A polar scatter chart plotting points by angle and radius. */
export const RiplPolarScatterChart = defineRiplChart({
    name: 'RiplPolarScatterChart',
    optionKeys: CHART_OPTION_KEYS.polarScatter,
    events: PolarScatterChart.prototype.$events as string[],
    create: chartFactory<PolarScatterChartOptions<unknown>>(createPolarScatterChart),
}) as unknown as RiplComponent<PolarScatterChartOptions<unknown> & RiplChartListeners<PolarScatterChartEventMap>, PolarScatterChart>;

/** A radar chart comparing series across shared categories. */
export const RiplRadarChart = defineRiplChart({
    name: 'RiplRadarChart',
    optionKeys: CHART_OPTION_KEYS.radar,
    events: RadarChart.prototype.$events as string[],
    create: chartFactory<RadarChartOptions<unknown>>(createRadarChart),
}) as unknown as RiplComponent<RadarChartOptions<unknown> & RiplChartListeners<RadarChartEventMap>, RadarChart>;

/** A radial bar chart of values as concentric arcs. */
export const RiplRadialBarChart = defineRiplChart({
    name: 'RiplRadialBarChart',
    optionKeys: CHART_OPTION_KEYS.radialBar,
    events: RadialBarChart.prototype.$events as string[],
    create: chartFactory<RadialBarChartOptions<unknown>>(createRadialBarChart),
}) as unknown as RiplComponent<RadialBarChartOptions<unknown> & RiplChartListeners<RadialBarChartEventMap>, RadialBarChart>;

/** A realtime chart streaming values through a fixed time window. */
export const RiplRealtimeChart = defineRiplChart({
    name: 'RiplRealtimeChart',
    optionKeys: CHART_OPTION_KEYS.realtime,
    events: RealtimeChart.prototype.$events as string[],
    create: chartFactory<RealtimeChartOptions>(createRealtimeChart),
}) as unknown as RiplComponent<RealtimeChartOptions, RealtimeChart>;

/** A sankey diagram of flows between nodes, sized by value. */
export const RiplSankeyChart = defineRiplChart({
    name: 'RiplSankeyChart',
    optionKeys: CHART_OPTION_KEYS.sankey,
    events: SankeyChart.prototype.$events as string[],
    create: chartFactory<SankeyChartOptions<unknown>>(createSankeyChart),
}) as unknown as RiplComponent<SankeyChartOptions<unknown> & RiplChartListeners<SankeyChartEventMap<unknown>>, SankeyChart>;

/** A scatter chart plotting points by two continuous values. */
export const RiplScatterChart = defineRiplChart({
    name: 'RiplScatterChart',
    optionKeys: CHART_OPTION_KEYS.scatter,
    events: ScatterChart.prototype.$events as string[],
    create: chartFactory<ScatterChartOptions<unknown>>(createScatterChart),
}) as unknown as RiplComponent<ScatterChartOptions<unknown> & RiplChartListeners<ScatterChartEventMap>, ScatterChart>;

/** A stock chart of candlestick or OHLC bars, with optional volume. */
export const RiplStockChart = defineRiplChart({
    name: 'RiplStockChart',
    optionKeys: CHART_OPTION_KEYS.stock,
    events: StockChart.prototype.$events as string[],
    create: chartFactory<StockChartOptions<unknown>>(createStockChart),
}) as unknown as RiplComponent<StockChartOptions<unknown> & RiplChartListeners<StockChartEventMap>, StockChart>;

/** A sunburst chart of a hierarchy as concentric rings. */
export const RiplSunburstChart = defineRiplChart({
    name: 'RiplSunburstChart',
    optionKeys: CHART_OPTION_KEYS.sunburst,
    events: SunburstChart.prototype.$events as string[],
    create: chartFactory<SunburstChartOptions<unknown>>(createSunburstChart),
}) as unknown as RiplComponent<SunburstChartOptions<unknown> & RiplChartListeners<SunburstChartEventMap<unknown>>, SunburstChart>;

/** A treemap of a hierarchy as nested rectangles. */
export const RiplTreemapChart = defineRiplChart({
    name: 'RiplTreemapChart',
    optionKeys: CHART_OPTION_KEYS.treemap,
    events: TreemapChart.prototype.$events as string[],
    create: chartFactory<TreemapChartOptions<unknown>>(createTreemapChart),
}) as unknown as RiplComponent<TreemapChartOptions<unknown> & RiplChartListeners<TreemapChartEventMap>, TreemapChart>;

/** A trend chart mixing line, area and bar series on shared axes. */
export const RiplTrendChart = defineRiplChart({
    name: 'RiplTrendChart',
    optionKeys: CHART_OPTION_KEYS.trend,
    events: TrendChart.prototype.$events as string[],
    create: chartFactory<TrendChartOptions<unknown>>(createTrendChart),
}) as unknown as RiplComponent<TrendChartOptions<unknown> & RiplChartListeners<TrendChartEventMap>, TrendChart>;

