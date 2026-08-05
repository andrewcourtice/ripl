# Frontend graphics audit — implementation plan

## Context

An audit-and-fix pass across 11 areas of the monorepo: context event forwarding,
constants placement, hot-path performance, coordinate-space consistency, named CSS
colors relocation, arc-diagram hover hit-testing, arc `borderRadius`, radial-chart
segment styling, a scatter demo default, DRY/utilities adoption, and public-export
pruning. Exploration is complete — the Appendix carries verified findings with
`file:line` refs against `main` at the time of writing (post context-audit merges).
This plan groups the work into **9 PRs across 4 waves** — 8 code PRs plus a
documentation stream (per-PR doc gates and a closing docs-sweep PR with a migration
doc) — each with scope, success criteria, and subagent decomposition, for an
orchestrator to execute with a team of subagents. Re-verify each `file:line` before
editing; line numbers drift.

## Decision points

Defaults chosen below; each must be called out in its PR description so it can be
overridden cheaply in review:

1. **Rest fill for fill-only segments** — solid series color at rest; hover
   highlights by dimming the *other* segments (replaces 0.55-alpha rest + solid
   stroke + hover-to-solid).
2. **Gap scope** — fill-only + parallel gap applies to pie/donut, polar-area, **and**
   sunburst + chord (same filled-arc-plus-outline idiom today).
3. **Named colors** — keyword table wired unconditionally into `parseColor` (~3KB for
   parseColor consumers; fixes named-color tweening for free). Alternative if
   rejected: opt-in `registerColorKeywords()`.
4. **polar-area `padAngle`** — deprecated but functional (`@deprecated` JSDoc →
   `padWidth`); `padWidth` wins when both are set.
5. **Coordinate doctrine** — public pointer payloads are **logical** space (CSS px
   relative to the surface origin — what is actually emitted today); `hitTest` /
   `intersectsWith` take **surface** space; conversion only via `toLogicalPoint` /
   `toSurfacePoint`. Write-only `scaleDPR` is removed.

## Branch & PR strategy

One branch + PR per group. Commits conventional; PR titles sentence-style (use the
`ripl-pull-requests` skill per PR). `main` takes merge commits.

| PR | Branch | Scope | Wave | Base |
|----|--------|-------|------|------|
| 1 | `claude/frontend-graphics-audit-6sib8g` | pointer events + coordinate doctrine | 1 | main |
| 2 | `claude/audit-constants-placement` | constants placement | 1 | main |
| 3 | `claude/audit-css-colors-core` | named colors → core | 1 | main |
| 4 | `claude/audit-arc-geometry` | arc `borderRadius` + parallel gap | 1 | main |
| 5 | `claude/audit-radial-chart-visuals` | radial visuals, hover fix, scatter demo | 2 | PR4 branch |
| 6 | `claude/audit-hot-path-perf` | core/dom/svg perf | 2 | main after PR1 |
| 7 | `claude/audit-charts-dry` | charts DRY + O(n²) | 3 | PR5 branch |
| 8 | `claude/audit-export-pruning` | export pruning | 4 | main after all |
| 9 | `claude/audit-docs-sweep` | docs sweep + migration doc | 4 | main after PR8 |

Waves: 1–4 in parallel; PR5 stacks on PR4 immediately (retarget main when PR4
merges); PR6 starts after PR1 merges; PR7 stacks on PR5; PR8 goes last among the
code PRs and re-greps every pruning candidate first (earlier PRs may have
added/removed consumers); PR9 closes the program after PR8 (see Documentation
stream).

Known overlaps (trivial rebases): `AGENTS.md` (PR1 adds a Coordinate Spaces section,
PR2 strengthens the constants rule — different sections); `dom/src/context.ts` (PR1
handlers, PR2 moves the `:28` constant); `core/context/context.ts` (PR1
JSDoc/`scaleDPR`, PR6 `hitTest`).

---

## PR1 — Context pointer events + coordinate-space doctrine

**Files**: `packages/dom/src/context.ts`, `packages/core/src/context/{types,context}.ts`,
`packages/core/src/core/{constants,element}.ts`, `AGENTS.md`, `packages/dom/test/`.

**Events**
- Rename `_endDrag` → `_handleMouseUp` (dom/context.ts:271-301). Add
  `pointerDown: boolean` to the interaction state (set in `_handleMouseDown`, cleared
  at the top of `_handleMouseUp`) so the element+window double binding (:352/:365)
  yields exactly one `mouseup` per release — replaces the accidental
  `!state?.dragElement` guard that today skips everything for non-drag releases.
- Emit context `mousedown` `{x,y}` in `_handleMouseDown`; context `mouseup` `{x,y}`
  in `_handleMouseUp` (before the dragend logic); context `click` `{x,y}` in
  `_handleClick` after the `suppressClick` guard — the declared-but-never-emitted
  `click` (types.ts:90) finally fires; suppression semantics unchanged.
