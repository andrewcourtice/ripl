# Gradient/paint pipeline, pointer alignment, and SVG commit model

## Context

Two user-reported defects and nine agent-reported findings were investigated against source.
**All eleven are legitimate.** Three additional defects were found during verification and are
folded in. The through-line: the paint pipeline re-derives everything it already knows on every
element, every frame — parsing gradient strings, rebuilding `<stop>` nodes, allocating
`CanvasGradient` objects — while the two caches that do exist evict by wiping. Separately, the
pointer-to-surface origin is captured exactly once (on `mouseenter`) and never refreshed, and the
SVG `buffer` flag has been dead code in every real pipeline since `Scene` was written.

Outcome: paint resolution becomes O(changes) instead of O(elements × frames); pointer coordinates
stay correct without a leave/re-enter cycle; the SVG commit path loses a vestigial branch; and every
context gets a dedicated correctness audit.

---

## Verification findings

Verdicts are from reading the code, not from re-stating the report.

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| U1 | Pointer events misaligned on entry | **Confirmed** | `packages/dom/src/context.ts:100-109` — `state.left/top` written *only* in `_handleMouseEnter`; seeded to `0,0` at `:271-281`; consumed at `:117-118, 133-135, 226-227, 250-251`. Never refreshed by `rescale`, scroll, or layout shift. |
| U2 | Is `buffer` still needed for SVG? | **No — dead in every scene pipeline** | `packages/core/src/core/scene.ts:138` sets `context.buffer = false` unconditionally, overriding `packages/svg/src/context.ts:128`. Live only for raw `SVGContext` (31 docs pages, `export()`, SVG unit tests). |
| 1 | SVG re-parses every gradient per resolve | **Confirmed** | `packages/svg/src/context.ts:207` calls raw `parseGradient`; memo is private to `packages/canvas/src/utilities.ts:88`. |
| 1b | *(new)* SVG re-parses every **pattern** per resolve | **Confirmed** | `packages/svg/src/context.ts:171` — same defect, same fix shape. Missing from the report. |
| 2 | SVG rebuilds every `<stop>` per update | **Confirmed** | `definitions.ts:66` `replaceChildren()`, called unconditionally from `updateSVGGradientElement` (`:165`) on every cache hit. |
| 3 | `toCanvasGradient` allocates + re-parses per set | **Confirmed** | `packages/canvas/src/utilities.ts:68-81`; reached from the `fill`/`stroke` setters at `mixins.ts:159-169, 303-313`, which run per element per frame. |
| 4 | Both caches evict by wiping | **Confirmed** | `utilities.ts:94` and `:123`. `functionMemoize` (`packages/utilities/src/function.ts`) is unbounded, so not usable as-is. |
| 5 | Group gradient resolves against wrong box | **Confirmed** | `currentRenderElement` is assigned only in `element.ts:859`. `Group.render` (`group.ts:194-207`), `Scene`'s `RENDER_OPERATIONS.push` (`scene.ts:60`) and `Renderer._renderBuffer` (`renderer.ts:368`) all call `context.pushGroup` directly → `applyGroupPaint` (`context.ts:545`) fires the canvas `fill` setter while `currentRenderElement` is the previous leaf. **Canvas-only in effect** (SVG's `fill` setter is a plain state assignment). |
| 6 | Demos rebuild every element per redraw | **Confirmed, wider than reported** | 31 pages use raw `useRiplExample`; `clip-paths.md` alone builds 23 elements per `renderDemo`. Ids come from `stringUniqueId()` per construction, so every id-keyed cache misses and the SVG reconciler removes+recreates the whole tree each redraw. |
| 7 | `_domCache` retains descendants of removed groups | **Confirmed** | `packages/dom/src/vdom.ts:113-118` deletes the direct child's entry only; never recurses the removed subtree. |
| 8 | Hit testing inert during a buffered drag | **Confirmed, narrow** | `_isPointIn` (`svg/src/context.ts:343-354`) resolves `getElementById(path.id)` against a DOM that lags a frame. Only reachable in raw-context mode (see U2) — and compounded by #6's regenerated ids. |
| 9 | Renderer repaints everything on one change | **Confirmed, out of scope** | `Scene._needsRender` is a scene-global boolean (`scene.ts:77`). Kept out of scope. |
| 9b | *(new)* Paint-only change forces geometry re-trace | **Confirmed, in scope** | `setStateValue` (`element.ts:590`) sets `_dirty` for *any* key; `Shape2D.render` (`shape.ts:143-147`) requires `!this.$dirty` to reuse a path. A `fill` change discards the traced path. Separable from the render-loop work. |
| 10 | *(new)* Canvas `fill`/`stroke` getters go stale after `restore()` | **Confirmed** | `mixins.ts:155-169, 299-313` — `_fillCSS`/`_strokeCSS` are plain fields; `restore()` (`:341-348`) restores the native `fillStyle` but leaves them pointing at the inner scope's value. Getter lies after any restore. Routed to the context audit. |

