---
name: ripl-charts
description: >-
  Build production-ready charts in the Ripl monorepo (@ripl/charts) — a new chart type, or a fix/demo
  for an existing one — with correct animation, interaction, docs, and demos, first try. Use whenever
  adding or changing a chart in packages/charts, its VitePress demo/docs under apps/website/src/charts, or
  the shared chart infrastructure. Covers the factory+class pattern, the enter/update/exit render
  pipeline, tooltips/hover-highlight, labels, the element toolkit, demo authoring, gallery/docs
  registration, and how to verify in this sandbox.
---

# Building Ripl charts

Ripl is a Yarn 4 monorepo. Charts live in `@ripl/charts` and render on the retained-mode scenegraph
from `@ripl/core` (context-agnostic: Canvas, SVG, and terminal). A chart is a factory + a class over a
`Scene`/`Renderer`; every chart gets animated transitions, pointer events, responsive sizing, and
tooltips for free by following the shared pattern below.

Match the surrounding code's idiom (comment density, naming, `arrayJoin` reconcile, `data`-driven
transitions). When in doubt, copy the closest existing chart: `scatter.ts`/`polar-scatter.ts` (Chart
base), `line.ts`/`area.ts` (CartesianChart base), `packed-circle.ts`/`force-directed.ts` (custom
layouts), `pie.ts`/`radial-bar.ts` (arcs).

## Where things live

- `packages/charts/src/charts/<name>.ts` — the chart (factory `create<Name>Chart` + class).
- `packages/charts/src/core/` — shared infra: `chart.ts` (base `Chart`), `cartesian.ts`
  (`CartesianChart` with scales/axes/grid/crosshair), `animation.ts` (`ANIMATION_REFERENCE`,
  `resolveAnimation`, `stagger`, `exitElement`), `interaction.ts` (`applyHoverHighlight`),
  `labels.ts` (`createSegmentLabel`, `createDataLabel`), `data.ts` (`resolveAccessor`),
  `options.ts` (`resolveValueFormat`, `resolveLineDash`), `morph.ts` (`correspondence`, `keysDiffer`),
  `pack.ts`, `force.ts`, `fill.ts`.
- `packages/charts/src/components/` — `tooltip.ts`, `legend.ts`, `axis.ts`, `grid.ts`, `crosshair.ts`.
- `packages/charts/test/` — vitest unit tests; `test/visual/gallery.ts` + `chart-ids.ts` drive
  Playwright snapshots.
- `apps/website/src/charts/<name>.md` — the VitePress demo + docs page.
- `apps/website/src/charts/getting-started.md` — the "Available Charts" table (register new charts here).

## Anatomy of a chart

<!-- eslint-skip -->
```ts
export interface <Name>ChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    key: keyof TData | ((item: TData) => string);
    value: keyof TData | ((item: TData) => number);
    // ...chart-specific options, each documented with a /** */ comment
    format?: ValueFormatInput;
}

// A typed event map — every interactive chart emits click/enter/leave with a typed payload.
export interface <Name>ChartEventMap extends EventMap {
    cellclick: <Name>CellEvent;
    cellenter: <Name>CellEvent;
    cellleave: <Name>CellEvent;
}

export class <Name>Chart<TData = unknown> extends Chart<<Name>ChartOptions<TData>, <Name>ChartEventMap> {
    private groups: Group[] = [];      // persisted between renders for arrayJoin reconcile
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: <Name>ChartOptions<TData>) {
        super(target, options);
        this.tooltip = new Tooltip({ scene: this.scene, renderer: this.renderer });
        this.init();                   // MUST call init() last — it triggers the first render
    }

    public async render() {
        return super.render(async () => {
            // ...build geometry, reconcile, return Promise.all([...transitions])
        });
    }
}

export function create<Name>Chart<TData = unknown>(target: string | HTMLElement | Context, options: <Name>ChartOptions<TData>) {
    return new <Name>Chart<TData>(target, options);
}
```

Extend **`Chart`** for radial/network/custom layouts; extend **`CartesianChart`** when you need x/y
scales, axes, grid, and crosshair (it exposes `this.xScale`, `this.yScale`, axis/grid rendering).
`chart.update(partialOptions)` merges options and re-renders; `chart.destroy()` tears everything down.

## The render pipeline

Inside `super.render(async () => { ... })`:

1. **Layout**: `const layout = this.createLayout(); this.reserveTitle(layout);` then optionally
   `this.reserveLegend(layout, legendItems, this.options.legend);` — each carves space out of
   `layout.area` (the drawable rect: `{ x, y, width, height }`).
2. **Accessors**: `const getKey = resolveAccessor<TData, string>(key);` (accepts a field name or a
   function). `resolveValueFormat(this.options.format)` for tooltip/label number formatting.
