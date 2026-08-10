---
title: Getting Started with Charts
description: Install @ripl/charts, build your first chart from a factory call, then update its data, switch it to SVG, listen for events and destroy it when done.
outline: "deep"
---

# Getting Started with Charts

`@ripl/charts` is a set of interactive chart types built on the Ripl core rendering engine. Every chart animates its data transitions, emits pointer events, resizes with its container, and draws through the same `Context`, so one chart definition renders to Canvas or SVG.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

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
        {
            month: 'Jan',
            sales: 120,
            costs: 80,
        },
        {
            month: 'Feb',
            sales: 200,
            costs: 110,
        },
        {
            month: 'Mar',
            sales: 150,
            costs: 90,
        },
    ],
    key: 'month',
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
        {
            id: 'costs',
            value: 'costs',
            label: 'Costs',
        },
    ],
});
```

That's all it takes to get a fully interactive bar chart, complete with animated entry, hover tooltips, and axis labels.

## Updating Data

Call `chart.update()` with partial options to update the chart in place. Changes animate: new data points enter, removed points exit, and existing points transition to their new positions.

```ts
chart.update({
    data: [
        {
            month: 'Jan',
            sales: 180,
            costs: 100,
        },
        {
            month: 'Feb',
            sales: 220,
            costs: 130,
        },
        {
            month: 'Mar',
            sales: 170,
            costs: 95,
        },
        {
            month: 'Apr',
            sales: 300,
            costs: 150,
        },
    ],
});
```

Any option can be updated this way, not only the data:

```ts
chart.update({ stacked: true });
chart.update({ orientation: 'horizontal' });
chart.update({ legend: true });
```

## Common Options

All charts extend `BaseChartOptions` and share these core options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `padding` | `PaddingInput` | `16` | Space reserved around the chart area: a number for every edge, a `[top, right, bottom, left]` tuple, or a partial per-edge object |
| `animation` | `boolean \| Partial<ChartAnimationOptions>` | `{ enabled: true, duration: 1000, ease: 'easeOutCubic' }` | Animation toggle or configuration |
| `title` | `string \| Partial<ChartTitleOptions>` | — | Chart title text or configuration |
| `autoRender` | `boolean` | `true` | Automatically render on creation and update |
| `theme` | `string \| Theme` | module default | A registered theme name (`'light'`/`'dark'`/`'auto'`) or a `Theme` object |
| `description` | `string` | title text | Accessible description announced by screen readers |

Most chart types also support these feature options:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `axis` | `boolean \| ChartAxisOptions` | `true` | Show/configure x and y axes |
| `grid` | `boolean \| ChartGridOptions` | `true` | Show/configure background grid lines |
| `tooltip` | `boolean \| ChartTooltipOptions` | `true` | Show/configure hover tooltips |
| `legend` | `boolean \| ChartLegendOptions` | auto | Show/configure series legend (shown by default for charts with more than one series/segment, at the bottom) |
| `crosshair` | `boolean \| ChartCrosshairOptions` | varies | Show/configure crosshair tracking |

See [Shared Options](/charts/shared-options) for a complete reference on each of these, and each
chart's own page for the full, generated list of every option it accepts.

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
    data: [/* ... */],
    key: 'month',
    series: [/* ... */],
});
```

## Destroying a Chart

Call `destroy()` to clean up the chart, its scene, renderer, and all event subscriptions:

```ts
chart.destroy();
```

## Available Charts

<template v-for="category in chartCategories" :key="category">
    <h3>{{ category }}</h3>
    <table>
        <thead>
            <tr>
                <th>Chart</th>
                <th>Factory</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr v-for="chart in charts.filter(chart => chart.category === category)" :key="chart.link">
                <td><a :href="chart.link">{{ chart.text }}</a></td>
                <td><code>{{ chart.factory }}</code></td>
                <td>{{ chart.description }}</td>
            </tr>
        </tbody>
    </table>
</template>

<script setup lang="ts">
import {
    chartCategories,
    charts,
} from '../.vitepress/data/charts';
</script>

## Next Steps

- **[Shared Options](/charts/shared-options)**: the full reference for axis, legend, tooltip, grid, and crosshair configuration
- **[Bar Chart](/charts/bar)**: grouped, stacked and horizontal bars, with every shared option in play
- **[Theming](/charts/advanced/theming)**: light/dark/colorblind themes and custom palettes
- **[Annotations](/charts/advanced/annotations)**: reference lines, bands, and point markers
- **[Panning & Zooming](/charts/advanced/panning-and-zooming)**: interactive navigation and the overview strip
- **[Custom Charts](/charts/advanced/custom-charts)**: build your own chart type on the `Chart` base class
- **[Charts API Reference](/docs/api/@ripl/charts/)**: full TypeScript API documentation