**Cross-backend parity note (record, do not fix here):** canvas resolves a group's gradient once
at the group boundary against one box; SVG emits a `url(#…)` per leaf resolved against each leaf's
own box. Same scene, different picture. Handed to Task F.

---

## Decisions taken

1. **`Context.buffer` is removed entirely.** Breaking change; the repo has precedent
   (`feat(charts)!:` in history), so the commit is marked `!`.
2. **Group paint:** land the box fix + tests pinning both backends; document the parity gap.
3. **Demos:** build once on context change, mutate state on redraw.
4. **Dirty gate:** include the path-cache half (geometry vs paint keys); leave the scene-global
   repaint gate alone.

---

## Branch plan

Six branches. Ordering constraint: **A must merge before B**. C, D, E, F are independent.
The two branches carrying real repaint risk are **B** and **D** — each is a single focused review
with the visual-regression suite as its gate.

```
A ──► B
C  (independent)
D  (independent — rebase after B; both touch svg/src/context.ts)
E  (independent, website only)
F  (independent, investigation)
```

---

### Branch A — `claude/paint-cache-foundation`
**Risk: low.** Additive, pure, no behaviour change. Unblocks B.

**Goal:** one bounded LRU primitive, one shared parse memo, both backends on it.

| File | Change |
|---|---|
| `packages/utilities/src/cache.ts` *(new)* | `createLRUCache<TKey, TValue>(limit)` → `{ get, set, has, delete, clear, size }`. `Map` insertion-order LRU: hit ⇒ `delete`+`set` to move to the end; at limit ⇒ evict `cache.keys().next().value`. ~35 lines, zero deps. |
| `packages/utilities/src/index.ts` | Barrel export. |
| `packages/core/src/gradient/parser.ts` | Add `parseGradientCached(value)` on a 256-entry LRU. |
| `packages/core/src/pattern/parser.ts` | Add `parsePatternCached(value)`, same shape. |
| `packages/canvas/src/utilities.ts` | Delete the private `parseGradientMemoized` + `gradientCache` (`:83-101`); call `parseGradientCached`. |
| `packages/svg/src/context.ts` | `_resolveGradientStyle:207` → `parseGradientCached`; `_resolvePatternStyle:171` → `parsePatternCached`. |

**Notes for the implementer**
- Do **not** touch `functionMemoize` — `Context._getTrackedElements` depends on its exposed
  `.cache.delete(event)`.
- The memo returns a **shared** `Gradient`/`Pattern`. Every current consumer is read-only; the JSDoc
  must say so explicitly. Grep for mutation of a parsed result before merging.
- Naming: `createLRUCache` matches the `createX` factory convention in `AGENTS.md`. Confirm against
  lint; the domain-prefix alternative is `cacheLRU`.

**Success criteria**
- `packages/utilities/test/cache.test.ts`: eviction is least-recently-*used*, not insertion order —
  a `get` on the oldest key survives the next eviction. Exactly one entry evicted at the limit
  (proving no wipe). `clear`/`delete`/`size` behave.
- `packages/core/test/gradient/parser.test.ts`: `parseGradientCached` returns a reference-identical
  object for the same string; a 257th distinct string evicts exactly one entry.
