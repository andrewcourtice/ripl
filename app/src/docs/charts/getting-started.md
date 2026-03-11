---
outline: "deep"
---

# Getting Started with Charts

The `@ripl/charts` package provides pre-built, interactive chart components on top of the Ripl core rendering engine. Every chart inherits animated transitions, pointer events, responsive sizing, and context-agnostic rendering (Canvas or SVG) out of the box.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/charts/charts).

## Installation

:::tabs
== npm
```bash
npm install @ripl/charts
```
== yarn
```bash
yarn add @ripl/charts
```
== pnpm
```bash
pnpm add @ripl/charts
```
:::

> [!TIP]
> `@ripl/charts` depends on `@ripl/core`, which is installed automatically. You don't need to install it separately.

## Your First Chart

Every chart follows the same pattern:

1. **Import** the factory function for the chart type
2. **Call** it with a target (CSS selector, `HTMLElement`, or `Context`) and an options object
3. **Update** the chart reactively via `chart.update(options)`

```ts
import {
    createBarChart,
} from '@ripl/charts';

const chart = createBarChart('#chart-container', {
    data: [
        { month: 'Jan',
            sales: 120,
            costs: 80 },
        { month: 'Feb',
            sales: 200,
            costs: 110 },
        { month: 'Mar',
            sales: 150,
            costs: 90 },
    ],
    key: 'month',
    series: [
        { id: 'sales',
            value: 'sales',
            label: 'Sales' },
        { id: 'costs',
            value: 'costs',
            label: 'Costs' },
    ],
});
```

This creates a fully interactive bar chart with animated entry, tooltips on hover, and axis labels — all with zero additional configuration.

## Updating Data

Call `chart.update()` with partial options to reactively update the chart. Changes animate smoothly — new data points enter, removed points exit, and existing points transition to their new positions:

```ts
chart.update({
    data: [
        { month: 'Jan',
            sales: 180,
            costs: 100 },
        { month: 'Feb',
            sales: 220,
            costs: 130 },
        { month: 'Mar',
            sales: 170,
            costs: 95 },
        { month: 'Apr',
            sales: 300,
            costs: 150 },
    ],
});
```

You can update any option — not just data:

```ts
chart.update({ mode: 'stacked' });
chart.update({ orientation: 'horizontal' });
chart.update({ legend: true });
```

## Common Options

All charts extend `BaseChartOptions` and share these core options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `padding` | `Partial<ChartPadding>` | `{ top: 10, right: 10, bottom: 10, left: 10 }` | Inner padding around the chart area |
| `animation` | `boolean \| Partial<ChartAnimationOptions>` | `{ enabled: true, duration: 1000, ease: 'easeOutCubic' }` | Animation toggle or configuration |
| `title` | `string \| Partial<ChartTitleOptions>` | — | Chart title text or configuration |
| `autoRender` | `boolean` | `true` | Automatically render on creation and update |

Most chart types also support these feature options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `axis` | `boolean \| ChartAxisOptions` | `true` | Show/configure x and y axes |
| `grid` | `boolean \| ChartGridOptions` | `true` | Show/configure background grid lines |
| `tooltip` | `boolean \| ChartTooltipOptions` | `true` | Show/configure hover tooltips |
| `legend` | `boolean \| ChartLegendOptions` | `false` | Show/configure series legend |
| `crosshair` | `boolean \| ChartCrosshairOptions` | varies | Show/configure crosshair tracking |

See [Shared Options](/docs/charts/shared-options) for a complete reference on each of these.

## SVG Rendering

Charts render to Canvas by default. To use SVG, pass an SVG context as the target:

```ts
import {
    createBarChart,
} from '@ripl/charts';

import {
    createContext,
} from '@ripl/svg';

const svgContext = createContext('#chart-container');

const chart = createBarChart(svgContext, {
    data: [...],
    key: 'month',
    series: [...],
});
```

## Destroying a Chart

Call `destroy()` to clean up the chart, its scene, renderer, and all event subscriptions:

```ts
chart.destroy();
```

## Available Charts

| Chart | Factory | Key Features |
| --- | --- | --- |
| [Bar](/docs/charts/bar) | `createBarChart` | Grouped, stacked, horizontal |
| [Line](/docs/charts/line) | `createLineChart` | 13 interpolation modes, markers |
| [Area](/docs/charts/area) | `createAreaChart` | Stacked, gradient fills |
| [Pie](/docs/charts/pie) | `createPieChart` | Donut mode, slice animations |
| [Scatter](/docs/charts/scatter) | `createScatterChart` | Bubble sizing, multi-series |
| [Radar](/docs/charts/radar) | `createRadarChart` | Multi-series overlay |
| [Heatmap](/docs/charts/heatmap) | `createHeatmapChart` | Color-encoded matrix |
| [Treemap](/docs/charts/treemap) | `createTreemapChart` | Hierarchical proportions |
| [Funnel](/docs/charts/funnel) | `createFunnelChart` | Conversion funnels |
| [Gauge](/docs/charts/gauge) | `createGaugeChart` | Radial progress, tick marks |
| [Polar Area](/docs/charts/polar-area) | `createPolarAreaChart` | Radial bar segments |
| [Sankey](/docs/charts/sankey) | `createSankeyChart` | Flow diagrams |
| [Chord](/docs/charts/chord) | `createChordChart` | Relationship matrices |
| [Sunburst](/docs/charts/sunburst) | `createSunburstChart` | Hierarchical rings |
| [Trend](/docs/charts/trend) | `createTrendChart` | Sparkline-style |

## Next Steps

- **[Shared Options](/docs/charts/shared-options)** — Deep dive into axis, legend, tooltip, grid, and crosshair configuration
- **[Bar Chart](/docs/charts/bar)** — Start with the most versatile chart type
- **[Charts API Reference](/docs/api/charts/charts)** — Full TypeScript API documentation
