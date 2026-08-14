# @ripl/charts

[![npm](https://img.shields.io/npm/v/@ripl/charts)](https://www.npmjs.com/package/@ripl/charts)
[![license](https://img.shields.io/npm/l/@ripl/charts)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/charts)](https://bundlephobia.com/package/@ripl/charts)

> 25 animated, interactive chart types for [Ripl](https://www.ripl.run), rendering to Canvas, SVG, the terminal or a server from one chart definition.

## Features

- **25 chart types**, each behind a `createXChart` factory taking a CSS selector, an `HTMLElement` or a Ripl `Context`.
- **Animated data joins** — `chart.update(options)` diffs the new data against the drawn elements and animates entries, updates and exits separately, at every level of a multi-series chart. Axes and legends transition rather than redraw.
- **Interaction** — tooltips, crosshairs, hover highlighting, legend toggling, a windowing navigator strip for pan and zoom, and typed pointer events per chart (`barenter`, `barleave`, `barclick`, and their equivalents).
- **Shared components** — axes, grids, legends, tooltips, crosshairs, titles and a navigator strip are configured through the same options on every chart that has them, so a dashboard stays consistent without per-chart wiring.
- **Same chart, several targets** — Canvas or SVG in the browser, and braille text or raw `ImageData` from a headless Node script via [`@ripl/node`](https://www.npmjs.com/package/@ripl/node).
- **Three built-in themes** — `lightTheme`, `darkTheme` and `colorBlindTheme`, with `registerTheme` for your own and per-chart or per-series overrides.
- **Tree-shakable** — importing one factory ships one chart type.
- **No third-party runtime dependencies** — the only dependencies are four sibling packages in this repository (`@ripl/core`, `@ripl/canvas`, `@ripl/dom`, `@ripl/utilities`).

## Chart types

| Category | Charts |
| --- | --- |
| **Cartesian** | [Bar](https://www.ripl.run/charts/bar), [Line](https://www.ripl.run/charts/line), [Area](https://www.ripl.run/charts/area), [Scatter](https://www.ripl.run/charts/scatter), [Histogram](https://www.ripl.run/charts/histogram), [Box Plot](https://www.ripl.run/charts/box-plot), [Trend](https://www.ripl.run/charts/trend), [Stock](https://www.ripl.run/charts/stock) |
| **Radial & polar** | [Pie/Donut](https://www.ripl.run/charts/pie), [Polar Area](https://www.ripl.run/charts/polar-area), [Polar Scatter](https://www.ripl.run/charts/polar-scatter), [Radial Bar](https://www.ripl.run/charts/radial-bar), [Radar](https://www.ripl.run/charts/radar), [Gauge](https://www.ripl.run/charts/gauge) |
| **Hierarchical** | [Sunburst](https://www.ripl.run/charts/sunburst), [Treemap](https://www.ripl.run/charts/treemap), [Packed Circle](https://www.ripl.run/charts/packed-circle) |
| **Network & flow** | [Sankey](https://www.ripl.run/charts/sankey), [Chord](https://www.ripl.run/charts/chord), [Arc Diagram](https://www.ripl.run/charts/arc-diagram), [Force-Directed](https://www.ripl.run/charts/force-directed), [Funnel](https://www.ripl.run/charts/funnel) |
| **Specialized** | [Heatmap](https://www.ripl.run/charts/heatmap), [Gantt](https://www.ripl.run/charts/gantt), [Realtime](https://www.ripl.run/charts/realtime) |

## Installation

`@ripl/charts` is context-agnostic: it draws a chart onto whatever surface it is given and ships no
rendering backend of its own. Install it **alongside** the backend for your environment.

```bash
# In a browser, with Canvas or SVG
npm install @ripl/charts @ripl/web

# In Node, rendering to the terminal
npm install @ripl/charts @ripl/node
```

Import the backend once, anywhere in your entry point. It registers the platform bindings a chart
needs — a rendering context, text measurement and an animation frame:

```typescript
import '@ripl/web';
```

Without one, a chart given a selector or an element throws rather than guessing a backend. Passing
a `Context` you built yourself needs no backend import at all.

## Quick start

```typescript
// Registers the browser rendering backend. Swap for `@ripl/node` to render to a terminal.
import '@ripl/web';

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

chart.update({
    stacked: true,
});
```

`chart.update()` takes any partial option, not only `data` — the change animates from whatever is currently drawn.

## Key API

| Export | What it does |
| --- | --- |
| [`createBarChart` … `createGanttChart`](https://www.ripl.run/charts/) | The 25 chart factories |
| [`Chart`](https://www.ripl.run/charts/advanced/custom-charts) | Base class to extend for a custom chart type |
| [`createChartAnnotations`](https://www.ripl.run/charts/advanced/annotations) | Reference lines, bands and point callouts |
| [`createColorLegend`](https://www.ripl.run/charts/advanced/color-legend) | Legend for a continuous colour scale |
| [`createSymbol`](https://www.ripl.run/charts/scatter) | The scatter/legend symbol set |
| [`registerTheme` / `setDefaultTheme`](https://www.ripl.run/charts/advanced/theming) | Light, dark and colour-blind themes, and your own |

## Related packages

- [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) — the browser entry point, for drawing alongside a chart
- [`@ripl/svg`](https://www.npmjs.com/package/@ripl/svg) — render any chart as SVG instead of Canvas
- [`@ripl/node`](https://www.npmjs.com/package/@ripl/node) — the same charts from a headless script, drawn through [`@ripl/terminal`](https://www.npmjs.com/package/@ripl/terminal)
- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the elements, scales and animation the charts are built from

## Documentation

Guides, an options reference and a live demo per chart type are at [ripl.run/charts](https://www.ripl.run/charts/).

## License

[MIT](../../LICENSE)
