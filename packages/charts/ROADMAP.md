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
| Multiple / secondary axes | 🟡→✅ line | ✅ | ✅ | ✅ | ✅ done (A6, line); area/bar/scatter ⏳ |
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
theming/dark mode (done, B1), annotations (done, B2), secondary axes (done for
line, A6; area/bar/scatter follow), and accessibility (B3 — ARIA + colourblind
palette done; keyboard nav and pattern fills remain the largest post-1.0 gap).

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

### A6 (remaining) — secondary axis for area / bar / scatter

The secondary y-axis is implemented for **line** (see
[Completed](#completed-1.0-consistency-work)): `yAxes: ChartYAxis[]` behind a
`get yAxis()` shim, series `axis?: number | string` binding, per-axis extent + scale,
right-hand axis band. Extending it to **area**, **bar**, and **scatter** requires their
shared series renderer to resolve a y-scale *per series* (not one plot-wide `yScale`).

- **Risk:** layout collision between a right-side second axis and a right-positioned
  legend; per-axis extent isolation. Reuse line's `_renderSecondaryAxes` partitioning.

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
