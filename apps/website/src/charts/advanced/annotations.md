---
outline: "deep"
---

# Annotations

Cartesian charts (line, area, bar, scatter, and the other axis-based charts) accept an `annotations` option — an array of reference lines, shaded bands, and point markers drawn over the plot. Each annotation is positioned by resolving its data values through the chart's axis scales, so annotations stay locked to the data as it updates, animates, or is panned and zoomed.

> [!NOTE]
> For the full API, see `ChartAnnotation` in the [Charts API Reference](/docs/api/@ripl/charts/).

## Quick Start

```ts
import {
    createLineChart,
} from '@ripl/charts';

const chart = createLineChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue',
            label: 'Revenue',
            value: 'revenue' },
    ],
    annotations: [
        { axis: 'y',
            value: 80,
            label: 'Target' },
        { type: 'band',
            axis: 'y',
            from: 60,
            to: 80,
            label: 'Acceptable' },
        { type: 'point',
            x: 10,
            y: 42,
            label: 'Peak' },
    ],
});
```

Annotations render above the series (so they are never hidden behind bars or areas) and never intercept pointer events — tooltips and hover highlights on the underlying data keep working.

## Reference Lines

A line annotation draws a straight line across the full plot at a fixed value on one axis. It is the default kind, so `type: 'line'` can be omitted.

<!-- eslint-skip -->
```ts
annotations: [
    // Horizontal line at y = 100
    { axis: 'y', value: 100, label: 'Threshold' },

    // Vertical line at x = 2024
    { axis: 'x', value: 2024, color: '#0ea5e9' },
]
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'line'` | `'line'` | Optional discriminator — a line is the default kind |
| `axis` | `'x' \| 'y'` | — | The axis the value is measured on |
| `value` | `number` | — | The axis value the line is drawn at |
| `label` | `string` | — | Optional label rendered beside the line |
| `color` | `string` | `'#ef4444'` | Line color |
| `lineWidth` | `number` | `1` | Line width in pixels |
| `lineDash` | `number[]` | `[6, 4]` | Dash pattern (pass `[]` for a solid line) |

An `axis: 'y'` line runs horizontally; an `axis: 'x'` line runs vertically. Labels sit at the right edge for horizontal lines and at the top for vertical lines.

## Bands

A band annotation shades a value range on one axis — a target zone, an acceptable operating range, or a highlighted period.

<!-- eslint-skip -->
```ts
annotations: [
    // Shade the 60–80 range on the value axis
    { type: 'band', axis: 'y', from: 60, to: 80, label: 'Nominal' },

    // Highlight a period on the x axis
    { type: 'band', axis: 'x', from: 2020, to: 2022, color: '#f59e0b', opacity: 0.2 },
]
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'band'` | — | Discriminator selecting a band |
| `axis` | `'x' \| 'y'` | — | The axis `from`/`to` are measured on |
| `from` | `number` | — | Lower bound, in axis values |
| `to` | `number` | — | Upper bound, in axis values |
| `label` | `string` | — | Optional label rendered inside the band |
| `color` | `string` | `'#ef4444'` | Fill color |
| `opacity` | `number` | `0.12` | Fill opacity (0–1) |

`from` and `to` may be given in either order — the band always spans between them.

## Point Markers

A point annotation places a dot (with an optional label) at a specific x/y data coordinate — a detected anomaly, an event, a maximum.

<!-- eslint-skip -->
```ts
annotations: [
    { type: 'point', x: 10, y: 42, label: 'Peak', radius: 5 },
]
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'point'` | — | Discriminator selecting a point marker |
| `x` | `number` | — | The x value (resolved through the x scale) |
| `y` | `number` | — | The y value (resolved through the y scale) |
| `label` | `string` | — | Optional label rendered beside the marker |
| `color` | `string` | `'#ef4444'` | Marker color |
| `radius` | `number` | `4` | Marker radius in pixels |

Point annotations need both a numeric x and y scale. On a chart with a categorical x axis (for example a bar chart), an `x`-valued annotation cannot be mapped and is skipped — the rest of the annotations still render.

## Updating Annotations

Annotations are ordinary chart options, so they participate in `chart.update()` like everything else:

```ts
chart.update({
    annotations: [
        { axis: 'y',
            value: newTarget,
            label: 'Target' },
    ],
});

// Remove all annotations
chart.update({ annotations: [] });
```

The overlay is redrawn on every render at the annotations' newly resolved positions — inexpensive for the handful of annotations a chart typically carries.

## Behavior Notes

- **Skipped, not thrown** — an annotation whose value cannot be resolved through the chart's scales (wrong axis kind, `NaN`) is silently skipped.
- **Pan/zoom aware** — when a [navigator](/charts/advanced/panning-and-zooming) is active, annotations are clipped to the plot rectangle so they don't slide into the axis gutters while panning; positions track the rescaled axes automatically.
- **Non-interactive** — annotation elements set `pointerEvents: 'none'`, so they never block tooltips or click events on the data beneath them.
