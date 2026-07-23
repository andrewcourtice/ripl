# @ripl/charts

Pre-built, animated chart components for [Ripl](https://www.ripl.run) — a unified API for 2D graphics rendering in the browser.

## Installation

```bash
npm install @ripl/charts
```

## Chart Types

25 chart types, each created with a `createXChart` factory:

| Category | Charts |
|----------|--------|
| **Cartesian** | Bar, Line, Area, Scatter, Histogram, Box Plot, Trend (mixed bar/line/area), Stock |
| **Radial & Polar** | Pie/Donut, Polar Area, Polar Scatter, Radial Bar, Radar, Gauge |
| **Hierarchical** | Sunburst, Treemap, Packed Circle |
| **Network & Flow** | Sankey, Chord, Arc Diagram, Force-Directed, Funnel |
| **Specialized** | Heatmap, Gantt, Realtime |

## Usage

Create a chart by passing a target (CSS selector, `HTMLElement`, or Ripl `Context`) and an options object to the chart's factory function:

```typescript
import {
    createBarChart,
} from '@ripl/charts';

const chart = createBarChart('#chart', {
    data: [
        {
            label: 'A',
            value: 10,
        },
        {
            label: 'B',
            value: 25,
        },
        {
            label: 'C',
            value: 15,
        },
    ],
    key: 'label',
    series: [
        {
            id: 'values',
            label: 'Values',
            value: 'value',
        },
    ],
});

// Merge new options/data and re-render with animated transitions
chart.update({
    data: [
        {
            label: 'A',
            value: 30,
        },
        {
            label: 'B',
            value: 5,
        },
        {
            label: 'C',
            value: 20,
        },
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

Full documentation, options reference, and interactive demos are available at [ripl.run](https://www.ripl.run).

## License

[MIT](../../LICENSE)