- Add `mousedown`/`mouseup` to `ContextEventMap` and `ElementEventMap` with JSDoc;
  add both to `TRACKED_EVENTS` (core/constants.ts:98-106). Element forwarding: widen
  `_handleMouseDown`'s hitTest event list to include `'mousedown'` and emit on the
  topmost hit; `_handleMouseUp` runs `hitTest(['mouseup'], …)` (cheap — hitTest
  early-outs with no listeners) and emits on the topmost. Payloads match the existing
  `mousemove` shape (logical coords).

**Coordinates**
- Fix the lying JSDoc: context event payloads (types.ts:84-131) claim "surface pixel
  space" but carry logical coords → "logical space: CSS pixels relative to the
  surface origin". Element event payloads (element.ts:114-162) claim "element-local"
  → logical. Document `hitTest` (context.ts:775) and `RenderElement.intersectsWith`
  (types.ts:66) as surface space.
- Replace manual `scaleX/scaleY` pairs (dom/context.ts:159-160, :234-235, :317) with
  `toSurfacePoint`. Extract one private helper for the repeated
  `clientX - state.left` logical-point computation used by all five handlers.
- Remove write-only `scaleDPR` (context.ts:123, :425) — breaking, note in the PR.
- Document `getAxisScale` (context.ts:77-84) as slope-only ("excludes origin offset;
  use the point helpers for conversion") — makes the terminal letterbox asymmetry a
  documented non-bug. No behavior change.
- `AGENTS.md`: new "Coordinate Spaces" section — logical vs surface definitions, the
  doctrine table (public events logical; hitTest surface; helpers mandatory, never
  manual conversion), where DPR/letterboxing live.

**Success criteria**: new dom tests prove context emits `mousedown`/`mouseup`/`click`
with logical coords; exactly one `mouseup` per in-surface release; a drag suppresses
element and context `click` but still emits `mouseup`; a release outside the surface
still emits `dragend` + `mouseup`. TypeDoc notDocumented clean (core, dom).
`yarn test`/`lint`/`typecheck`. Pre-merge grep for `context.on('click'` in charts
(none expected — the event never fired before).

**Subagents**: one implementation agent (cohesive change), one verification agent.

## PR2 — Constants placement

**Files**: `terminal/src/{context,rasterizer,constants}.ts`,
`core/src/core/{shape,query,scene,renderer}.ts`,
`core/src/gradient/{parser,serializer}.ts`, `core/src/interpolators/gradient.ts`,
`core/src/color/index.ts`, `canvas/src/utilities.ts` + new `canvas/src/constants.ts`,
`svg/src/definitions.ts`, `charts/src/core/{labels,theme}.ts`,
`dom/src/context.ts:28`, `AGENTS.md`.

**Scope**: pure moves to the AGENTS.md File Structure slot (after types, before
functions); extract to a package `constants.ts` where several accumulate (terminal
rasterizer's 8, canvas's 4). Exported constants keep their export path — removal is
PR8's job. `AGENTS.md` File Structure section gains one explicit rule line for future
agents: "UPPER_SNAKE_CASE constants sit after type declarations and before any
function/class; several in one file → dedicated `constants.ts`". The Appendix
violation list is the work inventory.

**Success criteria**: zero behavioral diff (`yarn test` unchanged), lint, typecheck;
a grep sweep confirms no `packages/*/src` file declares an UPPER_SNAKE_CASE const
below its first function/class. Watch for import cycles when extracting — stay
within-file unless the several-constants threshold is met.

**Subagents**: parallel by package — (A) core, (B) terminal, (C) canvas+svg+dom,
(D) charts + AGENTS.md — then verification.

## PR3 — Named CSS colors into core

**Files**: new `core/src/color/keywords.ts`, `core/src/color/{index,utilities}.ts` +
barrel, `terminal/src/{constants,color}.ts`, tests in `core/test/color`,
`core/test/interpolators`, terminal tests.

**Scope**: move `CSS_COLOR_KEYWORDS` (terminal/src/constants.ts:8, 0xRRGGBB packed —
keep the packing) to `core/src/color/keywords.ts`, exported with a single JSDoc on
the record. Wire into `parseColor` (color/index.ts:77-82) as the fallback parser:
lowercase lookup → unpack to RGBA (alpha 1); include `'transparent'` →
`rgba(0,0,0,0)` so `isTransparentColor` (color/utilities.ts:34-48) drops its
hand-cased string (keep the cheap early-out). This automatically fixes
`interpolateColor` hard-stepping named colors (interpolators/color.ts:19-25, :43) —
add a regression test. Terminal `color.ts` imports from `@ripl/core`; delete the
terminal table. Verify the packed-byte-order round-trip terminal-side.

**Success criteria**: `parseColor('red')` returns the RGBA;
`interpolateColor('red', 'blue')(0.5)` is a smooth midpoint; terminal color tests
pass; TypeDoc clean (core).

**Subagents**: single agent; parallel-safe with PRs 1/2/4.

## PR4 — Arc geometry: parallel gap + borderRadius

**Files**: `core/src/elements/arc.ts`, `core/src/math/geometry.ts`,
`core/test/elements/arc.test.ts`, `core/test/math/geometry.test.ts`.

**Parallel gap**: new optional `ArcState.padWidth?: number` — constant linear gap
width in logical px. Per-radius angular inset `θ(r) = asin(min(padWidth/(2r), 1))`:
the outer arc trimmed by `θ(R)`, the inner by `θ(innerRadius)` (open-arc case: outer
only) — adjacent segment edges come out parallel with a constant gap. When
`2θ(r) ≥ span` at a radius, collapse that arc to its mid-angle (degenerate sliver,
no inversion/NaN). `padAngle` keeps its exact current semantics; `padWidth` wins if
both are set (documented). Extract `getPadAngleAtRadius(padWidth, radius)` into
`math/geometry.ts` with unit tests — chart labels/centroids may want the same inset.

**borderRadius**: read the already-declared scalar `ArcState.borderRadius`
(arc.ts:39-40) in `render` (d3 `cornerRadius` model — scalar, not per-corner; a
4-tuple has no obvious corner order on an annular sector). Tangent corner circles:
centers at `R − rc` (outer) / `innerRadius + rc` (inner), angular tangency offset
`asin(rc / (R ∓ rc))`; path built from the existing `path.arc` plus corner arcs
(four corners annular; two for the wedge case, center left sharp). Clamp
`rc ≤ (R − innerRadius)/2` and ≤ half the pad-trimmed arc length. Order: pad trim
first, then rounding — matches d3 and keeps gaps constant.

Bounding box unchanged (rounding is strictly inside the current box). The
pre-existing open-arc bbox bulge bug (arc.ts:147-179) stays out of scope — note as
known in the PR description.

**Success criteria**: unit tests — `padWidth` endpoint insets equal `asin(g/2r)` at
three sample radii and the edge-to-edge gap is constant along the edge; sliver clamp
produces no NaN; `borderRadius` clamps correctly; the `padAngle`-only path is
byte-identical to today (path-command regression snapshot); property-style tests over
random sectors (full-`TAU` span, zero `innerRadius`, tiny radii) assert path
validity. JSDoc on the new prop + accessors; TypeDoc clean.

**Subagents**: one geometry agent — both features share the trimmed-sector
intermediate representation, do not split. Verification agent runs core tests plus a
canvas render smoke via `@ripl/test-utils`.

## PR5 — Radial chart visuals + hover fixes + scatter demo

**Files**:
`charts/src/charts/{pie,polar-area,sunburst,chord,arc-diagram,radial-bar}.ts`,
`apps/website/src/charts/scatter.md`, `packages/charts/test/visual/` snapshots.

**Scope**
- pie/polar-area: drop the stroke outline (pie.ts:268-285, polar-area.ts:495-511),
  fill-only with solid rest color (Decision 1); replace the angular pad with
  `padWidth` (default 2 logical px). Pie gains a public `padWidth` option (its
  internal `0.1/n` padAngle at pie.ts:207 goes away); polar-area's `padAngle` is
  deprecated per Decision 4. Sunburst (sunburst.ts:265-284) and chord arcs
  (chord.ts:352-369) follow per Decision 2.
- Hover fix: `pointerEvents: 'stroke'` on arc-diagram link polylines
  (arc-diagram.ts:459-477; precedent sankey.ts:499) and radial-bar value arcs
  (radial-bar.ts:333-347). Small arcs under a larger arc's chord-fill become
  hoverable; the tooltip appears.
- Scatter demo: scatter.md:109 `maxRadius: 25 → 15`; also the prose sample (:346)
  and slider bounds (:25-38). Leave the :463-464 sample (20) and the chart-side
  defaults (scatter.ts:234-235) alone.

**Success criteria**: interaction regression test — a synthetic hover at a point
inside a large link's chord-fill but on a small link's stroke resolves to the small
link. Gallery snapshots regenerated; pie/polar-area show parallel gaps; screenshots
attached to the PR for eyeball review. Charts tests/lint/typecheck/TypeDoc. The PR
description flags Decisions 1, 2, 4.

**Subagents**: (A) pie + polar-area + sunburst + chord; (B) arc-diagram + radial-bar
pointerEvents + scatter demo — parallel; (C) snapshot regeneration + verification
after A and B.

## PR6 — Hot-path perf (core/dom/svg)

**Files**: `core/src/core/{scene,renderer,element,group}.ts`,
`core/src/context/context.ts`, `core/src/scales/{band,discrete}.ts`,
`svg/src/context.ts`, `dom/src/{vdom,navigator}.ts`, `devtools/src/highlight.ts`,
`charts/src/components/navigator.ts`, `webgpu/src/context.ts`,
`EFFICIENCY_REPORT.md`.

**In scope**
- Scene `_buffer` (scene.ts:78, :199-201): derive from `_instructions` — single
  store (adapt the :168 length check and renderer debug reads :310/:396).
- Renderer duplicate transition store (renderer.ts:185 vs :499-501/:594-600): single
  source of truth, delete the hand-sync (:559-567, :603-611).
- `Context.hitTest` (context.ts:775-791): drop the redundant re-filter (:777), cheap
  dedupe (:779), persistent element→paint-index memo instead of the per-call Map
  (:789); fix the tracked-elements memo staleness (invalidate per frame, :762-764).
- `getBoundingBox` Box alloc on cache hit (element.ts:753-811) — return the cached
  instance.
- Delete `Group.render`'s dead per-call z-sort (group.ts:194-209 — unreachable from
  the Scene/Renderer render paths, a second parallel ordering implementation).
