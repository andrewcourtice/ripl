---
outline: "deep"
---

# Migration

## Option naming alignment

Charts had grown their own names, units and value shapes for the same ideas — one
domain bound was spelled four different ways, `gap` meant pixels on one chart and
a ratio on another, and `legend` accepted two incompatible objects. Options that
mean the same thing across charts now share a name and a shape, defined in
[`OPTIONS.md`](https://github.com/andrewcourtice/ripl/blob/main/packages/charts/OPTIONS.md).

These are breaking renames with no aliases. Every rename is mechanical: the
behaviour is unchanged.

### Domain bounds

`min` and `max` everywhere. On a cartesian chart they live on the axis
(`axis: { y: { min, max } }`), which is unchanged.

| Chart | Before | After |
|---|---|---|
| Gauge | `minValue`, `maxValue` | `min`, `max` |
| Radar | `maxValue` | `max` |
| Polar scatter | `maxValue` | `max` |
| Radial bar | `maxValue` | `max` |

```ts
// Before
createGaugeChart('#container', { value: 72, minValue: 0, maxValue: 100 });

// After
createGaugeChart('#container', { value: 72, min: 0, max: 100 });
```

### Ticks and divisions

`ticks` is the tick count anywhere ticks are drawn; `sectors` is the number of
angular divisions in a radial plot.

| Chart | Before | After |
|---|---|---|
| Gauge | `tickCount` | `ticks` |
| Gauge | `showTickLabels` | `tickLabels` |
| Gauge | `formatTick` | `tickFormat` |
| Polar scatter | `angleTicks` | `sectors` |

`format` always formats **values**; `tickFormat` always formats **tick labels**.

### Accessors

An accessor that maps data onto a visual channel is suffixed `By`, so it cannot be
mistaken for a pixel measurement. `radius` was an accessor on polar scatter and a
pixel size everywhere else.

| Chart | Before | After |
|---|---|---|
| Polar scatter | `series[].angle` | `series[].angleBy` |
| Polar scatter | `series[].radius` | `series[].radiusBy` |

### Secondary axis binding

A series' axis binding is `yAxis`, so it no longer collides with the chart-level
`axis` configuration object.

| Charts | Before | After |
|---|---|---|
| Bar, line, area, scatter | `series[].axis` | `series[].yAxis` |

<!-- eslint-skip -->
```ts
// Before
series: [{ id: 'rate', label: 'Rate', value: 'rate', axis: 1 }]

// After
series: [{ id: 'rate', label: 'Rate', value: 'rate', yAxis: 1 }]
```

### Colors

`colors` meant two incompatible things: a positional palette on the chord chart
and a sequential ramp on the heatmap. They are now named for what they are.

| Chart | Before | After |
|---|---|---|
| Chord | `colors` | `palette` (one color per group, positional) |
| Heatmap | `colors` | `gradient` (sequential stops, low to high) |

### Clearer names

| Chart | Before | After | Why |
|---|---|---|---|
| Chord | `labels` | `groups` | It is the array of group names, not label configuration — every other chart's `labels` configures value labels. |
| Box plot | `categories` | `categoryOrder` | It orders categories found in the data; radar's `categories` *defines* the axes. |

### Event names

An event's noun is the datum its mark represents. Generic marks use the generic
noun, so the same handler shape works across charts.

| Chart | Before | After |
|---|---|---|
| Radar | `pointclick` / `pointenter` / `pointleave` | `markerclick` / `markerenter` / `markerleave` |
| Chord | `arc*` | `segment*` |
| Chord | `ribbon*` | `link*` |
| Treemap | `cell*` | `node*` |
| Packed circle | `cell*` | `node*` |
| Sunburst | `segment*` | `node*` |

Domain-specific nouns are unchanged where the payload genuinely differs: `bar`,
`bin`, `box`, `candle`, `task`, `value`, and `cell` on the heatmap (a real grid
cell).

The corresponding payload types are renamed to match, e.g. `RadarChartPointEvent`
→ `RadarChartMarkerEvent`, `ChordChartArcEvent` → `ChordChartSegmentEvent`.

## `padding` accepts a per-edge object everywhere

`padding` on the chart already accepted `number | { top, right, bottom, left }`,
while `padding` on the title, legend and tooltip accepted
`number | [top, right, bottom, left]`. All of them now accept all three forms:

<!-- eslint-skip -->
```ts
padding: 16
padding: [16, 24, 16, 24]
padding: { top: 16, bottom: 24 }   // unspecified edges default to 0
```

The `legend.padding` option previously had no effect at all; it now reaches the
legend.

## Spacing

Gaps between chart elements come from an 8-point scale, exported as `SPACING`.
The visible change is that the axis title now clears the longest tick label by
16px instead of 6px, and the title, legend and navigator bands are separated from
their neighbours rather than sitting flush. If you relied on the previous tighter
spacing, set `padding` explicitly.

## Axis transitions

Axis ticks, labels, the axis line and the axis title now animate on update: a
surviving tick slides to its new position, entering ticks fade in from where their
value sat under the previous scale, and leaving ticks slide away as they fade out.
Axes animate over the same duration as the series they frame, rather than a
separate faster duration.

`chart.render()` on a cartesian chart therefore resolves when the axis transitions
have settled, matching how series renders already behaved. Pass
`animation: false` for the previous immediate behaviour.