- Canvas + SVG paint output byte-identical to `main` (existing suites unchanged).
- `yarn test`, `yarn lint`, `yarn typecheck` pass; TypeDoc `notDocumented` clean for `utilities`
  and `core`.

---

### Branch B — `claude/paint-materialization` *(higher-risk bundle)*
**Risk: high — every change alters what reaches the screen.** Depends on A.

Three changes bundled deliberately: all three are "the paint is now reused instead of rebuilt",
all three are gated by the same visual-regression run, and reviewing them together is cheaper than
reviewing them apart.

#### B1 — Canvas: cache the materialized `CanvasGradient` (report #3, #4)
`packages/canvas/src/utilities.ts`

- `const canvasGradientCaches = new WeakMap<CanvasRenderingContext2D, LRUCache<string, CanvasGradient>>()`.
  **Per-context, not module-global** — `CanvasGradient` objects are tied to a surface, and a WeakMap
  gets the lifecycle right when a context is destroyed.
- Key: `${value}|${x.toFixed(2)}|${y.toFixed(2)}|${width.toFixed(2)}|${height.toFixed(2)}`.
  Rounding to 0.01px stops sub-pixel jitter on an animating element from thrashing the cache; the
  SVG side already rounds to `toFixed(4)`. **Bounds must be in the key** — unlike patterns,
  gradients are position-dependent, and `CanvasContext3D.gradientBounds()`
  (`packages/3d/src/core/context.ts:248`) resolves a *world* box where 2D canvas resolves a local
  one, so the same string legitimately yields different gradients per context.
- Convert `patternCache` (`:104-105`) off `.clear()` onto the LRU. Split the two layers:
  the **tile `<canvas>`** is position- and context-independent → keep one module-level LRU keyed by
  pattern string; the **`CanvasPattern`** is context-bound → per-context WeakMap. This preserves the
  cross-chart tile sharing that the current module-global cache accidentally provides, without
  sharing context-bound objects across surfaces.
- Cache limit: 64 per context (was 256 global). Justify in the PR body.

#### B2 — SVG: skip `<stop>` rebuilds on unchanged gradients (report #2 — largest single saving)
`packages/svg/src/definitions.ts`, `packages/svg/src/context.ts`

- Export `getGradientStopSignature(stops)` → `stops.map(s => \`${s.offset ?? 0}:${normalizeGradientColor(s.color)}\`).join(',')`.
- Export `applyGradientStops` (currently module-private at `:65`).
- `updateSVGGradientElement` (`:161`) **stops applying stops** — it writes coordinate attributes
  only. `createSVGGradientElement` (`:129`) must then call `applyGradientStops` explicitly. Both are
  public API: JSDoc must be rewritten, not just kept.
- Move `gradientUnits` (`:162`) into `createSVGGradientElement` — it never changes after creation.
- `GradientCacheEntry` gains `stopSignature: string` **and** `boundsSignature: string`. Guard both
  writes; an identical `setAttribute` still produces a mutation record and can force re-rasterization
  of a live `<defs>` paint server. Mirror the snapshot pattern already used by `APPLIED_DEFINITION`
  in `packages/svg/src/diff.ts`.
- `_resolveGradientStyle` compares signatures and skips.

#### B3 — Group gradients resolve against the group's own box (report #5)
`packages/core/src/context/context.ts`

- In `pushGroup` (`:526`), assign `this.currentRenderElement = group` **before**
  `applyElementTransform` and `applyGroupPaint`. Safe: the setter only records non-abstract
  elements (`:137-143`) and `Group.abstract` is `true` (`group.ts:81`).
- One line in the base class covers all four entry points — `Group.render`, `Scene`'s
  `RENDER_OPERATIONS.push`, `Renderer._renderBuffer`, and SVG's override (which calls `super`).
- **Hygiene:** stash/restore the previous `currentRenderElement` across `pushGroup`/`popGroup`
  alongside `_groupDepthStack`, so a group does not leak into a later sibling's paint resolution.
