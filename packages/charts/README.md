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
import { BarChart } from '@ripl/charts';

const chart = new BarChart('#chart', {
    data: [
        { label: 'A', value: 10 },
        { label: 'B', value: 25 },
        { label: 'C', value: 15 },
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

[MIT](../../LICENSE)
