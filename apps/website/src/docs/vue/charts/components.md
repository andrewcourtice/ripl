---
title: Components
description: "Every Ripl chart as a Vue component, with the factory it wraps and the events it emits."
---

# Components

All 25 charts, each wrapping the factory of the same name from `@ripl/charts`. Options and payloads are documented per chart in the [API reference](/docs/api/@ripl/charts/).

| Component | Wraps | Events |
| --- | --- | --- |
| `<ripl-arc-diagram-chart>` | `createArcDiagramChart` | `linkclick`, `linkenter`, `linkleave`, `nodeclick`, `nodeenter`, `nodeleave` |
| `<ripl-area-chart>` | `createAreaChart` | `markerclick`, `markerenter`, `markerleave` |
| `<ripl-bar-chart>` | `createBarChart` | `barclick`, `barenter`, `barleave` |
| `<ripl-box-plot-chart>` | `createBoxPlotChart` | `boxclick`, `boxenter`, `boxleave` |
| `<ripl-chord-chart>` | `createChordChart` | `linkclick`, `linkenter`, `linkleave`, `segmentclick`, `segmententer`, `segmentleave` |
| `<ripl-force-directed-chart>` | `createForceDirectedChart` | `linkclick`, `linkenter`, `linkleave`, `nodeclick`, `nodeenter`, `nodeleave` |
| `<ripl-funnel-chart>` | `createFunnelChart` | `segmentclick`, `segmententer`, `segmentleave` |
| `<ripl-gantt-chart>` | `createGanttChart` | `taskclick`, `taskenter`, `taskleave` |
| `<ripl-gauge-chart>` | `createGaugeChart` | `valueclick`, `valueenter`, `valueleave` |
| `<ripl-heatmap-chart>` | `createHeatmapChart` | `cellclick`, `cellenter`, `cellleave` |
| `<ripl-histogram-chart>` | `createHistogramChart` | `binclick`, `binenter`, `binleave` |
| `<ripl-line-chart>` | `createLineChart` | `markerclick`, `markerenter`, `markerleave` |
| `<ripl-packed-circle-chart>` | `createPackedCircleChart` | `nodeclick`, `nodeenter`, `nodeleave` |
| `<ripl-pie-chart>` | `createPieChart` | `segmentclick`, `segmententer`, `segmentleave` |
| `<ripl-polar-area-chart>` | `createPolarAreaChart` | `segmentclick`, `segmententer`, `segmentleave` |
| `<ripl-polar-scatter-chart>` | `createPolarScatterChart` | `markerclick`, `markerenter`, `markerleave` |
| `<ripl-radar-chart>` | `createRadarChart` | `markerclick`, `markerenter`, `markerleave` |
| `<ripl-radial-bar-chart>` | `createRadialBarChart` | `barclick`, `barenter`, `barleave` |
| `<ripl-realtime-chart>` | `createRealtimeChart` | — |
| `<ripl-sankey-chart>` | `createSankeyChart` | `linkclick`, `linkenter`, `linkleave`, `nodeclick`, `nodeenter`, `nodeleave` |
| `<ripl-scatter-chart>` | `createScatterChart` | `markerclick`, `markerenter`, `markerleave` |
| `<ripl-stock-chart>` | `createStockChart` | `candleclick`, `candleenter`, `candleleave` |
| `<ripl-sunburst-chart>` | `createSunburstChart` | `nodeclick`, `nodeenter`, `nodeleave` |
| `<ripl-treemap-chart>` | `createTreemapChart` | `nodeclick`, `nodeenter`, `nodeleave` |
| `<ripl-trend-chart>` | `createTrendChart` | `barclick`, `barenter`, `barleave`, `markerclick`, `markerenter`, `markerleave` |

Both casings work: `<ripl-bar-chart>` and `<RiplBarChart>` resolve to the same component, exported as `RiplBarChart`.

## Adding your own

`defineRiplChart` is exported, so a chart built on `@ripl/charts`'s own `Chart` base gets the same treatment:

```ts
import {
    chartFactory,
    defineRiplChart,
} from '@ripl/vue-charts';

export const RiplSparkline = defineRiplChart({
    name: 'RiplSparkline',
    optionKeys: ['data', 'value'],
    events: Sparkline.prototype.$events as string[],
    create: chartFactory<SparklineOptions>(createSparkline),
});
```

`optionKeys` names the options on top of the shared set, and `events` comes from the chart class's own `$events` declaration so the two cannot drift.