- **Known limitation to pin in a test, not silently accept:** `Group.getBoundingBox(true)`
  (`group.ts:178-180`) unions children's *local* boxes, so a child's own transform is excluded.
  Write the test with untransformed children first, then add a transformed-child case and record
  the observed behaviour as the documented contract. Do not widen scope to fix it here.

**Success criteria (branch B)**
- `packages/canvas/test/gradient-cache.test.ts`: N elements sharing one static gradient over M frames
  ⇒ `createLinearGradient` called **once** (spy via `mockCanvasContext`), `parseColor` not called per
  frame. An element whose bounds animate produces a *new* gradient per distinct rounded bounds.
  Two contexts with the same string+bounds get **distinct** `CanvasGradient` objects.
- `packages/canvas/test/pattern.test.ts` (extend): >64 distinct paint strings still hit for the
  most-recently-used; exactly one entry evicted per insertion at the limit.
- `packages/svg/test/defs-lifecycle.test.ts` (extend): re-rendering an unchanged gradient leaves the
  `<stop>` **nodes reference-identical** across passes (capture `Array.from(el.children)` and compare
  by identity — the strongest available proxy for "no re-rasterization"). Changing one stop colour
  rebuilds them. Changing only the bounds rewrites coordinates and leaves stops untouched.
- `packages/core/test/context/group-paint.test.ts` *(new)*: a group with a `linear-gradient` fill and
  two children resolves `createLinearGradient` against the **group's** box, not the previously
  rendered leaf's. Add a second assertion for a group rendered *after* an unrelated leaf — that is
  the exact failing case today.
- `yarn workspace @ripl/charts test:visual` green against committed baselines
  (`CHROMIUM_PATH=/opt/pw-browsers/chromium-*/chrome-linux/chrome`). **Baselines must not be
  regenerated** — a diff here means a real repaint change and must be explained, not blessed.
- Manual: `apps/website` gradient, pattern-fills, and clip-paths demos, canvas **and** SVG, sliders
  dragged end to end.

---

### Branch C — `claude/pointer-origin` (user bug U1)
**Risk: low-medium. Highest user-visible value.**

`packages/dom/src/context.ts`

Root cause is a single stale snapshot with two distinct failure modes, both fixed by the same change:
- **Never taken:** a surface mounted or re-created under a stationary pointer never fires
  `mouseenter`, so the origin stays `0,0` and every coordinate is offset by the element's viewport
  position. `useRiplExample`'s destroy-and-recreate on a canvas/SVG toggle hits this directly.
- **Gone stale:** the page scrolls or the layout shifts while the pointer is inside. Leaving and
  re-entering re-runs `_handleMouseEnter` — exactly the reported workaround.

**Approach**
- Seed `left`/`top` eagerly in `enableInteraction()`. `init()` (`:81-94`) already calls
  `getBoundingClientRect()` for width/height — reuse that read; it is free.
- Add `_originDirty` + a private `_refreshOrigin()` that re-reads only when dirty, called at the top
  of `_handleMouseDown`, `_handleMouseMove`, `_handleMouseUp`, `_handleClick`; forced in
  `_handleMouseEnter`.
- Set `_originDirty` from: the existing `onDOMElementResize` handler in `init()`; a
  **capture-phase, passive** `scroll` listener on `window` (`addEventListener('scroll', h, true)` —
  scroll does not bubble but does capture, so this catches any ancestor scroll container); and a
  `window` `resize` listener. Retain both under `INTERACTION_KEY` so `disableInteraction()` tears
  them down.

This is one `getBoundingClientRect()` **per invalidation**, not per event — strictly cheaper than
the naive per-mousemove read, and correct in both failure modes.

**Success criteria**
- `packages/dom/test/context.test.ts` *(new — the package has no context test today)*: instantiate a
  concrete `DOMContext` via `@ripl/canvas`; stub `getBoundingClientRect` (jsdom returns zeros).
  - `mousemove` dispatched **without** any prior `mouseenter` hit-tests at the correct coordinates.
  - Rect changes + `window` `scroll` fires ⇒ next `mousemove` uses the new origin.
  - Rect changes + ResizeObserver-driven `rescale` ⇒ origin refreshes.
  - **Perf guard:** ten consecutive `mousemove`s with no invalidation call
    `getBoundingClientRect` at most once.
  - `disableInteraction()` removes the scroll/resize listeners.
