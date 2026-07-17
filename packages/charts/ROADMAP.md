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
  experimental WebGL/WebGPU. This exceeds Chart.js (canvas-only) and matches or
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
| Multiple / secondary axes | ❌ typed, unimplemented | ✅ | ✅ | ✅ | ⏳ A6 |
| Stacking / **100%-stacked** | ✅ / ❌ | ✅/✅ | ✅/✅ | ✅/✅ | ⏳ B4 |
| Legends (present + interactive toggle) | 🟡→✅ present | ✅ | ✅ | ✅ | ✅ done (A7); toggle ⏳ |
| Shared axis-pointer tooltip | 🟡 per-element | 🟡 | ✅ | ✅ | ⏳ B4 |
| Data labels | 🟡 uneven | 🟡 (plugin) | ✅ | ✅ | ⏳ B4 |
| **Annotations** (reference lines / bands / markers) | ❌→✅ | 🟡 (plugin) | ✅ | ✅ | ✅ done (B2) |
| Zoom / pan / data-zoom | ✅ Navigator | 🟡 (plugin) | ✅ | ✅ | ✅ done |
| **Theming / dark mode** | ❌→✅ | 🟡 | ✅ built-in | ✅ | ✅ done (B1) |
| **Accessibility** (ARIA / keyboard / patterns) | ❌→🟡 | 🟡 | ✅ | ✅ module | 🟡 ARIA+CVD done (B3); keyboard/patterns ⏳ |
| Export (png / svg / …) | ✅ | 🟡 | ✅ | ✅ | ✅ done |
| Animation | ✅ path-morphing | ✅ | ✅ | ✅ | ✅ done |
| Formatting / i18n | 🟡→✅ Intl | 🟡 | ✅ | ✅ | ✅ mostly (A2) |
| Responsive demos | 🟡→✅ | ✅ | ✅ | ✅ | ✅ done (A1) |
| Real-time / streaming | ✅ realtime chart | 🟡 | 🟡 | 🟡 | ✅ done |
| **API consistency across chart types** | ❌→✅ | ✅ | ✅ | ✅ | ✅ done (A3) |

**Headline 1.0 gaps:** cross-chart consistency (done), configurable axes (done),
theming/dark mode (B1), annotations (B2), multiple axes (A6), and accessibility
(B3 — objectively the largest gap; scoped post-1.0).

## Completed 1.0 consistency work

Landed on `claude/ripl-chart-gap-analysis-rmiuy1`:

- **A1 — Demo UX.** The docs demo wrapper (`app/.../example.vue`) now right-aligns
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

### A5 — Class-hierarchy consolidation (stock / gantt / realtime)

Only 7 of the axis charts extend `CartesianChart`; **stock**, **gantt**, and
**realtime** extend `Chart` and hand-roll axis/grid/crosshair/tooltip wiring, so
they miss the navigator, overview strip, plot clipping, configurable scales (A4),
and formatting for free.

- Extract `createChartAxes(scene, renderer, axis, setup)` from `setupCartesian`
  (a no-op refactor first, as a regression guard).
- Migrate **stock** and **gantt** onto `CartesianChart` (candles/wicks/volume and
  task-bars/today-marker move into `addPlotContent`; bespoke scales retained).
- Helper-share for **realtime** (sliding-window) and **heatmap** (dual categorical)
  — they call `createChartAxes` directly rather than fully inheriting.
- **Risk:** regressions in bespoke rendering — verify candles/task-bars visually.

### A6 — Multiple / secondary axes

`ChartAxisOptions.y` is already typed as an array but every consumer collapses to
`y[0]`. Implement a real secondary y-axis:

- `ChartYAxisItemOptions` gains `id?`; bar/line/area/scatter series gain
  `axis?: number | string`.
- `CartesianChart` holds `yAxes: ChartYAxis[]` with a `get yAxis()` shim (single-axis
  charts stay inert), groups series by axis, computes a per-axis extent + scale, and
  reserves a right-hand band for the secondary axis.
- **Risk:** layout collision between a right-side second axis and a right-positioned
  legend; per-axis extent isolation. Land `line` first, then area/bar/scatter.

> **Why A5/A6 remain:** both change rendering that needs visual verification a
> headless test run can't provide. A5 moves candle/task-bar drawing under
> `addPlotContent`; A6 requires the **shared** line/area/trend series renderer to
> resolve a y-scale *per series* (not one plot-wide `yScale`), which touches every
> cartesian chart. Both are specified above and ready to implement with a human in
> the loop to eyeball the result, rather than rushed blind.

### Interactive legends

Legends now render across the chart families, but toggling a legend entry only
hover-dims; wire the `Legend` `onToggle`/`active` state to actually hide/show a
series (the plumbing — `onToggle` re-render — is already in place).

### B3 (remaining) — keyboard navigation + pattern fills

ARIA labelling (`role="img"` + `aria-label` from `description`/title) and a
colourblind-safe theme (`'colorblind'`, Okabe–Ito) have landed. Still to do:

- **Keyboard navigation:** a hidden, focusable DOM layer synced to data points
  (canvas has no native focus targets), arrow traversal, Enter → existing `click`.
- **Pattern/decal fills:** a canvas/SVG pattern generator so series are
  distinguishable without colour; an optional visually-hidden data-table fallback.

### B4 — Smaller primitive gaps (opportunistic)

Radial/angular scale (`scaleRadial`) so polar charts stop hand-rolling; `scaleSymlog`
and a UTC time scale; an optional d3-format specifier parser; a marker-symbol set
(star/cross/triangle/diamond/wye) beyond `Circle`; a **100%-stacked** helper
(extend `computeStackOffset`); time-series **downsampling** (LTTB) for realtime/large
data; an expanded easing set (sine/expo/circ/bounce); a moving-average/smoothing data
transform; a shared/synced axis-pointer tooltip.
