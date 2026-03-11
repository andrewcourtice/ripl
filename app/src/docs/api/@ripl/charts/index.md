[Documentation](../../packages.md) / @ripl/charts

# @ripl/charts

Pre-built, animated chart components for [Ripl](https://www.ripl.rocks) — a unified API for 2D graphics rendering in the browser.

## Installation

```bash
npm install @ripl/charts
```

## Chart Types

| Category | Charts |
|----------|--------|
| **Cartesian** | Bar, Line, Area, Scatter, Trend (multi-series bar/line), Stock, Realtime |
| **Radial** | Pie/Donut, Radar, Polar Area, Gauge, Sunburst |
| **Relational** | Sankey, Chord |
| **Distribution** | Heatmap, Treemap, Funnel |
| **Scheduling** | Gantt |

## Usage

```typescript
import {
    BarChart,
} from '@ripl/charts';

const chart = new BarChart('#chart', {
    data: [
        { label: 'A',
            value: 10 },
        { label: 'B',
            value: 25 },
        { label: 'C',
            value: 15 },
    ],
    keyBy: 'label',
    series: [
        { valueBy: item => item.value },
    ],
});
```

## Features

- **Animated transitions** — Smooth entry, update, and exit animations out of the box
- **Interactive** — Tooltips, crosshairs, hover effects, and click events
- **Configurable** — Axes, legends, grids, colors, padding, and more
- **Canvas & SVG** — Renders to either context via Ripl's unified API
- **Tree-shakable** — Import only the chart types you need

## Documentation

Full documentation, options reference, and interactive demos are available at [ripl.rocks](https://www.ripl.rocks).

## License

[MIT](../../_media/LICENSE)

## Classes

| Class | Description |
| ------ | ------ |
| [AreaChart](classes/AreaChart.md) | Area chart rendering filled regions beneath series lines. |
| [BarChart](classes/BarChart.md) | Bar chart supporting vertical/horizontal orientation and grouped/stacked modes. |
| [Chart](classes/Chart.md) | Abstract base class for all chart types, providing scene, renderer, animation, color management, and lifecycle. |
| [ChordChart](classes/ChordChart.md) | Chord diagram visualizing inter-relationships in a square matrix. |
| [FunnelChart](classes/FunnelChart.md) | Funnel chart rendering horizontally centered bars of decreasing width. |
| [GanttChart](classes/GanttChart.md) | Gantt chart rendering time-based task bars on a categorical y-axis and time x-axis. |
| [GaugeChart](classes/GaugeChart.md) | Gauge chart displaying a single value on a 270-degree arc. |
| [HeatmapChart](classes/HeatmapChart.md) | Heatmap chart rendering a grid of colored cells on two categorical axes. |
| [LineChart](classes/LineChart.md) | Line chart rendering one or more series as polylines with optional markers. |
| [PieChart](classes/PieChart.md) | Pie chart rendering proportional arc segments with optional inner radius (donut). |
| [PolarAreaChart](classes/PolarAreaChart.md) | Polar area chart rendering equal-angle segments whose radius encodes value. |
| [RadarChart](classes/RadarChart.md) | Radar (spider) chart plotting multi-axis data as filled polygonal areas. |
| [RealtimeChart](classes/RealtimeChart.md) | Realtime streaming chart rendering continuously updating line/area series. |
| [Ribbon](classes/Ribbon.md) | A chord diagram ribbon connecting two arc segments with quadratic Bézier curves through the center. |
| [SankeyChart](classes/SankeyChart.md) | Sankey diagram visualizing directional flow between nodes. |
| [SankeyLinkPath](classes/SankeyLinkPath.md) | A curved Sankey link shape rendered as a cubic Bézier curve between source and target points. |
| [ScatterChart](classes/ScatterChart.md) | Scatter chart (bubble chart) plotting data points as circles on two continuous axes. |
| [StockChart](classes/StockChart.md) | Candlestick (stock) chart rendering OHLC data with optional volume bars. |
| [SunburstChart](classes/SunburstChart.md) | Sunburst chart rendering hierarchical data as concentric arc rings. |
| [TreemapChart](classes/TreemapChart.md) | Treemap chart rendering hierarchical data as nested, space-filling rectangles. |
| [TrendChart](classes/TrendChart.md) | Trend chart combining bar and line series on shared categorical/value axes. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [AreaChartOptions](interfaces/AreaChartOptions.md) | Options for configuring an [AreaChart](classes/AreaChart.md). |
| [AreaChartSeriesOptions](interfaces/AreaChartSeriesOptions.md) | Configuration for an individual area chart series. |
| [BarChartOptions](interfaces/BarChartOptions.md) | Options for configuring a [BarChart](classes/BarChart.md). |
| [BarChartSeriesOptions](interfaces/BarChartSeriesOptions.md) | Configuration for an individual bar chart series. |
| [BaseChartOptions](interfaces/BaseChartOptions.md) | Base options shared by all chart types. |
| [BaseTrendChartSeriesOptions](interfaces/BaseTrendChartSeriesOptions.md) | Base configuration shared by all trend chart series types. |
| [ChartAnimationOptions](interfaces/ChartAnimationOptions.md) | Fully resolved chart animation options. |
| [ChartArea](interfaces/ChartArea.md) | The computed drawing area of a chart after padding is applied. |
| [ChartAxisItemOptions](interfaces/ChartAxisItemOptions.md) | Options for a single axis (x or y). |
| [ChartAxisOptions](interfaces/ChartAxisOptions.md) | Combined x and y axis configuration. |
| [ChartCrosshairOptions](interfaces/ChartCrosshairOptions.md) | Fully resolved chart crosshair options. |
| [ChartGridOptions](interfaces/ChartGridOptions.md) | Fully resolved chart grid options. |
| [ChartLegendOptions](interfaces/ChartLegendOptions.md) | Fully resolved chart legend options. |
| [ChartPadding](interfaces/ChartPadding.md) | Chart padding with explicit top, right, bottom, and left values. |
| [ChartTitleOptions](interfaces/ChartTitleOptions.md) | Fully resolved chart title options. |
| [ChartTooltipOptions](interfaces/ChartTooltipOptions.md) | Fully resolved chart tooltip options. |
| [ChartYAxisItemOptions](interfaces/ChartYAxisItemOptions.md) | Y-axis specific options extending the base axis item with a left/right position. |
| [ChordChartOptions](interfaces/ChordChartOptions.md) | Options for configuring a [ChordChart](classes/ChordChart.md). |
| [FunnelChartOptions](interfaces/FunnelChartOptions.md) | Options for configuring a [FunnelChart](classes/FunnelChart.md). |
| [GanttChartOptions](interfaces/GanttChartOptions.md) | Options for configuring a [GanttChart](classes/GanttChart.md). |
| [GaugeChartOptions](interfaces/GaugeChartOptions.md) | Options for configuring a [GaugeChart](classes/GaugeChart.md). |
| [HeatmapChartOptions](interfaces/HeatmapChartOptions.md) | Options for configuring a [HeatmapChart](classes/HeatmapChart.md). |
| [LineChartOptions](interfaces/LineChartOptions.md) | Options for configuring a [LineChart](classes/LineChart.md). |
| [LineChartSeriesOptions](interfaces/LineChartSeriesOptions.md) | Configuration for an individual line chart series. |
| [Padding](interfaces/Padding.md) | Resolved padding with explicit top, right, bottom, and left values. |
| [PieChartOptions](interfaces/PieChartOptions.md) | Options for configuring a [PieChart](classes/PieChart.md). |
| [PolarAreaChartOptions](interfaces/PolarAreaChartOptions.md) | Options for configuring a [PolarAreaChart](classes/PolarAreaChart.md). |
| [RadarChartOptions](interfaces/RadarChartOptions.md) | Options for configuring a [RadarChart](classes/RadarChart.md). |
| [RadarChartSeriesOptions](interfaces/RadarChartSeriesOptions.md) | Configuration for an individual radar chart series. |
| [RealtimeChartOptions](interfaces/RealtimeChartOptions.md) | Options for configuring a [RealtimeChart](classes/RealtimeChart.md). |
| [RealtimeChartSeriesOptions](interfaces/RealtimeChartSeriesOptions.md) | Configuration for an individual realtime chart series. |
| [RibbonState](interfaces/RibbonState.md) | State interface for a ribbon shape connecting two arc segments via quadratic curves. |
| [SankeyChartOptions](interfaces/SankeyChartOptions.md) | Options for configuring a [SankeyChart](classes/SankeyChart.md). |
| [SankeyLink](interfaces/SankeyLink.md) | A directional flow between two nodes in a Sankey diagram. |
| [SankeyLinkState](interfaces/SankeyLinkState.md) | State interface for a Sankey link, defining source and target endpoint coordinates. |
| [SankeyNode](interfaces/SankeyNode.md) | A node in a Sankey diagram. |
| [ScatterChartOptions](interfaces/ScatterChartOptions.md) | Options for configuring a [ScatterChart](classes/ScatterChart.md). |
| [ScatterChartSeriesOptions](interfaces/ScatterChartSeriesOptions.md) | Configuration for an individual scatter chart series. |
| [StockChartOptions](interfaces/StockChartOptions.md) | Options for configuring a [StockChart](classes/StockChart.md). |
| [SunburstChartOptions](interfaces/SunburstChartOptions.md) | Options for configuring a [SunburstChart](classes/SunburstChart.md). |
| [SunburstNode](interfaces/SunburstNode.md) | A node in a sunburst hierarchy with optional nested children. |
| [TreemapChartOptions](interfaces/TreemapChartOptions.md) | Options for configuring a [TreemapChart](classes/TreemapChart.md). |
| [TrendChartAreaSeriesOptions](interfaces/TrendChartAreaSeriesOptions.md) | Series options for area-type series within a trend chart. |
| [TrendChartBarSeriesOptions](interfaces/TrendChartBarSeriesOptions.md) | Series options for bar-type series within a trend chart. |
| [TrendChartLineSeriesOptions](interfaces/TrendChartLineSeriesOptions.md) | Series options for line-type series within a trend chart. |
| [TrendChartOptions](interfaces/TrendChartOptions.md) | Options for configuring a [TrendChart](classes/TrendChart.md). |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AxisFormatType](type-aliases/AxisFormatType.md) | Built-in axis label format types. |
| [BarChartMode](type-aliases/BarChartMode.md) | - |
| [BarChartOrientation](type-aliases/BarChartOrientation.md) | - |
| [BorderRadiusInput](type-aliases/BorderRadiusInput.md) | Border radius expressed as a uniform number or a per-corner tuple. |
| [ChartAnimationInput](type-aliases/ChartAnimationInput.md) | Animation input accepting a boolean toggle or partial options object. |
| [ChartAxisInput](type-aliases/ChartAxisInput.md) | Axis input accepting a boolean toggle or a full axis options object. |
| [ChartCrosshairInput](type-aliases/ChartCrosshairInput.md) | Crosshair input accepting a boolean toggle or partial options object. |
| [ChartGridInput](type-aliases/ChartGridInput.md) | Grid input accepting a boolean toggle or partial options object. |
| [ChartLegendInput](type-aliases/ChartLegendInput.md) | Legend input accepting a boolean, position string, or partial options object. |
| [ChartOptions](type-aliases/ChartOptions.md) | - |
| [ChartTitleInput](type-aliases/ChartTitleInput.md) | Title input accepting a plain string or partial options object. |
| [ChartTooltipInput](type-aliases/ChartTooltipInput.md) | Tooltip input accepting a boolean toggle or partial options object. |
| [CrosshairAxis](type-aliases/CrosshairAxis.md) | Which axis the crosshair tracks. |
| [EaseName](type-aliases/EaseName.md) | Named easing function identifiers. |
| [LegendPosition](type-aliases/LegendPosition.md) | Position of the chart legend relative to the chart area. |
| [PaddingInput](type-aliases/PaddingInput.md) | Padding expressed as a uniform number or a [top, right, bottom, left] tuple. |
| [SeriesType](type-aliases/SeriesType.md) | Supported series visualization types within a trend chart. |
| [TitlePosition](type-aliases/TitlePosition.md) | Position of the chart title relative to the chart area. |
| [TrendChartSeriesOptions](type-aliases/TrendChartSeriesOptions.md) | Discriminated union of all trend chart series option types. |

## Functions

| Function | Description |
| ------ | ------ |
| [createAreaChart](functions/createAreaChart.md) | Factory function that creates a new [AreaChart](classes/AreaChart.md) instance. |
| [createBarChart](functions/createBarChart.md) | Factory function that creates a new [BarChart](classes/BarChart.md) instance. |
| [createChordChart](functions/createChordChart.md) | Factory function that creates a new [ChordChart](classes/ChordChart.md) instance. |
| [createFunnelChart](functions/createFunnelChart.md) | Factory function that creates a new [FunnelChart](classes/FunnelChart.md) instance. |
| [createGanttChart](functions/createGanttChart.md) | Factory function that creates a new [GanttChart](classes/GanttChart.md) instance. |
| [createGaugeChart](functions/createGaugeChart.md) | Factory function that creates a new [GaugeChart](classes/GaugeChart.md) instance. |
| [createHeatmapChart](functions/createHeatmapChart.md) | Factory function that creates a new [HeatmapChart](classes/HeatmapChart.md) instance. |
| [createLineChart](functions/createLineChart.md) | Factory function that creates a new [LineChart](classes/LineChart.md) instance. |
| [createPieChart](functions/createPieChart.md) | Factory function that creates a new [PieChart](classes/PieChart.md) instance. |
| [createPolarAreaChart](functions/createPolarAreaChart.md) | Factory function that creates a new [PolarAreaChart](classes/PolarAreaChart.md) instance. |
| [createRadarChart](functions/createRadarChart.md) | Factory function that creates a new [RadarChart](classes/RadarChart.md) instance. |
| [createRealtimeChart](functions/createRealtimeChart.md) | Factory function that creates a new [RealtimeChart](classes/RealtimeChart.md) instance. |
| [createRibbon](functions/createRibbon.md) | Factory function that creates a new `Ribbon` instance. |
| [createSankeyChart](functions/createSankeyChart.md) | Factory function that creates a new [SankeyChart](classes/SankeyChart.md) instance. |
| [createSankeyLink](functions/createSankeyLink.md) | Factory function that creates a new `SankeyLinkPath` instance. |
| [createScatterChart](functions/createScatterChart.md) | Factory function that creates a new [ScatterChart](classes/ScatterChart.md) instance. |
| [createStockChart](functions/createStockChart.md) | Factory function that creates a new [StockChart](classes/StockChart.md) instance. |
| [createSunburstChart](functions/createSunburstChart.md) | Factory function that creates a new [SunburstChart](classes/SunburstChart.md) instance. |
| [createTreemapChart](functions/createTreemapChart.md) | Factory function that creates a new [TreemapChart](classes/TreemapChart.md) instance. |
| [createTrendChart](functions/createTrendChart.md) | Factory function that creates a new [TrendChart](classes/TrendChart.md) instance. |
| [elementIsRibbon](functions/elementIsRibbon.md) | Type guard that checks whether a value is a `Ribbon` instance. |
| [elementIsSankeyLink](functions/elementIsSankeyLink.md) | Type guard that checks whether a value is a `SankeyLinkPath` instance. |
| [normalizeAnimation](functions/normalizeAnimation.md) | Normalizes animation input into fully resolved `ChartAnimationOptions`. |
| [normalizeAxis](functions/normalizeAxis.md) | Normalizes axis input into a full `ChartAxisOptions` object with both x and y. |
| [normalizeAxisItem](functions/normalizeAxisItem.md) | Normalizes a single axis item input into fully resolved options. |
| [normalizeCrosshair](functions/normalizeCrosshair.md) | Normalizes crosshair input into fully resolved `ChartCrosshairOptions`. |
| [normalizeGrid](functions/normalizeGrid.md) | Normalizes grid input into fully resolved `ChartGridOptions`. |
| [normalizeLegend](functions/normalizeLegend.md) | Normalizes legend input into fully resolved `ChartLegendOptions`. |
| [normalizePadding](functions/normalizePadding.md) | Normalizes a padding input into a `Padding` object, or returns `undefined` if no input. |
| [normalizeTitle](functions/normalizeTitle.md) | Normalizes a title input into fully resolved `ChartTitleOptions`. |
| [normalizeTooltip](functions/normalizeTooltip.md) | Normalizes tooltip input into fully resolved `ChartTooltipOptions`. |
| [normalizeYAxisItem](functions/normalizeYAxisItem.md) | Normalizes a Y-axis item input into fully resolved options with position. |
| [resolveEase](functions/resolveEase.md) | Resolves an ease name or function to an `Ease` function, defaulting to `easeOutCubic`. |
| [resolveFormatLabel](functions/resolveFormatLabel.md) | Resolves an axis format type or custom formatter into a label formatting function. |