3. **Colors**: `this.resolveSeriesColors(items.map(i => ({ id, color })))` once, then
   `this.getSeriesColor(id)` per series (respects an explicit `color` and the config palette).
4. **Reconcile** existing elements against new data with `arrayJoin` (from `@ripl/utilities`):
   ```ts
   const { left: entries, inner: updates, right: exits } =
       arrayJoin(data, this.groups, (item, group) => group.id === getKey(item));
   exits.forEach(group => group.destroy()); // or exitElement(...) to animate out
   ```
   `left` = entering (new), `inner` = `[data, element]` pairs to update, `right` = leaving. Persist the
   combined `[...entryGroups, ...updates.map(([, g]) => g)]` back onto `this.groups`.
5. **Create entering elements** at their *start* state (e.g. `radius: 0`, `opacity: 0`) and stash the
   *target* state on `element.data`. **Update existing elements** by setting `element.data` to the new
   target (and applying non-tweenable props like `renderer`/`lineCap`/`lineDash`/`stroke` directly —
   see pitfalls).
6. **Transition**: return `Promise.all([...])` of `this.renderer.transition(elements, factory)`:
   ```ts
   const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
   const update = this.resolveAnimation(ANIMATION_REFERENCE.update);
   this.renderer.transition(entryCircles, (element, index, length) => ({
       duration: enter.duration,
       delay: stagger(index, length, enter.duration), // sequence the entry
       ease: easeOutCubic,
       state: element.data as CircleState, // animate toward the stashed target
   }));
   ```
   Use `ANIMATION_REFERENCE.enter | update | hover` so `animation: false` and custom durations are
   honored. `stagger(index, length, duration, fraction?)` spreads delays.

### Path & point animation helpers (`@ripl/core`)

- `interpolatePath(points)` — reveals a path from its start to end (draw-on). Use for lines/arcs
  growing out of a point (area entry, arc-diagram ripple). Pass it as a `state.points` value.
- `interpolatePoints(from, to, { resolveKeys })` — morphs point arrays with key reconciliation so a
  curved series stays curved across add/remove (`resolveKeys: () => correspondence(prevKeys, newKeys)`
  from `core/morph.ts`, guarded by `keysDiffer`).
- `interpolateWaypoint(points)` — a point sampler along a polyline.
- **Closed curved fills** (area/band) must curve only the line-following edge, not the whole loop —
  use `areaBandRenderer` / `anchoredAreaRenderer` from `core/fill.ts` (built on
  `resolvePolylineRenderer`). A plain curve over `[top, reversed bottom]` gaps away from the line.

## Interaction

- **Tooltip + hover highlight**: `applyHoverHighlight(element, { renderer, duration, ease, tooltip,
  anchor, content, highlight, restore, onEnter, onLeave, onClick })`. `anchor()` returns the tooltip
  point; `highlight`/`restore` are partial states toggled on hover. Highlight the property that
  actually carries the color — `{ fill }` for filled shapes, `{ stroke }` for stroked shapes (stroked
  arcs, lines, links). Emit typed events from `onEnter/onLeave/onClick` via `this.emit('cellenter', payload)`.
- **Legend hover-highlight**: call `this.registerHighlightGroups(this.groups)` so hovering a legend
  item dims the other series (wired through `reserveLegend`).
- **Hit testing** is path-based (`Shape2D.intersectsWith` → `isPointInStroke || isPointInPath`), so a
  thick **stroked** arc/line hit-tests precisely on its band — no need for a filled shape.

## Labels

Use `createSegmentLabel({ id, x, y, content, font })` (fades via `text.data = { opacity: 1 }`) or
`createDataLabel(...)` from `core/labels.ts` for consistent styling. Reconcile labels on update
(reposition + fade) alongside their shapes; never leave stale labels.

## Element toolkit (`@ripl/core`)

`createCircle` (`cx,cy,radius`), `createArc` (`cx,cy,radius,innerRadius?,startAngle,endAngle,padAngle?`),
`createLine` (`x1,y1,x2,y2`), `createPolyline` (`points`, `renderer`), `createText`, `createGroup`,
`createRect`. Shapes take `autoFill`/`autoStroke` toggles.

- **Rounded radial/progress bars**: draw an **open arc** (no `innerRadius`) on the band centerline,
  stroked with `lineWidth = band thickness` and `lineCap: 'round'` — a round cap rounds the sweeping
  end. `Arc`'s `borderRadius` is not implemented in render; don't rely on it.
- **Polyline curves**: `renderer` is a named type (`'linear' | 'spline' | 'cardinal' | 'monotoneX' | …`)
  or a custom `(context, path, points) => void`. Resolve a named one with `resolvePolylineRenderer`.
- **`matches`/`closest`** are on **every `Element`** (via the `Queryable` contract), not just `Group`:
  `el.matches('rect.active')`, `el.closest('#chart')`. `query`/`queryAll` remain group/free-function.
  Note: the `class` option does **not** split on whitespace — pass `class: ['a', 'b']` for two classes.