- Manual: scroll the docs page while hovering a demo; toggle canvas/SVG with the cursor resting over
  the surface. Pointer stays aligned in both, with no leave/re-enter.

---

### Branch D — `claude/svg-commit-model` *(higher-risk bundle)*
**Risk: high — changes when the SVG DOM commits.** Marked `!` (breaking).
Rebase after B; both touch `packages/svg/src/context.ts` in different regions.

Three changes, one subsystem, one set of lifecycle tests. The commit path is delicate — see
`da90765 fix(svg): sweep defs after the reconcile, not before it` — which is precisely why these
belong in one careful review rather than three casual ones.

#### D1 — Remove `Context.buffer` (user question U2)
| File | Change |
|---|---|
| `packages/core/src/context/context.ts:94` | Delete the `buffer` field and its JSDoc. |
| `packages/core/src/core/scene.ts:138` | Delete `context.buffer = false` — a Scene should never reach into a context's public config. |
| `packages/svg/src/context.ts` | Delete `this.buffer = true` (`:128`), `_requestFrame` (`:102`, `:165`), and the branch in `markRenderEnd` (`:407-411`) → always `this._commit()`. |
| `packages/svg/src/context.ts:415-419` | Drop `export()`'s forced `_commit()` and its comment; synchronous commit already guarantees freshness. Keep a test pinning that `export()` reflects the latest scene. |
| `packages/svg/test/{gradient-units,polyline-segments,attr-removal}.test.ts` | Remove the "buffered to rAF; export forces a synchronous reconcile" workarounds. |
| `apps/website/src/docs/core/advanced/custom-contexts.md:44` | Drop `buffer: false` from the custom-context example. |

`createFrameBuffer` stays — still used by `DOMContext`, `Scene`, and `charts/core/cartesian`.

#### D2 — Robust SVG hit-test node resolution (report #8)
`_isPointIn` (`:343`) prefers `this._domCache.get(path.id)` over
`this.element.getElementById(path.id)`, requiring `node.isConnected` before trusting its geometry,
falling back to `getElementById`. Removes a document-scoped id lookup from the hover hot path and
survives id collisions between two contexts on one page.

#### D3 — Evict removed subtrees from `_domCache` (report #7)
`packages/dom/src/vdom.ts:113-118` — when a child is removed, recurse its subtree and delete each
descendant's entry. **Guard the delete on `domCache.get(id) === descendantNode`** so a node that has
already been re-registered under a surviving parent is not clobbered — the `domCache.get` fallback at
`:123` is the reparenting mechanism and must keep working.

**Success criteria (branch D)**
- Whole SVG suite passes with the `export()` workarounds deleted — the strongest available proof
  that synchronous commit is correct.
- `packages/svg/test/defs-timing.test.ts` (extend): defs are still swept *after* the reconcile;
  a def removed in the same pass never leaves a dangling `url(#…)` on a live node.
- `packages/dom/test/reconcile.test.ts` (extend): removing a `<g>` with N descendants shrinks
  `domCache.size` by exactly N+1; moving a node between two *surviving* groups still reuses the
  existing DOM node (no re-create).
- **Heap regression:** reproduce the reported 600-scrub measurement (27.7 → 30.3 MB) and show it
  flat. If it cannot be reproduced in this environment, assert `domCache.size` returns to baseline
  after add/remove cycles and say so plainly in the PR body rather than claiming the heap result.
- `yarn workspace @ripl/charts test:visual` green.
- Manual: every SVG docs demo, plus a chart drag/scrub in SVG mode — hit testing must respond on the
  first frame.

---

### Branch E — `claude/docs-demo-lifecycle` (report #6)
**Risk: none to the library.** Website only. 31 pages.