- SVG gradient per-frame `getBoundingBox` (svg/context.ts:218) — reuse the cached
  box.
- vdom cheap wins: hoist the three per-parent allocations in `reconcileChildren`
  (vdom.ts:130-163); cache `isExcluded` per node (:93-101).
- One shared origin-tracking/point-mapping helper in dom; adopt in
  `dom/navigator.ts:150-168` (also fixes its missing scaling),
  `devtools/highlight.ts:49-57`, `charts` navigator `:529-534` (drop the per-event
  `getBoundingClientRect`); `webgpu/context.ts:136-156` delegates to canvas
  `rescaleCanvas`.
- Core scales O(n²): `band.ts:57`, `discrete.ts:26` → keyed lookup.

**Explicitly deferred** (record in `EFFICIENCY_REPORT.md`): the SVG `_vtree`
per-frame rebuild redesign (architectural, needs a benchmark harness);
`Group.children` `Array.from` (already deliberately deferred there);
`Context.save()`'s 28-key spread + the full `CONTEXT_OPERATIONS` walk (dirty-key
tracking is a design project, not an audit fix); `evictDetachedNodes` complexity.

**Success criteria**: behavior-preserving — full `yarn test` green; visual gallery
zero-diff asserted; new regression tests for hitTest memo invalidation (an element
gains a listener mid-frame → hit next frame) and the navigator scaling fix;
`EFFICIENCY_REPORT.md` fixed/deferred ledger updated.