- **Eases**: quad/cubic/quart/quint (in/out/inOut) plus `easeOutBack` and `easeOutElastic` for springy
  entrances (e.g. force-directed nodes springing from the root).

## Custom layouts

- **Circle packing**: `packSiblings(circles)` (front-chain, tight, centered on the origin) +
  `enclosingCircle(circles)` (Welzl minimal enclosing circle) from `core/pack.ts`. Draw a visible
  containing circle at the fit radius.
- **Force layout**: `simulateForce(nodes, links, options)` from `core/force.ts` — deterministic,
  seeds only zero positions. Persist settled positions per id and seed the next run from them so
  reweights relax from the current layout (glide, not reshuffle). Spring nodes out from a root using
  BFS depth for the stagger and `easeOutBack`.

## Authoring the demo (`apps/website/src/charts/<name>.md`)

VitePress page with a live example. Copy an existing page (e.g. `radial-bar.md`). Essentials:

```md
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="<Name>">
            <RiplField label="Rounded" inline><RiplSwitch v-model="rounded" /></RiplField>
        </RiplChartConfig>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    buildCommonOptions,
    useChartConfig,
} from '../../.vitepress/compositions/use-chart-config';

import {
    create<Name>Chart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const config = useChartConfig({ features: { title: true, legend: true, animation: true }, title: '…' });
const { contextChanged, chart } = useRiplChart(context =>
    create<Name>Chart(context, { data, /* … */, ...buildCommonOptions(config) }));

function apply() { chart.value?.update({ /* … */, ...buildCommonOptions(config) }); }
watch(config, apply, { deep: true });
</script>
```

Demo data rules (so transitions actually demonstrate):
- **Distinct series** — don't let multiple series read identical fields (they'd overlap). Give each
  series its own accessors / regions.
- **Real add/remove** — keep a stable array and `push`/`pop`/`slice` one item; don't regenerate the
  whole dataset (that makes add/remove look like a randomize and jumps every element).
- **Randomize** re-rolls values but keeps counts and identities.

Then document Usage, Data Format, and an **Options** bullet list (one line per option, with defaults),
and add the chart to the "Available Charts" table in `getting-started.md`.

> **Imports follow the repo grouping convention** (`ripl/import-export-spacing`, see `AGENTS.md`):
> each braced import on its own multi-line group with a trailing comma and alphabetised members;
> side-effect and default imports group by kind; groups of differing kinds are blank-separated. Doc-page
> `<script setup>` blocks are linted, so keep this format or `yarn lint` will fail.

## Gallery snapshot

Add a `create<Name>Chart(mount('<name>'), { animation: false, … })` block to
`packages/charts/test/visual/gallery.ts` (exercise notable options), and the id to `chart-ids.ts`.
`animation: false` renders the final frame for a stable screenshot.

## Verifying in this sandbox

`yarn install`/`vitest`/the app build can't run here (partial `node_modules`; only `typescript`). Use:

- **Type-check** with the standalone compiler over the source + tests:
  `node node_modules/typescript/bin/tsc -p <scratchpad>/tc.json` (maps `@ripl/*` → source,
  `types: []`, `skipLibCheck`). Keep a `tc-tests.json` / `tc-gallery.json` including test files plus a
  `vitest-shim.d.ts`. Must be clean after every change.
- **Pure logic** (packers, force sim, geometry) can be compiled with `tsc <file> --outDir … --module
  commonjs --ignoreDeprecations 6.0` and exercised with `node` for a real behavioral check.
- **Runtime chart render** needs jsdom + a mock canvas (`@ripl/test-utils` `mockCanvasContext`,
  `polyfillPath2D`) — run via `vitest` locally. Charts that can't init headlessly (svg/webgpu/terminal)
  document the limitation and rely on the shared context-free logic.
- **Locally (user runs)**: `yarn test` (vitest unit), Playwright visual snapshots, and
  `yarn workspace @ripl/website prepare-playground` + `yarn workspace @ripl/website start` to eyeball demos.

## Common pitfalls

- **Non-tweenable props** (`renderer`, `lineCap`, `lineDash`, `stroke`, text `content`) must be set
  **directly** on the element, not put in the transition `state` — the tween would snap them at t=0.5.
- **Curved area fills** gap against the line unless you use the `core/fill.ts` band renderers.
- **Stroked arcs** for rounded bars; `Arc.borderRadius` does nothing.
- **Reweight/reflow** should animate from current positions — persist layout state (force positions,
  morph keys) between renders.
- Call **`this.init()` last** in the constructor; it triggers the first render.

## Commit hygiene

Commit per logical change with the required trailers:
```
Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Nbx2eSMiLFPNQfd11euXC7
```
Never put the internal model identifier in commits, code, or docs.
