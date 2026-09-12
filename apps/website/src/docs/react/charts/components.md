---
title: Components
description: "Every Ripl chart as a React component, with the factory it wraps and the events it emits."
---

# Components

All 25 charts, each wrapping the factory of the same name from `@ripl/charts`. Options and payloads are documented per chart in the [API reference](/docs/api/@ripl/charts/).

| Component | Wraps | Events |
| --- | --- | --- |
| `<RiplArcDiagramChart>` | `createArcDiagramChart` | `linkclick`, `linkenter`, `linkleave`, `nodeclick`, `nodeenter`, `nodeleave` |
| `<RiplAreaChart>` | `createAreaChart` | `markerclick`, `markerenter`, `markerleave` |
| `<RiplBarChart>` | `createBarChart` | `barclick`, `barenter`, `barleave` |
| `<RiplBoxPlotChart>` | `createBoxPlotChart` | `boxclick`, `boxenter`, `boxleave` |
| `<RiplChordChart>` | `createChordChart` | `linkclick`, `linkenter`, `linkleave`, `segmentclick`, `segmententer`, `segmentleave` |
| `<RiplForceDirectedChart>` | `createForceDirectedChart` | `linkclick`, `linkenter`, `linkleave`, `nodeclick`, `nodeenter`, `nodeleave` |
| `<RiplFunnelChart>` | `createFunnelChart` | `segmentclick`, `segmententer`, `segmentleave` |
| `<RiplGanttChart>` | `createGanttChart` | `taskclick`, `taskenter`, `taskleave` |
| `<RiplGaugeChart>` | `createGaugeChart` | `valueclick`, `valueenter`, `valueleave` |
| `<RiplHeatmapChart>` | `createHeatmapChart` | `cellclick`, `cellenter`, `cellleave` |
| `<RiplHistogramChart>` | `createHistogramChart` | `binclick`, `binenter`, `binleave` |
| `<RiplLineChart>` | `createLineChart` | `markerclick`, `markerenter`, `markerleave` |
| `<RiplPackedCircleChart>` | `createPackedCircleChart` | `nodeclick`, `nodeenter`, `nodeleave` |
| `<RiplPieChart>` | `createPieChart` | `segmentclick`, `segmententer`, `segmentleave` |
| `<RiplPolarAreaChart>` | `createPolarAreaChart` | `segmentclick`, `segmententer`, `segmentleave` |
| `<RiplPolarScatterChart>` | `createPolarScatterChart` | `markerclick`, `markerenter`, `markerleave` |
| `<RiplRadarChart>` | `createRadarChart` | `markerclick`, `markerenter`, `markerleave` |
| `<RiplRadialBarChart>` | `createRadialBarChart` | `barclick`, `barenter`, `barleave` |
| `<RiplRealtimeChart>` | `createRealtimeChart` | — |
| `<RiplSankeyChart>` | `createSankeyChart` | `linkclick`, `linkenter`, `linkleave`, `nodeclick`, `nodeenter`, `nodeleave` |
| `<RiplScatterChart>` | `createScatterChart` | `markerclick`, `markerenter`, `markerleave` |
| `<RiplStockChart>` | `createStockChart` | `candleclick`, `candleenter`, `candleleave` |
| `<RiplSunburstChart>` | `createSunburstChart` | `nodeclick`, `nodeenter`, `nodeleave` |
| `<RiplTreemapChart>` | `createTreemapChart` | `nodeclick`, `nodeenter`, `nodeleave` |
| `<RiplTrendChart>` | `createTrendChart` | `barclick`, `barenter`, `barleave`, `markerclick`, `markerenter`, `markerleave` |

React resolves components by reference rather than by name, so there is no kebab-case form and nothing to register: import `RiplBarChart` and use it.

## Adding your own

`defineRiplChart` is exported, so a chart built on `@ripl/charts`'s own `Chart` base gets the same treatment:

```ts
import {
    chartFactory,
    defineRiplChart,
} from '@ripl/react-charts';

export const RiplSparkline = defineRiplChart({
    name: 'RiplSparkline',
    optionKeys: ['data', 'value'],
    events: Sparkline.prototype.$events as string[],
    create: chartFactory<SparklineOptions>(createSparkline),
});
```

`optionKeys` names the options on top of the shared set, and `events` comes from the chart class's own `$events` declaration so the two cannot drift.