**Subagents**: (A) core scene/renderer/element/group/scales; (B) hitTest + memo
(after the PR1 rebase); (C) dom/svg/devtools/webgpu origin + vdom. A ∥ C, then B.

## PR7 — Charts DRY + utilities adoption

**Files**: `charts/src/core/` (new shared helpers), ~15 chart files, charts tests.

**Scope** (stacked on PR5)
- Shared helpers in `charts/src/core/`: a single `REST_ALPHA` policy (currently ~14
  local declarations spanning 0.25–0.9 — a chart that genuinely needs a different
  value gets a named local, not a re-declared `REST_ALPHA`); an `attachSegmentHover`
  helper folding the copy-pasted hover/tooltip/emit wiring (pie.ts:476-510,
  polar-area.ts:699-733, sunburst, chord, arc-diagram:194-252); a
  `transitionIfAny(renderer, elements, …)` helper for the
  `length ? transition : Promise.resolve()` idiom (×8 in arc-diagram.ts:654-712,
  plus the duplicated `transitionEntries/Updates/Exits` closures in pie/polar-area).
- `resolveAccessor` adoption: polar-area.ts:395-402, funnel.ts:156, treemap.ts:233
  (kills the any-casts).
- Utilities adoption: `numberExtent`/`numberMaxOf`/`numberSum` at
  statistics.ts:119-120/:80/:264, cartesian.ts:1321-1322/:1003, scatter.ts:216,
  force-directed.ts:436, sankey.ts:262/:410, bar.ts:189, area.ts:246 (removes the
  `Math.min/max(...spread)` blowup risk); realtime.ts:218 → `objectForEach`.
- O(n²) keyed-Map fixes (precedent: bar-series.ts:352 `keyIndex`):
  area-series.ts:424/428/456, bar-series.ts:152, polar-scatter.ts:539-579,
  radar.ts:589/596, radial-bar.ts:313/378, arc-diagram.ts:438, sankey.ts:309/723,
  force-directed.ts:226, charts `core/data.ts:59`, cartesian.ts:1287, stock.ts:204.
