# @ripl/charts — 1.0 Gap Analysis & Roadmap

This document tracks Ripl's charting library toward a 1.0 release: a feature-gap
analysis against the leading general-purpose charting libraries (Chart.js, Apache
ECharts, Highcharts), the cross-chart consistency audit, and the prioritized work
remaining. It is the reference for anyone picking up the next slice of 1.0 work.

## Where Ripl already stands

Ripl ships an unusually broad surface for a pre-1.0 library:

- **25 chart types** — bar, line, area, scatter, histogram, box-plot, trend
  (bar+line+area combo), pie/donut, polar-area, radial-bar, radar, gauge,
  polar-scatter, sunburst, funnel, treemap, packed-circle, heatmap, chord,
  sankey, arc-diagram, force-directed, stock (OHLC/candlestick), realtime.
- **11+ D3-class scales** in `@ripl/core` — continuous (linear), band, point,
  ordinal, discrete, diverging, logarithmic, power/sqrt, quantile, quantize,
  threshold, time — plus sequential/diverging **colour** scales with perceptual
  schemes (viridis/plasma/inferno/magma/cividis/turbo, RdBu, BrBG).
- **Multi-backend rendering** behind one `Context` — Canvas, SVG, Terminal, and
  WebGPU. This exceeds Chart.js (canvas-only) and matches or
  edges ECharts (canvas+svg) and Highcharts (svg).
- **Path-morphing animation**, a pan/zoom/brush `Navigator`, and a statistics
  layer (binning, box-plot stats, linear regression, KDE, rollup, stacking).

So the barrier to a credible 1.0 is **depth and consistency**, not breadth.

## Feature gap analysis vs Chart.js / ECharts / Highcharts

