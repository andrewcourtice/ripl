---
outline: "deep"
---

# Charts

<p class="api-package-badge"><code>@ripl/charts</code></p>

All chart types: Bar, Line, Area, Pie, Scatter, and more.

## Overview

**Classes:** [`AreaChart`](#areachart) · [`BarChart`](#barchart) · [`ChordChart`](#chordchart) · [`FunnelChart`](#funnelchart) · [`GanttChart`](#ganttchart) · [`GaugeChart`](#gaugechart) · [`HeatmapChart`](#heatmapchart) · [`LineChart`](#linechart) · [`PieChart`](#piechart) · [`PolarAreaChart`](#polarareachart) · [`RadarChart`](#radarchart) · [`SankeyChart`](#sankeychart) · [`ScatterChart`](#scatterchart) · [`StockChart`](#stockchart) · [`SunburstChart`](#sunburstchart) · [`TreemapChart`](#treemapchart) · [`RealtimeChart`](#realtimechart) · [`TrendChart`](#trendchart)

**Interfaces:** [`AreaChartSeriesOptions`](#areachartseriesoptions) · [`AreaChartOptions`](#areachartoptions) · [`BarChartSeriesOptions`](#barchartseriesoptions) · [`BarChartOptions`](#barchartoptions) · [`ChordChartOptions`](#chordchartoptions) · [`FunnelChartOptions`](#funnelchartoptions) · [`GanttChartOptions`](#ganttchartoptions) · [`GaugeChartOptions`](#gaugechartoptions) · [`HeatmapChartOptions`](#heatmapchartoptions) · [`LineChartSeriesOptions`](#linechartseriesoptions) · [`LineChartOptions`](#linechartoptions) · [`PieChartOptions`](#piechartoptions) · [`PolarAreaChartOptions`](#polarareachartoptions) · [`RadarChartSeriesOptions`](#radarchartseriesoptions) · [`RadarChartOptions`](#radarchartoptions) · [`SankeyLink`](#sankeylink) · [`SankeyNode`](#sankeynode) · [`SankeyChartOptions`](#sankeychartoptions) · [`ScatterChartSeriesOptions`](#scatterchartseriesoptions) · [`ScatterChartOptions`](#scatterchartoptions) · [`StockChartOptions`](#stockchartoptions) · [`SunburstNode`](#sunburstnode) · [`SunburstChartOptions`](#sunburstchartoptions) · [`TreemapChartOptions`](#treemapchartoptions) · [`RealtimeChartSeriesOptions`](#realtimechartseriesoptions) · [`RealtimeChartOptions`](#realtimechartoptions) · [`BaseTrendChartSeriesOptions`](#basetrendchartseriesoptions) · [`TrendChartBarSeriesOptions`](#trendchartbarseriesoptions) · [`TrendChartAreaSeriesOptions`](#trendchartareaseriesoptions) · [`TrendChartLineSeriesOptions`](#trendchartlineseriesoptions) · [`TrendChartOptions`](#trendchartoptions)

**Type Aliases:** [`BarChartOrientation`](#barchartorientation) · [`BarChartMode`](#barchartmode) · [`SeriesType`](#seriestype) · [`TrendChartSeriesOptions`](#trendchartseriesoptions)

**Functions:** [`createAreaChart`](#createareachart) · [`createBarChart`](#createbarchart) · [`createChordChart`](#createchordchart) · [`createFunnelChart`](#createfunnelchart) · [`createGanttChart`](#createganttchart) · [`createGaugeChart`](#creategaugechart) · [`createHeatmapChart`](#createheatmapchart) · [`createLineChart`](#createlinechart) · [`createPieChart`](#createpiechart) · [`createPolarAreaChart`](#createpolarareachart) · [`createRadarChart`](#createradarchart) · [`createSankeyChart`](#createsankeychart) · [`createScatterChart`](#createscatterchart) · [`createStockChart`](#createstockchart) · [`createSunburstChart`](#createsunburstchart) · [`createTreemapChart`](#createtreemapchart) · [`createRealtimeChart`](#createrealtimechart) · [`createTrendChart`](#createtrendchart)

### AreaChart `class`

Area chart rendering filled regions beneath series lines.

Supports stacked and unstacked modes with optional markers, crosshair,
tooltips, legend, and grid. Areas animate upward from the baseline on
entry and smoothly transition on update.

```ts
class AreaChart<TData = unknown> extends Chart<AreaChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `AreaChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;AreaChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;AreaChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### BarChart `class`

Bar chart supporting vertical/horizontal orientation and grouped/stacked modes.

Uses band scales for categorical axes and continuous scales for value axes.
Supports multiple series with grouped or stacked bar rendering, interactive
tooltips, legend, grid, and animated entry/update/exit transitions.

```ts
class BarChart<TData = unknown> extends Chart<BarChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `BarChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;BarChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;BarChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### ChordChart `class`

Chord diagram visualizing inter-relationships in a square matrix.

Outer arcs represent groups (labels) with angular extent proportional
to their total flow. Inner ribbons connect pairs of groups with width
proportional to the flow value. Supports legend, tooltips, and
sequential animation (arcs first, then ribbons).

```ts
class ChordChart extends Chart<ChordChartOptions>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `ChordChartOptions` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;ChordChartOptions&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;ChordChartOptions&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### FunnelChart `class`

Funnel chart rendering horizontally centered bars of decreasing width.

Each data item is rendered as a centered rectangle whose width is
proportional to its value relative to the maximum. Segments are stacked
vertically with configurable gaps. Supports tooltips, labels, and
animated expand-from-center entry transitions.

```ts
class FunnelChart<TData = unknown> extends Chart<FunnelChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `FunnelChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;FunnelChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;FunnelChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### GanttChart `class`

Gantt chart rendering time-based task bars on a categorical y-axis and time x-axis.

Each data item is rendered as a horizontal bar spanning its start-to-end date range.
Supports optional progress overlays, a "today" marker line, tooltips, grid, and
staggered entry animations.

```ts
class GanttChart<TData = unknown> extends Chart<GanttChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `GanttChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;GanttChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;GanttChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### GaugeChart `class`

Gauge chart displaying a single value on a 270-degree arc.

Renders a background track arc and an animated value arc spanning from
the minimum to the current value. Supports configurable tick marks
with labels, a central value display, and an optional descriptive label.

```ts
class GaugeChart extends Chart<GaugeChartOptions>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `GaugeChartOptions` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;GaugeChartOptions&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;GaugeChartOptions&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### HeatmapChart `class`

Heatmap chart rendering a grid of colored cells on two categorical axes.

Cell color is interpolated between a configurable low/high color range
based on each data point's value. Supports x/y axes, tooltips, and
animated fade-in entry transitions with smooth color updates.

```ts
class HeatmapChart<TData = unknown> extends Chart<HeatmapChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `HeatmapChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;HeatmapChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;HeatmapChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### LineChart `class`

Line chart rendering one or more series as polylines with optional markers.

Supports customisable line renderers (e.g. curved, stepped), interactive
crosshair, tooltips, legend, and grid. Entry animations draw lines
progressively while markers appear with staggered delays.

```ts
class LineChart<TData = unknown> extends Chart<LineChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `LineChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;LineChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;LineChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### PieChart `class`

Pie chart rendering proportional arc segments with optional inner radius (donut).

Supports interactive tooltips, legend, and animated entry/update/exit
transitions. Segments grow outward from the center with staggered delays,
and labels fade in after the arcs have settled.

```ts
class PieChart<TData = unknown> extends Chart<PieChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `PieChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;PieChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;PieChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### PolarAreaChart `class`

Polar area chart rendering equal-angle segments whose radius encodes value.

Each data point occupies an equal angular slice; the radial extent of each
segment is proportional to its value. Includes a concentric grid with
value labels, radial axis lines, and animated entry/update/exit transitions.

```ts
class PolarAreaChart<TData = unknown> extends Chart<PolarAreaChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `PolarAreaChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;PolarAreaChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;PolarAreaChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### RadarChart `class`

Radar (spider) chart plotting multi-axis data as filled polygonal areas.

Renders a circular grid with concentric rings and radial axis lines,
then overlays one or more series as filled polyline areas with markers.
Supports interactive tooltips, legend, and animated transitions.

```ts
class RadarChart<TData = unknown> extends Chart<RadarChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `RadarChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;RadarChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;RadarChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### SankeyChart `class`

Sankey diagram visualizing directional flow between nodes.

Nodes are positioned in depth columns computed via BFS, with heights
proportional to their total flow value. Links are rendered as curved
paths connecting source and target nodes. Supports tooltips and
staggered entry animations for nodes, labels, and links.

```ts
class SankeyChart extends Chart<SankeyChartOptions>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `SankeyChartOptions` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;SankeyChartOptions&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;SankeyChartOptions&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### ScatterChart `class`

Scatter chart (bubble chart) plotting data points as circles on two continuous axes.

Supports optional bubble sizing via a third value dimension, multi-series
rendering, crosshair, tooltips, legend, and grid. Points animate in with
staggered scale transitions.

```ts
class ScatterChart<TData = unknown> extends Chart<ScatterChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `ScatterChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;ScatterChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;ScatterChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### StockChart `class`

Candlestick (stock) chart rendering OHLC data with optional volume bars.

Each data point is rendered as a candlestick with a body (open-close range)
and wick (high-low range), colored by direction. Supports an optional
volume sub-chart, crosshair, tooltips, grid, and animated entry/update
transitions.

```ts
class StockChart<TData = unknown> extends Chart<StockChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `StockChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;StockChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;StockChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### SunburstChart `class`

Sunburst chart rendering hierarchical data as concentric arc rings.

Each depth level is rendered as a ring of arc segments whose angular
extent is proportional to the node's value. Child nodes inherit parent
colors and are positioned within the parent's angular range. Supports
legend, tooltips, and staggered radial entry animations.

```ts
class SunburstChart extends Chart<SunburstChartOptions>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `SunburstChartOptions` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;SunburstChartOptions&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;SunburstChartOptions&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### TreemapChart `class`

Treemap chart rendering hierarchical data as nested, space-filling rectangles.

Uses a recursive binary split layout to partition the available area
proportionally by value. Supports tooltips, auto-sized labels for
sufficiently large cells, and animated entry/update transitions.

```ts
class TreemapChart<TData = unknown> extends Chart<TreemapChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `TreemapChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;TreemapChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;TreemapChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### RealtimeChart `class`

Realtime streaming chart rendering continuously updating line/area series.

Data is pushed incrementally via {@link RealtimeChart.push} and maintained
in a fixed-size sliding window buffer. Each render cycle smoothly transitions
polylines to reflect the latest data. Supports y-axis, grid, crosshair,
legend, and configurable transition duration.

```ts
class RealtimeChart extends Chart<RealtimeChartOptions>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `RealtimeChartOptions` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `push(values: Record&lt;string, number&gt;): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `values` | `Record&lt;string, number&gt;` |  |

#### `clear(): void`

#### `update(options: Partial&lt;RealtimeChartOptions&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;RealtimeChartOptions&gt;` |  |

#### `render(): Promise&lt;void&gt;`

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### TrendChart `class`

Trend chart combining bar and line series on shared categorical/value axes.

Renders bar series as grouped rectangles and line series as polylines with
markers on the same chart area. Supports tooltips, legend, grid, and
animated entry/update/exit transitions for both series types.

```ts
class TrendChart<TData = unknown> extends Chart<TrendChartOptions<TData>>
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `TrendChartOptions&lt;TData&gt;` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `parent` | `EventBus&lt;EventMap&gt; \| undefined` |  |

**Methods:**

#### `render(): Promise&lt;void&gt;`

#### `update(options: Partial&lt;TrendChartOptions&lt;TData&gt;&gt;): void`

Merges partial options into the current options and re-renders if `autoRender` is enabled.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `options` | `Partial&lt;TrendChartOptions&lt;TData&gt;&gt;` |  |

#### `destroy(): void`

Destroys the chart, its scene, context, and cleans up all event subscriptions.

#### `has(type: keyof EventMap): boolean`

Returns whether there are any listeners registered for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `keyof EventMap` |  |

#### `on(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler to the given event type and returns a disposable for cleanup.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `off(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;): void`

Removes a previously registered handler for the given event type.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |

#### `once(type: TEvent, handler: EventHandler&lt;EventMap[TEvent]&gt;, options: EventSubscriptionOptions \| undefined): Disposable`

Subscribes a handler that is automatically removed after it fires once.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `type` | `TEvent` |  |
| `handler` | `EventHandler&lt;EventMap[TEvent]&gt;` |  |
| `options` | `EventSubscriptionOptions \| undefined` |  |

#### `emit(event: TEvent): TEvent`

Emits an event, invoking all matching handlers and bubbling to the parent if applicable.


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `event` | `TEvent` |  |

---

### AreaChartSeriesOptions `interface`

Configuration for an individual area chart series.

```ts
interface AreaChartSeriesOptions<TData> {
    id: string;
    color?: string;
    value: keyof TData | number | ((item: TData) => number);
    label: string;
    lineType?: PolylineRenderer;
    lineWidth?: number;
    opacity?: number;
    markers?: boolean;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `color?` | `string \| undefined` |  |
| `value` | `number \| keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `string` |  |
| `lineType?` | `PolylineRenderer \| undefined` |  |
| `lineWidth?` | `number \| undefined` |  |
| `opacity?` | `number \| undefined` |  |
| `markers?` | `boolean \| undefined` |  |
---

### AreaChartOptions `interface`

Options for configuring an {@link AreaChart}.

```ts
interface AreaChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: AreaChartSeriesOptions<TData>[];
    key: keyof TData | ((item: TData) => string);
    stacked?: boolean;
    grid?: ChartGridInput;
    crosshair?: ChartCrosshairInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    axis?: ChartAxisInput<TData>;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `series` | `AreaChartSeriesOptions&lt;TData&gt;[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `stacked?` | `boolean \| undefined` |  |
| `grid?` | `ChartGridInput \| undefined` |  |
| `crosshair?` | `ChartCrosshairInput \| undefined` |  |
| `tooltip?` | `ChartTooltipInput \| undefined` |  |
| `legend?` | `ChartLegendInput \| undefined` |  |
| `axis?` | `ChartAxisInput&lt;TData&gt; \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### BarChartSeriesOptions `interface`

Configuration for an individual bar chart series.

```ts
interface BarChartSeriesOptions<TData> {
    id: string;
    color?: string;
    value: keyof TData | number | ((item: TData) => number);
    label: string;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `color?` | `string \| undefined` |  |
| `value` | `number \| keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `string` |  |
---

### BarChartOptions `interface`

Options for configuring a {@link BarChart}.

```ts
interface BarChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: BarChartSeriesOptions<TData>[];
    key: keyof TData | ((item: TData) => string);
    orientation?: BarChartOrientation;
    mode?: BarChartMode;
    grid?: ChartGridInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    axis?: ChartAxisInput<TData>;
    borderRadius?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `series` | `BarChartSeriesOptions&lt;TData&gt;[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `orientation?` | `BarChartOrientation \| undefined` |  |
| `mode?` | `BarChartMode \| undefined` |  |
| `grid?` | `ChartGridInput \| undefined` |  |
| `tooltip?` | `ChartTooltipInput \| undefined` |  |
| `legend?` | `ChartLegendInput \| undefined` |  |
| `axis?` | `ChartAxisInput&lt;TData&gt; \| undefined` |  |
| `borderRadius?` | `number \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### ChordChartOptions `interface`

Options for configuring a {@link ChordChart}.

```ts
interface ChordChartOptions extends BaseChartOptions {
    labels: string[];
    matrix: number[][];
    colors?: string[];
    padAngle?: number;
    legend?: ChartLegendInput;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `labels` | `string[]` |  |
| `matrix` | `number[][]` |  |
| `colors?` | `string[] \| undefined` |  |
| `padAngle?` | `number \| undefined` |  |
| `legend?` | `ChartLegendInput \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### FunnelChartOptions `interface`

Options for configuring a {@link FunnelChart}.

```ts
interface FunnelChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    gap?: number;
    borderRadius?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `value` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `color?` | `keyof TData \| ((item: TData) =&gt; string) \| undefined` |  |
| `gap?` | `number \| undefined` |  |
| `borderRadius?` | `number \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### GanttChartOptions `interface`

Options for configuring a {@link GanttChart}.

```ts
interface GanttChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    label: keyof TData | ((item: TData) => string);
    start: keyof TData | ((item: TData) => Date);
    end: keyof TData | ((item: TData) => Date);
    color?: keyof TData | ((item: TData) => string);
    progress?: keyof TData | ((item: TData) => number);
    grid?: ChartGridInput;
    tooltip?: ChartTooltipInput;
    axis?: ChartAxisInput<TData>;
    showToday?: boolean;
    todayColor?: string;
    borderRadius?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `label` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `start` | `keyof TData \| ((item: TData) =&gt; Date)` |  |
| `end` | `keyof TData \| ((item: TData) =&gt; Date)` |  |
| `color?` | `keyof TData \| ((item: TData) =&gt; string) \| undefined` |  |
| `progress?` | `keyof TData \| ((item: TData) =&gt; number) \| undefined` |  |
| `grid?` | `ChartGridInput \| undefined` |  |
| `tooltip?` | `ChartTooltipInput \| undefined` |  |
| `axis?` | `ChartAxisInput&lt;TData&gt; \| undefined` |  |
| `showToday?` | `boolean \| undefined` |  |
| `todayColor?` | `string \| undefined` |  |
| `borderRadius?` | `number \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### GaugeChartOptions `interface`

Options for configuring a {@link GaugeChart}.

```ts
interface GaugeChartOptions extends BaseChartOptions {
    value: number;
    min?: number;
    max?: number;
    label?: string;
    color?: string;
    trackColor?: string;
    formatValue?: (value: number) => string;
    /** Number of tick marks along the gauge arc. Defaults to 5. Set to 0 to hide. */
    tickCount?: number;
    /** Whether to show value labels at each tick. Defaults to true. */
    showTickLabels?: boolean;
    /** Format function for tick labels */
    formatTickLabel?: (value: number) => string;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `value` | `number` |  |
| `min?` | `number \| undefined` |  |
| `max?` | `number \| undefined` |  |
| `label?` | `string \| undefined` |  |
| `color?` | `string \| undefined` |  |
| `trackColor?` | `string \| undefined` |  |
| `formatValue?` | `((value: number) =&gt; string) \| undefined` |  |
| `tickCount?` | `number \| undefined` | Number of tick marks along the gauge arc. Defaults to 5. Set to 0 to hide. |
| `showTickLabels?` | `boolean \| undefined` | Whether to show value labels at each tick. Defaults to true. |
| `formatTickLabel?` | `((value: number) =&gt; string) \| undefined` | Format function for tick labels |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### HeatmapChartOptions `interface`

Options for configuring a {@link HeatmapChart}.

```ts
interface HeatmapChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    xBy: keyof TData | ((item: TData) => string);
    yBy: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    xCategories: string[];
    yCategories: string[];
    colorRange?: [string, string];
    borderRadius?: number;
    tooltip?: ChartTooltipInput;
    axis?: ChartAxisInput<TData>;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `xBy` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `yBy` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `value` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `xCategories` | `string[]` |  |
| `yCategories` | `string[]` |  |
| `colorRange?` | `[string, string] \| undefined` |  |
| `borderRadius?` | `number \| undefined` |  |
| `tooltip?` | `ChartTooltipInput \| undefined` |  |
| `axis?` | `ChartAxisInput&lt;TData&gt; \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### LineChartSeriesOptions `interface`

Configuration for an individual line chart series.

```ts
interface LineChartSeriesOptions<TData> {
    id: string;
    color?: string;
    value: keyof TData | number | ((item: TData) => number);
    label: string | ((item: TData) => string);
    lineType?: PolylineRenderer;
    lineWidth?: number;
    markers?: boolean;
    markerRadius?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `color?` | `string \| undefined` |  |
| `value` | `number \| keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `string \| ((item: TData) =&gt; string)` |  |
| `lineType?` | `PolylineRenderer \| undefined` |  |
| `lineWidth?` | `number \| undefined` |  |
| `markers?` | `boolean \| undefined` |  |
| `markerRadius?` | `number \| undefined` |  |
---

### LineChartOptions `interface`

Options for configuring a {@link LineChart}.

```ts
interface LineChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: LineChartSeriesOptions<TData>[];
    key: keyof TData | ((item: TData) => string);
    grid?: ChartGridInput;
    crosshair?: ChartCrosshairInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    axis?: ChartAxisInput<TData>;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `series` | `LineChartSeriesOptions&lt;TData&gt;[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `grid?` | `ChartGridInput \| undefined` |  |
| `crosshair?` | `ChartCrosshairInput \| undefined` |  |
| `tooltip?` | `ChartTooltipInput \| undefined` |  |
| `legend?` | `ChartLegendInput \| undefined` |  |
| `axis?` | `ChartAxisInput&lt;TData&gt; \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### PieChartOptions `interface`

Options for configuring a {@link PieChart}.

```ts
interface PieChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    innerRadius?: number;
    legend?: ChartLegendInput;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `value` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `color?` | `keyof TData \| ((item: TData) =&gt; string) \| undefined` |  |
| `innerRadius?` | `number \| undefined` |  |
| `legend?` | `ChartLegendInput \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### PolarAreaChartOptions `interface`

Options for configuring a {@link PolarAreaChart}.

```ts
interface PolarAreaChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    /** Inner radius ratio (0 - 1). Defaults to 0.15 */
    innerRadiusRatio?: number;
    /** Maximum radius ratio (0 - 0.5). Defaults to 0.45 (similar to pie chart). */
    maxRadiusRatio?: number;
    /** Padding angle between segments in radians. Defaults to 0.02 */
    padAngle?: number;
    /** Number of concentric grid rings. Defaults to 4 */
    levels?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `value` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `color?` | `keyof TData \| ((item: TData) =&gt; string) \| undefined` |  |
| `innerRadiusRatio?` | `number \| undefined` | Inner radius ratio (0 - 1). Defaults to 0.15 |
| `maxRadiusRatio?` | `number \| undefined` | Maximum radius ratio (0 - 0.5). Defaults to 0.45 (similar to pie chart). |
| `padAngle?` | `number \| undefined` | Padding angle between segments in radians. Defaults to 0.02 |
| `levels?` | `number \| undefined` | Number of concentric grid rings. Defaults to 4 |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### RadarChartSeriesOptions `interface`

Configuration for an individual radar chart series.

```ts
interface RadarChartSeriesOptions<TData> {
    id: string;
    color?: string;
    label: string;
    value: keyof TData | ((item: TData) => number);
    opacity?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `color?` | `string \| undefined` |  |
| `label` | `string` |  |
| `value` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `opacity?` | `number \| undefined` |  |
---

### RadarChartOptions `interface`

Options for configuring a {@link RadarChart}.

```ts
interface RadarChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: RadarChartSeriesOptions<TData>[];
    axes: string[];
    maxValue?: number;
    levels?: number;
    legend?: ChartLegendInput;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `series` | `RadarChartSeriesOptions&lt;TData&gt;[]` |  |
| `axes` | `string[]` |  |
| `maxValue?` | `number \| undefined` |  |
| `levels?` | `number \| undefined` |  |
| `legend?` | `ChartLegendInput \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### SankeyLink `interface`

A directional flow between two nodes in a Sankey diagram.

```ts
interface SankeyLink {
    source: string;
    target: string;
    value: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `source` | `string` |  |
| `target` | `string` |  |
| `value` | `number` |  |
---

### SankeyNode `interface`

A node in a Sankey diagram.

```ts
interface SankeyNode {
    id: string;
    label: string;
    color?: string;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `label` | `string` |  |
| `color?` | `string \| undefined` |  |
---

### SankeyChartOptions `interface`

Options for configuring a {@link SankeyChart}.

```ts
interface SankeyChartOptions extends BaseChartOptions {
    nodes: SankeyNode[];
    links: SankeyLink[];
    nodeWidth?: number;
    nodePadding?: number;
    iterations?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `nodes` | `SankeyNode[]` |  |
| `links` | `SankeyLink[]` |  |
| `nodeWidth?` | `number \| undefined` |  |
| `nodePadding?` | `number \| undefined` |  |
| `iterations?` | `number \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### ScatterChartSeriesOptions `interface`

Configuration for an individual scatter chart series.

```ts
interface ScatterChartSeriesOptions<TData> {
    id: string;
    color?: string;
    xBy: keyof TData | ((item: TData) => number);
    yBy: keyof TData | ((item: TData) => number);
    sizeBy?: keyof TData | number | ((item: TData) => number);
    label: string | ((item: TData) => string);
    minRadius?: number;
    maxRadius?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `color?` | `string \| undefined` |  |
| `xBy` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `yBy` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `sizeBy?` | `number \| keyof TData \| ((item: TData) =&gt; number) \| undefined` |  |
| `label` | `string \| ((item: TData) =&gt; string)` |  |
| `minRadius?` | `number \| undefined` |  |
| `maxRadius?` | `number \| undefined` |  |
---

### ScatterChartOptions `interface`

Options for configuring a {@link ScatterChart}.

```ts
interface ScatterChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: ScatterChartSeriesOptions<TData>[];
    key: keyof TData | ((item: TData) => string);
    grid?: ChartGridInput;
    crosshair?: ChartCrosshairInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    axis?: ChartAxisInput<TData>;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `series` | `ScatterChartSeriesOptions&lt;TData&gt;[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `grid?` | `ChartGridInput \| undefined` |  |
| `crosshair?` | `ChartCrosshairInput \| undefined` |  |
| `tooltip?` | `ChartTooltipInput \| undefined` |  |
| `legend?` | `ChartLegendInput \| undefined` |  |
| `axis?` | `ChartAxisInput&lt;TData&gt; \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### StockChartOptions `interface`

Options for configuring a {@link StockChart}.

```ts
interface StockChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    open: keyof TData | ((item: TData) => number);
    high: keyof TData | ((item: TData) => number);
    low: keyof TData | ((item: TData) => number);
    close: keyof TData | ((item: TData) => number);
    volume?: keyof TData | ((item: TData) => number);
    showVolume?: boolean;
    grid?: ChartGridInput;
    crosshair?: ChartCrosshairInput;
    tooltip?: ChartTooltipInput;
    axis?: ChartAxisInput<TData>;
    upColor?: string;
    downColor?: string;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `open` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `high` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `low` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `close` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `volume?` | `keyof TData \| ((item: TData) =&gt; number) \| undefined` |  |
| `showVolume?` | `boolean \| undefined` |  |
| `grid?` | `ChartGridInput \| undefined` |  |
| `crosshair?` | `ChartCrosshairInput \| undefined` |  |
| `tooltip?` | `ChartTooltipInput \| undefined` |  |
| `axis?` | `ChartAxisInput&lt;TData&gt; \| undefined` |  |
| `upColor?` | `string \| undefined` |  |
| `downColor?` | `string \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### SunburstNode `interface`

A node in a sunburst hierarchy with optional nested children.

```ts
interface SunburstNode {
    id: string;
    label: string;
    value: number;
    color?: string;
    children?: SunburstNode[];
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `label` | `string` |  |
| `value` | `number` |  |
| `color?` | `string \| undefined` |  |
| `children?` | `SunburstNode[] \| undefined` |  |
---

### SunburstChartOptions `interface`

Options for configuring a {@link SunburstChart}.

```ts
interface SunburstChartOptions extends BaseChartOptions {
    data: SunburstNode[];
    legend?: ChartLegendInput;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `SunburstNode[]` |  |
| `legend?` | `ChartLegendInput \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### TreemapChartOptions `interface`

Options for configuring a {@link TreemapChart}.

```ts
interface TreemapChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    label: keyof TData | ((item: TData) => string);
    color?: keyof TData | ((item: TData) => string);
    gap?: number;
    borderRadius?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `value` | `keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `color?` | `keyof TData \| ((item: TData) =&gt; string) \| undefined` |  |
| `gap?` | `number \| undefined` |  |
| `borderRadius?` | `number \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### RealtimeChartSeriesOptions `interface`

Configuration for an individual realtime chart series.

```ts
interface RealtimeChartSeriesOptions {
    id: string;
    color?: string;
    label?: string;
    lineType?: PolylineRenderer;
    lineWidth?: number;
    showArea?: boolean;
    areaOpacity?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `color?` | `string \| undefined` |  |
| `label?` | `string \| undefined` |  |
| `lineType?` | `PolylineRenderer \| undefined` |  |
| `lineWidth?` | `number \| undefined` |  |
| `showArea?` | `boolean \| undefined` |  |
| `areaOpacity?` | `number \| undefined` |  |
---

### RealtimeChartOptions `interface`

Options for configuring a {@link RealtimeChart}.

```ts
interface RealtimeChartOptions extends BaseChartOptions {
    series: RealtimeChartSeriesOptions[];
    windowSize?: number;
    grid?: ChartGridInput;
    crosshair?: ChartCrosshairInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    axis?: ChartAxisInput;
    showYAxis?: boolean;
    yMin?: number;
    yMax?: number;
    transitionDuration?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `series` | `RealtimeChartSeriesOptions[]` |  |
| `windowSize?` | `number \| undefined` |  |
| `grid?` | `ChartGridInput \| undefined` |  |
| `crosshair?` | `ChartCrosshairInput \| undefined` |  |
| `tooltip?` | `ChartTooltipInput \| undefined` |  |
| `legend?` | `ChartLegendInput \| undefined` |  |
| `axis?` | `ChartAxisInput \| undefined` |  |
| `showYAxis?` | `boolean \| undefined` |  |
| `yMin?` | `number \| undefined` |  |
| `yMax?` | `number \| undefined` |  |
| `transitionDuration?` | `number \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### BaseTrendChartSeriesOptions `interface`

Base configuration shared by all trend chart series types.

```ts
interface BaseTrendChartSeriesOptions<TData> {
    id: string;
    type: SeriesType;
    color?: string;
    value: keyof TData | number | ((item: TData) => number);
    label: string | ((item: TData) => string);
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` |  |
| `type` | `SeriesType` |  |
| `color?` | `string \| undefined` |  |
| `value` | `number \| keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `string \| ((item: TData) =&gt; string)` |  |
---

### TrendChartBarSeriesOptions `interface`

Series options for bar-type series within a trend chart.

```ts
interface TrendChartBarSeriesOptions<TData> extends BaseTrendChartSeriesOptions<TData> {
    type: 'bar';
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `type` | `"bar"` |  |
| `id` | `string` |  |
| `color?` | `string \| undefined` |  |
| `value` | `number \| keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `string \| ((item: TData) =&gt; string)` |  |
---

### TrendChartAreaSeriesOptions `interface`

Series options for area-type series within a trend chart.

```ts
interface TrendChartAreaSeriesOptions<TData> extends BaseTrendChartSeriesOptions<TData> {
    type: 'area';
    filled: boolean;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `type` | `"area"` |  |
| `filled` | `boolean` |  |
| `id` | `string` |  |
| `color?` | `string \| undefined` |  |
| `value` | `number \| keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `string \| ((item: TData) =&gt; string)` |  |
---

### TrendChartLineSeriesOptions `interface`

Series options for line-type series within a trend chart.

```ts
interface TrendChartLineSeriesOptions<TData> extends BaseTrendChartSeriesOptions<TData> {
    type: 'line';
    lineType?: PolylineRenderer;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `type` | `"line"` |  |
| `lineType?` | `PolylineRenderer \| undefined` |  |
| `id` | `string` |  |
| `color?` | `string \| undefined` |  |
| `value` | `number \| keyof TData \| ((item: TData) =&gt; number)` |  |
| `label` | `string \| ((item: TData) =&gt; string)` |  |
---

### TrendChartOptions `interface`

Options for configuring a {@link TrendChart}.

```ts
interface TrendChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: TrendChartSeriesOptions<TData>[];
    key: keyof TData | ((item: TData) => string);
    grid?: ChartGridInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    axis?: ChartAxisInput<TData>;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `data` | `TData[]` |  |
| `series` | `TrendChartSeriesOptions&lt;TData&gt;[]` |  |
| `key` | `keyof TData \| ((item: TData) =&gt; string)` |  |
| `grid?` | `ChartGridInput \| undefined` |  |
| `tooltip?` | `ChartTooltipInput \| undefined` |  |
| `legend?` | `ChartLegendInput \| undefined` |  |
| `axis?` | `ChartAxisInput&lt;TData&gt; \| undefined` |  |
| `autoRender?` | `boolean \| undefined` |  |
| `padding?` | `Partial&lt;ChartPadding&gt; \| undefined` |  |
| `title?` | `string \| Partial&lt;ChartTitleOptions&gt; \| undefined` |  |
| `animation?` | `boolean \| Partial&lt;ChartAnimationOptions&gt; \| undefined` |  |
---

### BarChartOrientation `type`

```ts
type BarChartOrientation = 'vertical' | 'horizontal';
```

---

### BarChartMode `type`

```ts
type BarChartMode = 'grouped' | 'stacked';
```

---

### SeriesType `type`

Supported series visualization types within a trend chart.

```ts
type SeriesType = 'bar' | 'line' | 'area';
```

---

### TrendChartSeriesOptions `type`

Discriminated union of all trend chart series option types.

```ts
type TrendChartSeriesOptions<TData> = TrendChartBarSeriesOptions<TData>
| TrendChartAreaSeriesOptions<TData>
| TrendChartLineSeriesOptions<TData>;
```

---

### createAreaChart `function`

Factory function that creates a new {@link AreaChart} instance.

```ts
function createAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: AreaChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `AreaChartOptions&lt;TData&gt;` |  |

**Returns:** `AreaChart&lt;TData&gt;`

---

### createBarChart `function`

Factory function that creates a new {@link BarChart} instance.

```ts
function createBarChart<TData = unknown>(target: string | HTMLElement | Context, options: BarChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `BarChartOptions&lt;TData&gt;` |  |

**Returns:** `BarChart&lt;TData&gt;`

---

### createChordChart `function`

Factory function that creates a new {@link ChordChart} instance.

```ts
function createChordChart(target: string | HTMLElement | Context, options: ChordChartOptions);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `ChordChartOptions` |  |

**Returns:** `ChordChart`

---

### createFunnelChart `function`

Factory function that creates a new {@link FunnelChart} instance.

```ts
function createFunnelChart<TData = unknown>(target: string | HTMLElement | Context, options: FunnelChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `FunnelChartOptions&lt;TData&gt;` |  |

**Returns:** `FunnelChart&lt;TData&gt;`

---

### createGanttChart `function`

Factory function that creates a new {@link GanttChart} instance.

```ts
function createGanttChart<TData = unknown>(target: string | HTMLElement | Context, options: GanttChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `GanttChartOptions&lt;TData&gt;` |  |

**Returns:** `GanttChart&lt;TData&gt;`

---

### createGaugeChart `function`

Factory function that creates a new {@link GaugeChart} instance.

```ts
function createGaugeChart(target: string | HTMLElement | Context, options: GaugeChartOptions);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `GaugeChartOptions` |  |

**Returns:** `GaugeChart`

---

### createHeatmapChart `function`

Factory function that creates a new {@link HeatmapChart} instance.

```ts
function createHeatmapChart<TData = unknown>(target: string | HTMLElement | Context, options: HeatmapChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `HeatmapChartOptions&lt;TData&gt;` |  |

**Returns:** `HeatmapChart&lt;TData&gt;`

---

### createLineChart `function`

Factory function that creates a new {@link LineChart} instance.

```ts
function createLineChart<TData = unknown>(target: string | HTMLElement | Context, options: LineChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `LineChartOptions&lt;TData&gt;` |  |

**Returns:** `LineChart&lt;TData&gt;`

---

### createPieChart `function`

Factory function that creates a new {@link PieChart} instance.

```ts
function createPieChart<TData = unknown>(target: string | HTMLElement | Context, options: PieChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `PieChartOptions&lt;TData&gt;` |  |

**Returns:** `PieChart&lt;TData&gt;`

---

### createPolarAreaChart `function`

Factory function that creates a new {@link PolarAreaChart} instance.

```ts
function createPolarAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: PolarAreaChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `PolarAreaChartOptions&lt;TData&gt;` |  |

**Returns:** `PolarAreaChart&lt;TData&gt;`

---

### createRadarChart `function`

Factory function that creates a new {@link RadarChart} instance.

```ts
function createRadarChart<TData = unknown>(target: string | HTMLElement | Context, options: RadarChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `RadarChartOptions&lt;TData&gt;` |  |

**Returns:** `RadarChart&lt;TData&gt;`

---

### createSankeyChart `function`

Factory function that creates a new {@link SankeyChart} instance.

```ts
function createSankeyChart(target: string | HTMLElement | Context, options: SankeyChartOptions);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `SankeyChartOptions` |  |

**Returns:** `SankeyChart`

---

### createScatterChart `function`

Factory function that creates a new {@link ScatterChart} instance.

```ts
function createScatterChart<TData = unknown>(target: string | HTMLElement | Context, options: ScatterChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `ScatterChartOptions&lt;TData&gt;` |  |

**Returns:** `ScatterChart&lt;TData&gt;`

---

### createStockChart `function`

Factory function that creates a new {@link StockChart} instance.

```ts
function createStockChart<TData = unknown>(target: string | HTMLElement | Context, options: StockChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `StockChartOptions&lt;TData&gt;` |  |

**Returns:** `StockChart&lt;TData&gt;`

---

### createSunburstChart `function`

Factory function that creates a new {@link SunburstChart} instance.

```ts
function createSunburstChart(target: string | HTMLElement | Context, options: SunburstChartOptions);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `SunburstChartOptions` |  |

**Returns:** `SunburstChart`

---

### createTreemapChart `function`

Factory function that creates a new {@link TreemapChart} instance.

```ts
function createTreemapChart<TData = unknown>(target: string | HTMLElement | Context, options: TreemapChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `TreemapChartOptions&lt;TData&gt;` |  |

**Returns:** `TreemapChart&lt;TData&gt;`

---

### createRealtimeChart `function`

Factory function that creates a new {@link RealtimeChart} instance.

```ts
function createRealtimeChart(target: string | HTMLElement | Context, options: RealtimeChartOptions);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `RealtimeChartOptions` |  |

**Returns:** `RealtimeChart`

---

### createTrendChart `function`

Factory function that creates a new {@link TrendChart} instance.

```ts
function createTrendChart<TData = unknown>(target: string | HTMLElement | Context, options: TrendChartOptions<TData>);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `string \| HTMLElement \| Context&lt;Element&gt;` |  |
| `options` | `TrendChartOptions&lt;TData&gt;` |  |

**Returns:** `TrendChart&lt;TData&gt;`

---