- Hardcoded neutral hex → `this.theme` (~10 sites; chart.ts:441-442 pattern).
- Do **not** unify pie/polar-area into a radial base class — that is a redesign, not
  a DRY pass; flag as follow-up.

**Success criteria**: full suite green; **visual gallery zero-pixel-diff** — the
review contract; any `REST_ALPHA` consolidation that would change pixels stays local
and is noted. Grep proves no remaining local `REST_ALPHA` declarations.
Lint/typecheck/TypeDoc (new shared helpers documented).

**Subagents**: (A) shared helpers + radial charts; then (B) cartesian/statistics/
scatter/realtime ∥ (C) graph charts (sankey, force-directed, arc-diagram, chord);
verification agent runs the zero-diff check.

## PR8 — Public API export pruning

**Scope** — re-verify every candidate with a fresh repo-wide grep at execution time;
PRs 1–7 may have changed consumers (especially `TRACKED_EVENTS` and canvas mixins):

- **dom**: un-export `ensureGroupPath`, `getAncestorGroupIds`, `createVNode`,
  `ParentRef` (vdom.ts; tests/README switch to deep imports or get updated). Keep
  `reconcileNode`/`VNode`/`ReconcilerOptions` — svg consumes them.
- **core**: `CONTEXT_OPERATIONS`, `TRANSFORM_INTERPOLATORS`, `TRANSFORM_DEFAULTS`,
  `TRACKED_EVENTS`, `applyElementTransform`, `TransformTarget`; collapse the
  context.ts:66-69 double export path.
- **canvas**: the ~12 internal-only helpers (utilities.ts, mixins.ts:42). Keep
  `canvasMeasureText`, `rescaleCanvas`, `canvas2DStateMixin` — webgpu/3d consume.
- **terminal**: all of `algorithms.ts` and `TerminalPath`. **Keep `BrailleRasterizer`
  and the `Rasterizer` interface exported** — `docs/core/contexts/terminal.md:62,76`
  constructs it in a runnable xterm.js snippet and :118 documents it as the
  swap-in extension point, so it is public surface by documentation.
- **svg**: the `SVGPath`/`SVGText`/`SVGTextPath`/`SVGImage` classes.
- **webgpu**: shader/pipeline constants, `GeometryManager`, `triangulatefaces`.
- **charts**: `labels.ts` internals, `computeStackOffset`/`positiveNegativeExtent`/
  `cumulativeExtent`, the scales helpers, `resolveColorBy`, `resolveChartPadding`,
  `exitElement`. Keep the documented custom-chart surface: `applyHoverHighlight`,
  `resolveAccessor`, `stagger`, `ANIMATION_REFERENCE`, `areaCenter`, `ChartLayout`.

**Success criteria**: `yarn typecheck` + `yarn build` + `yarn typecheck:dist` green;
`apps/website` builds; TypeDoc clean per package with no dangling `{@link}`; the PR
description lists every removed export as breaking.

**Subagents**: one per package (fully parallel), then an integration/verification
agent.

---

## Documentation stream