Legend: ✅ strong · 🟡 partial / not-exposed · ❌ missing. The **Status** column
notes where this repo now stands after the 1.0 consistency work (see
[Completed](#completed-1.0-consistency-work)) and which roadmap item closes the gap.

| Capability | Ripl | Chart.js | ECharts | Highcharts | Status |
|---|---|---|---|---|---|
| Chart-type breadth | ✅ 25 incl. exotic | 🟡 core + plugins | ✅ | ✅ | ✅ done |
| Multi-backend (canvas/svg/terminal/webgpu) | ✅ unique | ❌ canvas | 🟡 canvas+svg | 🟡 svg | ✅ done |
| Scale types available | ✅ 11 + colour | 🟡 | ✅ | ✅ | ✅ done |
| **Configurable axis scale** (log/time/pow/nice/min-max/ticks) | 🟡→✅ | ✅ | ✅ | ✅ | ✅ done (A4) |
| Multiple / secondary axes | ✅ N-axis line/area/scatter/bar | ✅ | ✅ | ✅ | ✅ done (true N-axis; bar = vertical grouped) |
| Stacking / **100%-stacked** | ✅ / ✅ | ✅/✅ | ✅/✅ | ✅/✅ | ✅ done (`stacked: 'percent'`) |
| Legends (present + interactive toggle) | ✅ | ✅ | ✅ | ✅ | ✅ done (A7 + toggle) |
| Shared axis-pointer tooltip | ✅ `tooltip.trigger: 'axis'` | 🟡 | ✅ | ✅ | ✅ done (line/area/bar/scatter) |
| Data labels | ✅ | 🟡 (plugin) | ✅ | ✅ | ✅ done |
| **Annotations** (reference lines / bands / markers) | ❌→✅ | 🟡 (plugin) | ✅ | ✅ | ✅ done (B2) |
| Zoom / pan / data-zoom | ✅ Navigator | 🟡 (plugin) | ✅ | ✅ | ✅ done |
| **Theming / dark mode** | ❌→✅ | 🟡 | ✅ built-in | ✅ | ✅ done (B1) |
| **Accessibility** (ARIA / keyboard / patterns) | ❌→🟡 | 🟡 | ✅ | ✅ module | 🟡 ARIA+CVD+pattern paint done (B3); keyboard ⏳ |
| Export (png / svg / …) | ✅ | 🟡 | ✅ | ✅ | ✅ done |
| Animation | ✅ path-morphing | ✅ | ✅ | ✅ | ✅ done |
| Formatting / i18n | 🟡→✅ Intl | 🟡 | ✅ | ✅ | ✅ mostly (A2) |
| Responsive demos | 🟡→✅ | ✅ | ✅ | ✅ | ✅ done (A1) |
| Real-time / streaming | ✅ realtime chart | 🟡 | 🟡 | 🟡 | ✅ done |
| **API consistency across chart types** | ❌→✅ | ✅ | ✅ | ✅ | ✅ done (A3) |

**Headline 1.0 gaps:** cross-chart consistency (done), configurable axes (done),
theming/dark mode (done, B1), annotations (done, B2), secondary axes (done for
line/area/scatter/bar, A6), and accessibility (B3 — ARIA, colourblind palette, and
pattern-fill paint done; keyboard navigation remains the largest post-1.0 gap).

## Completed 1.0 consistency work

Landed on `claude/ripl-chart-gap-analysis-rmiuy1`:

- **A1 — Demo UX.** The docs demo wrapper (`apps/website/.../example.vue`) now right-aligns
  the Export button and uses a mobile-first aspect ratio (`4/3` on phones, `16/9`
  at ≥640px) so charts aren't squashed on small screens.
- **A2 — Formatting foundation.** Removed the duplicate charts-local `formatNumber`
  in favour of the Intl-based `@ripl/utilities` one; widened `ValueFormatInput` to
  accept Intl number-format options (`{ style: 'currency', currency: 'USD' }`,
  `{ notation: 'compact' }`, …) on any `format`/axis `format`.
- **A3 — Option-naming unification** (breaking, see [Migration](#migration--breaking-changes)).
- **A4 — Configurable scales + axes.** Every axis accepts `scale`
  (`linear`/`log`/`pow`/`sqrt`), `nice`, `ticks`, `min`, `max`, `base`, `exponent`
  via `core/scales.ts` (`createValueScale`, `axisTickCount`). The hard-coded
  `ticks(10)` is gone from bar/line/area/scatter/box-plot.
- **A7 — Legends.** The previously-orphaned `ColorLegend` is wired into `heatmap`
  (gradient legend); category legends added to funnel/treemap/packed-circle and
  node/group legends to sankey/arc-diagram/force-directed.

Landed on `claude/ripl-chart-1.0-remaining` (this branch, on top of the above):

- **Formatting completeness.** `format?: ValueFormatInput` added to stock, gantt,
  realtime, sankey, and heatmap (every chart now exposes a value formatter).
- **B1 — Theming + dark mode.** `core/theme.ts`: `Theme` + `lightTheme`/`darkTheme`
  + a colourblind-safe theme, a registry, `resolveTheme`/`setDefaultTheme`
  (`'auto'` follows `prefers-color-scheme`). Charts take a `theme` option; the
  colour generator is seeded from the palette and the furniture normalizers read
  the active theme, so `setDefaultTheme('dark')` restyles everything. The light
  theme equals the historical colours, so default output is unchanged.
- **B2 — Annotations.** `components/annotation.ts` (reference lines, shaded bands,
  point markers) exposed as `annotations?` on `CartesianChartOptions`, resolved
  through the axis scales and clipped to the plot (line/area/bar/scatter).
- **B3 — Accessibility (partial).** Charts set `role="img"` + `aria-label` (from
  `description`, else title) on the rendering element; a colourblind-safe
  (Okabe–Ito) theme ships as `'colorblind'`.

Landed on `claude/ripl-chart-axes-a5-a6` (this branch, on top of the above):

- **A6 — Secondary y-axis (line).** `ChartYAxisItemOptions` gains `id?`; line series
  gain `axis?: number | string`. `CartesianChart` holds `yAxes: ChartYAxis[]` behind a
  `get yAxis()` shim (single-axis charts stay byte-for-byte inert), and line charts
  render a right-hand secondary axis with an independent per-axis extent + scale when a
  second `axis.y` entry is supplied. Area/bar/scatter follow the same pattern (roadmap).
- **A5 — `createChartAxes` extraction + dedup.** A shared `createChartAxes` factory in
  `components/axis.ts` replaces the duplicated inline `ChartXAxis`/`ChartYAxis`
  construction in the three non-`CartesianChart` charts (stock, gantt, heatmap); they
  also pick up A4's configurable `ticks` for free. Verified as a pixel-perfect no-op
  against the visual-regression baselines. The full stock/gantt migration *onto*
  `CartesianChart` is deferred (see remaining work below).

Landed in the 1.0 hardening pass (this branch):

- **Runtime reconfiguration.** `update()` now reconciles all furniture at runtime —
  axis scale/ticks/min/max/format/title/visibility, grid, tooltip, crosshair, legend
  position/styling, navigator, and theme — via a per-render `_syncCartesianOptions`
  pass; the docs demos drive live `update()` instead of recreating charts.
- **Interactive legends.** Legend clicks hide/show series and segments across every
  chart family, with animated exits, extent/stack/angle/layout recomputation over the
  active set, and hidden state that survives data updates (sankey deliberately
  dims only — hiding a flow node would orphan its links).
- **Continuous time x-axis** for line, area, and scatter (`axis.x.scale: 'time'`) —
  calendar-aligned `Date` ticks and span-adaptive default labels; unevenly spaced
  samples position proportionally to their timestamps.
- **X-axis tick label rotation** (`labelRotation`, degrees) with rotated band sizing
  and a narrower overflow-drop footprint.
- **Multi-line tooltips** — newline-separated lines plus greedy word wrap honouring
  `maxWidth`/`wrap`, reconfigurable at runtime.
- **Animated axis tick exits** (fade-out via `exitElement`) instead of instant removal.
- **A6 — Secondary y-axes for area and scatter** (mirroring the line pattern): per-series
  `axis` binding, per-axis extents over the active series, per-axis-group stacking for area.
- **100%-stacked mode** for bar and area (`stacked: 'percent'`) — share-space value
  accessors, a fixed 0–100% axis, percentage formatting defaults, and legend-toggle
  renormalization.
- **Marker symbol set** for line-family series and scatter bubbles
  (`marker: 'circle' | 'square' | 'diamond' | 'triangle'`) — equal-visual-area sizing and
  uniform radius animation (star/cross/wye remain below).
- **Value-keyed grid lines** — persisting ticks transition position, entries fade in,
  exits fade out (previously pixel-keyed destroy/recreate).
- **Data labels** for the remaining charts — heatmap (contrast-aware cell values), radar
  (vertex labels), radial-bar (sweep-end labels), polar-scatter (marker labels) — all off
  by default and runtime-toggleable.
- **A6 — Secondary y-axis for bar** (vertical grouped): per-series scale resolution in
  the bar renderer; stacked/percent modes and horizontal orientation stay primary-axis.
- **Shared axis-pointer tooltip** (`tooltip.trigger: 'axis'`) for line and area — the
  hovered category's title plus one row per active series, runtime-switchable.
- **Pattern (decal) paint** — `pattern(...)` strings render across canvas and SVG (see
  B3 note below).
- **True N y-axes** for line, area, scatter, and bar — generalized from the two-axis
  (left/right) model: each series draws against its bound axis's scale, and same-side axes
  stack outward via a shared `layoutYAxes`. Single-axis output is byte-identical. (Bar stays
  vertical-grouped-only; stacked/horizontal share one scale.)
- **`scaleRadial`** in `@ripl/core` — a clamp-by-default value→radius scale; polar-area,
  polar-scatter, and radar now share it instead of hand-rolling the mapping.
- **`scaleSymlog`** in `@ripl/core` + `axis.scale: 'symlog'` — a symmetric-log value axis that
  handles negatives and zero (linear near zero, log beyond a configurable `constant`).
- **Expanded easing** — sine/expo/circ/bounce in In/Out/InOut plus the missing Back/Elastic
  variants (31 built-in eases; every family complete), all resolvable by name from charts.
- **Shared axis-pointer tooltip for bar and scatter** — bar resolves the nearest category,
  scatter the nearest point; both list every active series and are runtime-switchable.

## Migration — breaking changes

Ripl is pre-1.0, so option naming was unified with a **clean break** (no aliases).
Update call sites as follows:

| Chart | Before | After |
|---|---|---|
| box-plot | `group` | `key` |
| heatmap | `xBy` / `yBy` | `keyX` / `keyY` |
| heatmap | `colorRange` | `colors` |
| radar | `axes: string[]` | `categories: string[]` |
| pie, polar-area, radial-bar, treemap, funnel, packed-circle, gantt | per-item `color` (accessor) | `colorBy` |
| polar-scatter | `maxRadiusValue` | `maxValue` |
| gauge | `min` / `max` | `minValue` / `maxValue` |
| gauge | `formatValue` / `formatTickLabel` | `format` / `formatTick` (now `ValueFormatInput`) |
| polar-area | `innerRadiusRatio` | `innerRadius` (0–1 fraction) |
| bar | `mode: 'grouped' \| 'stacked'` | `stacked?: boolean` (`BarChartMode` removed) |
| area, radar, trend, realtime | series `opacity` / `areaOpacity` | series `fillOpacity` |

Retained (intentionally, documented as exceptions): scatter series `xBy`/`yBy`
(numeric position accessors, not category keys); network-chart `source`/`target`
and node `id`/`group`; hierarchical node `color` fields; `upColor`/`downColor`
(stock), `trackColor` (gauge, radial-bar), `todayColor` (gantt).

## Roadmap — remaining 1.0 work

Ordered by priority. Each item's detailed design lives in the implementation plan;
this is the executable summary.

### A5 (remaining) — stock / gantt onto `CartesianChart`

The shared-axis extraction landed: `createChartAxes` now backs stock, gantt, and
heatmap (see [Completed](#completed-1.0-consistency-work)). What remains is migrating
**stock** and **gantt** to actually *extend* `CartesianChart` so they inherit the
navigator, overview strip, plot clipping, and annotation layer rather than
hand-rolling axis/grid/crosshair/tooltip wiring.

- Move candles/wicks/volume (stock) and task-bars/today-marker (gantt) into
  `addPlotContent`.
- **Why deferred:** the axis model is inverted from `CartesianChart`'s
  category-x / value-y assumption — gantt is band-**y** / time-**x**, and stock adds a
  volume sub-chart that reshapes the plot band. Both need the value/category axis roles
  to be parameterised on `CartesianChart` first, and visual verification of the bespoke
  candle/task-bar rendering, rather than a rushed blind port. **realtime** (sliding
  window) and **heatmap** (dual categorical) stay on `Chart` by design and already
  share `createChartAxes`.

### B3 (remaining) — keyboard navigation + pattern fills

ARIA labelling (`role="img"` + `aria-label` from `description`/title) and a
colourblind-safe theme (`'colorblind'`, Okabe–Ito) have landed. Still to do:

- **Keyboard navigation:** a hidden, focusable DOM layer synced to data points
  (canvas has no native focus targets), arrow traversal, Enter → existing `click`.
- **Pattern/decal fills:** the paint layer now ships them — `pattern(...)` strings
  (diagonal/cross-hatch/dots/horizontal/vertical) render as `CanvasPattern`s on canvas
  and swept `<pattern>` defs in SVG. Remaining: a chart-level series option applying
  decals automatically (e.g. with the colourblind theme) and an optional
  visually-hidden data-table fallback.

### B4 — Smaller primitive gaps (opportunistic)

A UTC time scale; an angular value→angle scale (`scaleAngular`) so gauge and radial-bar stop
hand-rolling the value→sweep mapping (the radius-mapping `scaleRadial` has shipped); an optional
d3-format specifier parser; the remaining marker symbols (star/cross/wye —
circle/square/diamond/triangle shipped); time-series **downsampling** (LTTB) for realtime/large
data; a moving-average/smoothing data transform; and a chart-level series option that applies
decal patterns automatically (e.g. with the colourblind theme).