**Pattern (apply once, repeat everywhere):** hoist construction into the `useRiplExample` callback;
`redraw()` mutates element state and re-renders. Ids become stable, every id-keyed cache hits, and —
the real payoff — the docs start demonstrating the library's *update* path instead of teaching
readers to rebuild the world each frame. This is also the only realistic end-to-end exercise the raw
`SVGContext` path has, so it is what will surface anything D missed.

Representative targets (do **not** enumerate all 31 in the PR body):
`apps/website/src/docs/core/advanced/clip-paths.md` (23 elements/redraw),
`.../getting-started/tutorial.md` (30 sites), `.../advanced/interpolators.md`,
`.../essentials/group.md`, `.../advanced/gradients.md`.

Where an element set genuinely changes per redraw, pass an explicit stable `id` to the factory
instead — that also satisfies `AGENTS.md:553`.

**Success criteria**
- No `create<Element>(…)` call remains inside any function reachable from `redraw` /
  `renderDemo` / a `context.on('resize')` handler, except where an explicit stable `id` is passed.
  Verify by grep, and state the count in the PR body.
- Spot-check: render a converted demo twice into an SVG context; the set of `[id]` attributes is
  identical across passes.
- `yarn workspace website build` passes (`check-chart-options`, `check-config-coverage`, typedoc).
- Every converted demo exercised manually in **both** canvas and SVG.
- Split into two PRs by directory (`docs/core/{elements,essentials}` / `docs/core/{advanced,contexts,getting-started}`)
  if the diff exceeds ~800 lines.

---

### Branch F — `claude/context-audit` (new task)
**Risk: none — investigation only.** Produces findings + regression tests, **not** fixes.
Fixes are triaged by the orchestrator into their own branches so PRs stay small.

**One subagent per context.** Each agent reads the base contract
(`packages/core/src/context/context.ts`) plus `DOMContext`, then audits its backend against it:

| Agent | Target |
|---|---|
| F1 | `packages/canvas` — `CanvasContext` + `canvas2DStateMixin` |
| F2 | `packages/svg` — `SVGContext`, `definitions`, `diff`, `path`, `text` |
| F3 | `packages/terminal` — `TerminalContext` |
| F4 | `packages/3d` — `Context3D`, `CanvasContext3D` |
| F5 | `packages/webgpu` — `WebGPUContext3D` |
| F6 | `packages/dom` + `packages/node` — shared `DOMContext`, reconciler, node bindings |

**Checklist each agent works through** (uniform, so findings are comparable):
save/restore symmetry and state-stack integrity · `markRenderStart`/`markRenderEnd` depth handling ·
`pushGroup`/`popGroup` balance and clip scoping · transform composition and ordering ·
gradient/pattern/shadow resolution and `<defs>`-equivalent lifecycle · text metrics and
text-on-path · hit testing (`isPointInPath`/`isPointInStroke`, DPR and world-transform mapping) ·
`export()` · `destroy()` cleanup and leak surface · **canvas-vs-backend visual parity for an
identical scene.**

**Seed leads — hand these to the agents so they don't start cold:**
- **F1:** `_fillCSS`/`_strokeCSS` (`mixins.ts:155,299`) are not stacked, so `restore()`
  (`:341-348`) restores the native `fillStyle` but leaves the getter returning the inner scope's
  value — **finding #10, already confirmed**. Also: the mixin's `save()` never calls
  `super.save()`, so `Context.currentState` is bypassed entirely on canvas — verify nothing reads it.
- **F2:** defs sweep timing; `_removeFromVTree` searches only `_currentParentVNode`; the group clip
  deliberately skips its `restore`; `_textPathCache` keyed by text id.
- **F6:** `createFrameBuffer` cancels-and-reschedules, so a mousemove stream faster than rAF can
  starve `_handleHoverHitTest` indefinitely (cf. `0bc2fc4`, the same defect one layer up).
- **All:** the **canvas/SVG group-gradient parity gap** recorded above — canvas resolves once at the
  group box, SVG per leaf. Scope a fix; do not implement it in this branch.