No PR may leave a documented claim false. The stream has two layers: **per-PR doc
gates**, where each PR updates the surfaces its own changes invalidate (added to that
PR's scope and success criteria), and a **closing PR9 sweep** for cross-cutting
surfaces and the migration doc.

Two standing policies:

- `docs/audits/*` are frozen historical records — never edit them, even where a
  finding they report has since been fixed. `docs/migrations/*` and every consumer-
  facing doc are live.
- Root `README.md` is byte-mirrored by `apps/website/src/docs/api/index.md` (only
  image and package-link paths differ). Every root-README edit must be mirrored.

### Per-PR doc gates

**PR1 — events + coordinates.** Six website pages enumerate the tracked pointer
events and will omit the new ones: `docs/core/essentials/context.md:116`,
`docs/core/advanced/events.md:127`, `docs/core/essentials/element.md:141`,
`docs/core/essentials/scene.md:141` (its list also omits `click`, which now fires on
the context), `docs/core/getting-started/tutorial.md:185`, and
`docs/core/troubleshooting/faq.md:104` — the last also claims pointer events only
work inside a `Scene`, which `context.md` already contradicts; fix both. The
coordinate doctrine needs a consumer-facing home too: the drag-payload prose in
`advanced/events.md:152-176` names no space, and `advanced/custom-contexts.md` is the
contract page for context authors — document `toLogicalPoint`/`toSurfacePoint` there.
Keep the wording consistent with `docs/core/contexts/terminal.md:93-111`, which
already uses "logical" for its letterbox mapping. `scaleDPR` appears on no website
page, so its removal needs no edit there.

**PR3 — named colors.** `packages/core/README.md:19` lists color features without
keywords. On the website, `docs/core/advanced/color.md` needs a named-color row in
the Supported Color Spaces table (:138-148) and a `parseColor('red')` example
(:150-161); its opening claim that any CSS color string is parsed (:7) becomes true
for the first time. `docs/core/advanced/interpolators.md:46,195` should note that
named colors now tween rather than hard-step.

**PR4 — arc geometry.** `docs/core/elements/arc.md` prose (:7, :134) needs `padWidth`,
and its existing `borderRadius` slider (:21-23, :43-44) starts actually working —
verify the demo and add a `padWidth` control. `packages/charts/OPTIONS.md` needs a
`padWidth` vocabulary entry per its own rule at :65-69 ("if nothing fits, add the new
concept here in the same pass"); note there (:84) and in
`apps/website/src/charts/shared-options.md:256` that Arc's `borderRadius` is scalar,
unlike the Rect-family `number | [tl,tr,br,bl]` shape. `.claude/skills/ripl-charts/SKILL.md`
carries the only two "borderRadius does nothing" claims in the repo (:159, :266) plus
the stroked-arc rounded-bar workaround it recommends instead (:157-159) — all three
go stale the moment this PR merges, so they change here, not later; the `createArc`
signature line (:153) gains `padWidth`.

**PR5 — radial visuals. This PR has a hard build gate.** `apps/website`'s `build`
runs `check-chart-options` and `check-config-coverage` before TypeDoc, and they
require every chart option to have both a `<RiplField option="…">` control and a
mention on its page. So `pie.md` must gain a `padWidth` control and Options entry in
this PR (config panel :8-150, options sample :237-256) or the website build fails.
`polar-area.md`'s "Segment gap" control (:26-27) switches to `padWidth` with
`padAngle` documented as deprecated (:72, :110, :256-257) — neither script
understands `@deprecated`, so add a minimal exemption to `check-config-coverage.mjs`
and note the script change in the PR. `chord.md` (:3, :18-19, :63, :94, :168-169) and
`sunburst.md` (:185-199) get the same treatment; `arc-diagram.md` and `radial-bar.md`
gain a one-line note that small links and arcs are now hoverable.
`packages/charts/test/visual/README.md:3-5` needs a baseline-regeneration note. Check
`apps/website/src/demos/product-analytics/components/browser-share-chart.vue:53`
(a `createPieChart` with `innerRadius: 0.55`) — it inherits the new defaults, so
eyeball it in the build. In the skill file, the highlight guidance (:135-139, fill vs
stroke) and the exemplar pointer (:22) reflect the old rest-fill model.

**PR6 — perf.** `docs/core/essentials/scene.md` (:9, :95, :99) and
`docs/core/troubleshooting/performance.md` (:11-24, :93, :99) describe the render
buffer as a maintained sorted array; update only if the observable story changes when
the buffer becomes derived, and keep the O(n) claim accurate.
`EFFICIENCY_REPORT.md`'s Summary and Remaining lists (:58-63) go stale on merge.

**PR8 — export pruning.** `packages/dom/README.md:15-31` has headed API sections for
three of the pruned symbols (`ensureGroupPath`, `getAncestorGroupIds`, `createVNode`)
— remove them, keep `reconcileNode`. `docs/core/contexts/terminal.md` has a runnable
xterm.js snippet importing `BrailleRasterizer` (:62, :76) and prose about swapping the
rasterizer via the `Rasterizer` interface (:118): this is a documented extension
point, so **keep `BrailleRasterizer` and `Rasterizer` exported** and prune the rest of
the terminal internals — amend the PR8 scope accordingly.
`apps/website/src/charts/advanced/custom-charts.md:7` claims "all of it is exported
from `@ripl/charts`" and needs a boundary statement naming the supported custom-chart
surface. `packages/charts/ROADMAP.md:129` references `exitElement`. The same
`CONTEXT_OPERATIONS`/`TRACKED_EVENTS` import example appears three times —
`AGENTS.md:269-270`, `CONTRIBUTING.md:99-103`,
`.github/copilot-instructions.md:46-47` — swap all three to still-public names in one
pass. In the skill file, the infra map (:29-30) and the `exitElement` sample (:99)
change. TypeDoc regenerates the API pages and sidebar automatically
(`entryPointStrategy: "packages"`, `autoConfiguration: true`), so pruned symbols
vanish on their own — just confirm no dangling `{@link}` remains.

### PR9 — Documentation sweep + migration doc

**Files**: new `docs/migrations/frontend-graphics-audit.md`, root `README.md`,
`apps/website/src/docs/api/index.md`, `.claude/skills/ripl-charts/SKILL.md`,
`docs/plans/frontend-graphics-audit.md`.

**Scope**
- Author the migration doc following `docs/migrations/context-audit.md` exactly — its
  preamble distinguishes **behaviour** entries (output moves, code still compiles)
  from **API** entries (surface as compile errors), then groups by
  `## @ripl/<package>` → `### <concern>`, each entry naming the symbol, the kind, what
  changed, why the old behavior was wrong, and what the consumer must do. Source
  material is the migration-notes section each breaking PR carries in its description.
  Cover: the new `mousedown`/`mouseup`/`click` emissions, payload coordinate spaces,
  the `_endDrag` rename and `scaleDPR` removal (PR1); named colors in `parseColor` and
  the resulting interpolation change (PR3); the pie/polar-area/sunburst/chord visual
  and option changes plus the `pointerEvents: 'stroke'` hit-test change (PR5); and
  every removed export (PR8). Extend and cross-reference that doc's existing
  "Pointer payloads" and "Pointer lifecycle" sections (:345-380) rather than
  contradicting them — they already document the payload space and the `mouseup`
  window binding.
- Root `README.md`: the features list needs touch-ups for events (:32) and color
  (:49); mirror every edit into `apps/website/src/docs/api/index.md`.
- Skill file: final consistency pass — the per-PR gates above should have covered it,
  so verify rather than duplicate.
- Mark this plan completed with a status header pointing at the migration doc.
- Final stale-claim sweep: grep all `**/*.md` except `docs/audits/` for `_endDrag`,
  `scaleDPR`, every pruned symbol, `padAngle` (only deprecated references should
  remain), and "borderRadius … not implemented"; fix what it finds.

**Success criteria**: `yarn workspace @ripl/website build` green through all its
gates (`check-chart-options`, `check-config-coverage`, TypeDoc generation with no
dangling links); the stale-claim grep returns zero hits outside `docs/audits/`; the
migration doc covers every breaking change listed in the PR 1/3/5/8 descriptions; the
README ↔ `api/index.md` mirror verified equivalent modulo path rewrites.

**Subagents**: (A) migration doc, (B) README + website sweep — parallel; then
(C) verification (grep sweep + website build).

### Notes for the orchestrator

- `@example` blocks in `packages/*/src` were audited and are all safe — none
  reference `padAngle`, `padWidth`, `maxRadius`, `borderRadius`, or context events.
  JSDoc property docs on changed members are already mandated per-PR.
- `AGENTS.md:328` and `CLAUDE.md:26-27` name `arc.ts` and `scene.ts` as JSDoc
  exemplars. PR4 and PR6 change both files and must leave them exemplar-quality —
  check this in their reviews.

---

## Verification protocol (all PRs)

- Attempt `yarn install` first; if the sandbox cannot, fall back to the
  standalone-tsc verification documented in the `ripl-charts` skill ("Verifying in
  this sandbox"): a `tc.json` mapping `@ripl/*` → source with `types: []` +
  `skipLibCheck`, and pure-logic modules compiled and exercised with `node`.
- Every PR: `yarn test`, `yarn lint`, `yarn typecheck`, plus the AGENTS.md TypeDoc
  `notDocumented` command per touched package (ignore `SetSignature`).
- PR5: gallery snapshots regenerated and attached. PR6/PR7: gallery zero-diff
  asserted.
- Every new or changed public member gets JSDoc (hard gate). No multi-line `//`
  comments. No runtime dependencies. Report verification honestly per the
  `ripl-pull-requests` skill.
- Every PR satisfies its doc gate (see Documentation stream) before merge, and PRs
  touching website pages run `yarn workspace @ripl/website build` — its
  `check-chart-options` / `check-config-coverage` gates fail on an undocumented
  chart option.

---

## Appendix — verified findings (evidence base)

Line numbers were verified against `main` at plan time; re-verify before editing.

### Events (`dom/src/context.ts`)

`_endDrag` :271-301 (element mouseup :352 + window mouseup :365 → double fire; the
second exits on `!state?.dragElement`). The mousedown handler :153-170 forwards
nothing; click :303-325 emits element-only via `hitElements[0]`; the context `click`
is declared (types.ts:90; `$events` context.ts:131) but never emitted. No
`mousedown`/`mouseup` in either event map. `TRACKED_EVENTS`
core/constants.ts:98-106. Mouse-only (no pointer/touch events).

### Coordinates

The helpers are used at only three sites (element.ts:817, shape.ts:139, :141).
Manual conversions: dom/context.ts:157-160, :176-177, :234-235, :281-282, :317.
JSDoc mismatches: types.ts:84-131 ("surface") and element.ts:114-162
("element-local") vs actual logical payloads. `scaleDPR` write-only
(context.ts:123, :425). `getAxisScale` slope-only (context.ts:77-84) vs terminal
offset scales (terminal/context.ts:425-426). Duplicated origin logic:
dom/navigator.ts:150-168 (no scaling — a bug), charts navigator :529-534 (per-event
rect), devtools/highlight.ts:49-57, webgpu/context.ts:136-156.

### Hit testing / arc-diagram hover

`Shape2D.intersectsWith` shape.ts:123-162; `POINTER_EVENT_HIT_TESTS` shape.ts:50-54
(`none`/`stroke`/`fill`; `'all'` falls through to stroke-or-fill). Native
`isPointInPath` implicitly closes open paths against the chord. `hitTest` sorts
paint-order topmost-first (context.ts:789-791); dom keeps only `hitElements[0]`
(dom/context.ts:238). Arc-diagram links are open sampled polylines
(arc-diagram.ts:356-373; created :459-477 with default `pointerEvents`) — the
chord-closed fill of a big arc eats hover for small arcs beneath; `autoFill = false`
suppresses paint only. Precedent: sankey.ts:499. Also affected:
radial-bar.ts:333-347.

### Arc element (`core/src/elements/arc.ts`)

`borderRadius` declared :39-40, accessors :109-116, never read in render :182-217 —
no `arcTo`/quadratic/bezier in the file. `padAngle` implemented :197-202 (pure
angular → wedge-shaped gaps). Open-arc path :204-206; annular :208-215.
`normalizeBorderRadius` geometry.ts:162-170 (Rect-only). Open-arc bbox bulge bug
:147-179 (pre-existing, out of scope).

### Radial charts

pie.ts fill+stroke :268-285 (`lineWidth: 2`, `REST_ALPHA 0.55` :86); internal
padAngle `0.1/n` :207 (not public); hover :476-510. polar-area.ts fill+stroke
:495-511; public `padAngle` default 0.02 :107-108, :385; hover :699-733.
sunburst.ts:265-284 (padAngle 0.02 hardcoded); chord.ts:352-369. gauge is already
fill-only; radial-bar is stroke-only.

### Scatter demo

scatter.md:109 (`maxRadius: 25`), :346 (prose sample), :25-38 (slider bounds),
:463-464 (a different sample at 20 — leave). Chart defaults scatter.ts:234-235
(3/20 — leave).

### Performance

`Scene._buffer` scene.ts:78, :199-201 (consumers: :168 plus renderer debug
:310/:396). Renderer duplicate store renderer.ts:185, :499-501, :594-600 (hand-sync
:559-567, :603-611). `Context.save()` spread context.ts:449-453;
`CONTEXT_OPERATIONS` walk element.ts:871-877, context.ts:598-604.
`_transitionMap.get` per instruction renderer.ts:366. Box alloc on cache hit
element.ts:753-811. Group boxes uncached group.ts:66-68; svg gradient bbox
svg/context.ts:218. `hitTest` allocations context.ts:775-792. `Group.render` dead
sort group.ts:194-209. SVG vtree rebuild svg/context.ts:413-423 (deferred). vdom
allocations vdom.ts:130-163, `isExcluded` :93-101/:136/:192, `evictDetachedNodes`
:85-91 (deferred). Memo staleness context.ts:762-764, :789-791. O(n²)
`indexOf`/`find`-in-loop: area-series.ts:424/428/456; bar-series.ts:152;
polar-scatter.ts:539-579; radar.ts:589/596; radial-bar.ts:313/378;
arc-diagram.ts:438; sankey.ts:309/723; force-directed.ts:226; charts
`core/data.ts:59`; cartesian.ts:1287; stock.ts:204; core scales band.ts:57,
discrete.ts:26. `EFFICIENCY_REPORT.md` logs prior fixes and deliberate deferrals.

### Named colors

terminal/src/constants.ts:8 `CSS_COLOR_KEYWORDS` (0xRRGGBB; a 157-line file; not in
the terminal barrel; sole consumer terminal/color.ts:14, :60). Core `parseColor` has
no keyword branch (color/index.ts:77-82); `interpolateColor` hard-steps
(interpolators/color.ts:19-25, :43); `isTransparentColor` hand-cases the string
(color/utilities.ts:34-48).

### Constants-placement violations

terminal/context.ts:110/:119/:177; core shape.ts:50/:57; query.ts:48-67; gradient
parser.ts:240, serializer.ts:85; interpolators/gradient.ts:77; canvas
utilities.ts:99-100/:320 (no `constants.ts` exists); svg definitions.ts:105/:110;
charts labels.ts:116-120, theme.ts:104; core color/index.ts:38; terminal
rasterizer.ts:41-68 (8 constants — extraction threshold). Minor: scene.ts:59,
renderer.ts:149, dom/context.ts:28. Rule: AGENTS.md File Structure section.

### DRY

`resolveAccessor` bypassed: polar-area.ts:395-402, funnel.ts:156, treemap.ts:233.
`REST_ALPHA` re-declared in ~14 files. Segment-hover wiring copy-pasted ×5.
Transition boilerplate ×8+. Utilities under-use as listed in PR7. Hardcoded neutral
hex at ~10 sites while `this.theme` exists.
