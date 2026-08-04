# Chart option vocabulary

The rules every `@ripl/charts` option must follow. They exist because the same
concept had been named, unitised and shaped differently in each chart — `min`
vs `minValue` vs `yMin` vs `axis.y.min` for one domain bound, `gap` in pixels on
one chart and as a ratio on another, `legend` accepting two incompatible objects.
A consumer who learns one chart should be able to guess the next.

When adding or changing an option, match an existing name from this document
before inventing one. If nothing fits, add the new concept here in the same pass.

## Accessors

An accessor is `keyof TData | ((item: TData) => T)`. Two naming groups:

**Structural accessors** — what the datum *is*. Bare nouns:

| Option | Meaning |
|---|---|
| `key` | Identity/category. `xKey`/`yKey` when a chart has two category axes. |
| `value` | The primary numeric value. |
| `label` | Display name. Always optional, defaulting to `key`. |
| `start`, `end` | A time or numeric span. |
| `open`, `high`, `low`, `close`, `volume` | OHLC fields. |
| `progress` | A 0–1 completion ratio. |

**Encoding-channel accessors** — how the datum *maps to a visual channel*.
Suffixed `By`:

| Option | Channel |
|---|---|
| `xBy`, `yBy` | Position on a continuous axis. |
| `angleBy`, `radiusBy` | Position in a polar plot. |
| `sizeBy` | Mark size, scaled between `minRadius` and `maxRadius`. |
| `colorBy` | Mark color. |

A `*By` option names a channel, never a pixel measurement. `radiusBy` is an
accessor; `nodeRadius`, `markerRadius`, `minRadius` and `maxRadius` are pixels.

## Series

Series options live in a `series` array. Every series has `id`; `label` is
`string | ((item: TData) => string)` and optional, defaulting to `id`. A series
binds to a secondary axis with `yAxis?: number | string` — not `axis`, which is
the chart-level axis configuration.

## Toggles

No `show*` booleans. A toggle for something with any configuration of its own is
`boolean | { visible, … }`, matching `grid`, `legend`, `tooltip` and `crosshair`.
A sub-feature driven entirely by the presence of an accessor needs no toggle at
all.

## Bounds, counts and divisions

| Option | Meaning |
|---|---|
| `min`, `max` | Domain bounds. On a cartesian chart these live on the axis (`axis.y.min`). |
| `ticks` | Tick count, on an axis or anything else that draws ticks. |
| `levels` | Concentric rings in a radial plot. |
| `sectors` | Angular divisions in a radial plot. |
| `bins` | Histogram bin count (a domain term, kept). |

## Units

- **Angles are degrees**, measured clockwise from twelve o'clock, and converted
  internally. `startAngle`, `endAngle`, `padAngle`.
- **`gap` is always pixels.** A proportional gap between band-scaled marks is
  `bandPadding` (0–1), matching band-scale terminology.
- **`padWidth` is pixels, between radial segments.** It is the linear sibling of
  `padAngle`: where `padAngle` insets each end of a sector by a fixed *angle* and
  so opens a wedge that widens with radius, `padWidth` insets each radius by
  `asin(padWidth / 2r)` and so opens a gap of constant width. The facing edges
  are parallel on an **annular** sector; an open arc has no inner edge to inset,
  so `padWidth` becomes a single trim at the outer radius and adjacent edges
  converge to nothing at the centre. Use `padWidth` when the gap must read the
  same at the inner and outer edge of a donut; use `padAngle` when the gap should
  scale with the segment. `padWidth` takes precedence wherever it is
  **provided** — `padWidth: 0` means *no padding*, not *fall back to
  `padAngle`* — so animating it up from `0` is continuous. It is distinct from
  `gap`, which separates non-radial marks along an axis.
- **Radii accept `number | \`${number}%\``**: a value ≤ 1 or a percent string is a
  fraction of the outer radius, a value > 1 is pixels. `innerRadius`,
  `outerRadius`.
- **Spacing between elements comes from `SPACING`** (`constants/spacing.ts`), an
  8-point scale with a 4px half-step for gaps inside a single component. Never
  write a bare pixel gap.

## Value shapes

One shape per property name, across every chart:

| Option | Shape |
|---|---|
| `padding` | `PaddingInput = number \| [top, right, bottom, left] \| Partial<ChartPadding>` |
| `borderRadius` | `BorderRadiusInput = number \| [tl, tr, br, bl] \| 'full'` |
| `labels` | `ChartLabelsInput` — `boolean \| position \| Partial<ChartLabelsOptions>` |
| `legend` | `ChartLegendInput` — `boolean \| LegendPosition \| Partial<ChartLegendOptions>` |
| `format` | `ValueFormatInput` — formats **values** |
| `tickFormat` | `ValueFormatInput` — formats **tick labels** |
| `lineStyle` | `LineStyleInput` — a `LineStyle` for the whole line, or key-anchored style segments; no raw `lineDash` |
| `stacked` | `boolean \| 'percent'` (`boolean` only where percent is meaningless — see below) |
| `palette` | `string[]` — a positional series palette |
| `gradient` | `string[]` — sequential color stops, low to high |

`palette` and `gradient` are distinct because a positional palette and a
sequential ramp are not interchangeable — they were both called `colors`.

`borderRadius` on the **Arc** element is the one exception to that shape: it is a
plain `number`. An annular sector's corners have no `[tl, tr, br, bl]` order to
address, and the radius is clamped per-corner to half the band thickness and to
what the sector's span allows, so a `'full'` sentinel would mean nothing beyond
passing a large number. Anything laying out arcs (pie, donut, radial, gauge)
passes a scalar through. On an **open** arc (no `innerRadius`) it also flips the
path's topology: `0` leaves a bare arc that a fill closes with a chord (a
circular segment), any non-zero value closes it through the centre (a wedge).
Filled area, hit region and stroke all jump at that boundary, so never animate an
open arc's `borderRadius` up from `0` — give it an `innerRadius` instead.

A shared shape may still be *narrower* on a chart where the wider form has no
meaning. `TrendChartOptions.stacked` takes `boolean` rather than
`boolean | 'percent'` because normalizing to a share of a category total needs
every series to share one mark type, and a trend chart mixes lines, bars and areas
on one value axis. Narrowing like this must be documented on the option itself,
so it reads as a decision rather than an oversight.

## Events

`<noun>click` / `<noun>enter` / `<noun>leave`, where the noun is the domain datum
the mark represents. Generic marks use the generic noun:

| Noun | Mark |
|---|---|
| `marker` | A point on a plot (line, area, scatter, radar, trend). |
| `node` | A node in a hierarchy or network. |
| `cell` | A cell in a grid. |
| `segment` | A wedge in a radial plot. |
| `link` | A connection between two nodes. |

Domain-specific nouns are kept where the payload genuinely differs: `bar`, `bin`,
`box`, `candle`, `task`, `value`. Every event map is generic over `TData` where a
datum exists, and every payload carries an `{ x, y }` anchor.

## Inheritance

A chart must not re-declare an option it inherits. `CartesianChartOptions`
already provides `axis`, `grid`, `tooltip`, `legend`, `crosshair`, `annotations`,
`navigator` and `overview`; re-declaring one only lets its documentation drift.
A chart that needs cartesian furniture extends `CartesianChart`.