**Success criteria**
- One findings document per context: each entry carries `file:line`, a concrete failure scenario,
  a severity, and a failing-test sketch.
- Every confirmed bug lands as a test — passing where it pins correct behaviour, `test.skip` with a
  linked finding where it pins a defect. No silent findings.
- A canvas↔SVG parity harness extending the existing Playwright setup
  (`packages/charts/test/visual/`): the same gallery rendered through both contexts, diffed against
  each other rather than against a stored baseline. This is the durable asset the audit leaves behind.
- A single triage summary ranking findings across all six contexts, with proposed branch groupings.

---

### Follow-up, explicitly out of scope

Recorded, not scheduled: the scene-global binary dirty gate (`Scene._needsRender`, `scene.ts:77`) —
the renderer repaints everything when one element changes. A much larger change to the render loop.
**The separable half is in scope** and belongs in Branch B or its own small branch: `setStateValue`
(`element.ts:590`) marks `_dirty` for any key, so a paint-only change discards `Shape2D`'s traced
path (`shape.ts:143-147`). Split geometry-affecting keys from paint-only keys behind a second flag;
contained to `Element` and `Shape2D`, no render-loop code touched. Success criterion: animating
`fill` on a `Circle` re-traces the path **zero** times over N frames while animating `radius`
re-traces every frame.

---

## Verification

**Per-branch gates (all must pass before any PR opens):**
```bash
yarn test           # vitest, coverage thresholds enforced (lines 70 / functions 62 / branches 57)
yarn lint
yarn typecheck
```

**Public-API docs** — mandatory for every new/changed public member (`CLAUDE.md`). New surface in
this plan: `createLRUCache`, `parseGradientCached`, `parsePatternCached`,
`getGradientStopSignature`, the now-exported `applyGradientStops`, and the rewritten
`updateSVGGradientElement` / `createSVGGradientElement` docs.
```bash
cd apps/website
yarn typedoc --entryPointStrategy resolve \
  --entryPoints ../../packages/<pkg>/src/index.ts --tsconfig ../../packages/<pkg>/tsconfig.json \
  --validation.notDocumented --excludePrivate --excludeProtected --excludeInternal --emit none \
  | grep 'does not have any documentation' | grep -v SetSignature
```

**Visual regression (branches B, D, and F's parity harness):**
```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium-*/chrome-linux/chrome \
  yarn workspace @ripl/charts test:visual
```
Baselines are committed and **must not be regenerated** to make a branch pass. A diff is a real
repaint change: explain it in the PR body or fix it.

**Manual end-to-end (branches B, C, D, E):**
```bash
yarn workspace website start
```
Exercise the gradient, pattern-fills, clip-paths, events, and transforms demos in **both** canvas and
SVG. Specifically: drag every slider end to end (B), scroll the page while hovering a demo and
toggle canvas/SVG with the cursor resting over the surface (C), scrub a chart in SVG mode and
confirm hit testing responds on the first frame (D).

---

## Notes for the orchestrating agent

- **Conventions are non-negotiable and enforced:** 4-space indent, single quotes, one named import
  per line with a trailing comma, blank-line grouping by import kind (`ripl/import-export-spacing`),
  no `switch` in `packages/*/src` (keyed object dispatch instead), explicit member accessibility,
  `#` for truly-private fields. Read `AGENTS.md` before the first edit.
- **Comments:** one line or none. JSDoc on public API is mandatory; `//` prose in bodies is not, and
  a multi-line `//` block will be rejected. If the point needs a paragraph, extract a named function.
- **Commit style:** conventional commits, extremely concise, grammar sacrificed for concision.
  Mark D `!` for the `Context.buffer` removal.
- **Branch A gates branch B** — do not start B's cache work before A's LRU lands.
- **B and D both edit `packages/svg/src/context.ts`** (different regions: `_resolveGradientStyle`
  vs `markRenderEnd`/`_isPointIn`/constructor). Merge B first, rebase D.
- **Do not add runtime dependencies.** Zero-runtime-dependency is a project promise.
- Each branch is one PR. Do not open a PR unless explicitly asked.
