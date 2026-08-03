# SVG rendering-context audit (`packages/svg/src/*` + `packages/dom/src/vdom.ts`)

**Baseline:** `main` (`8121b9d`). `packages/svg/**` and `packages/dom/**` are byte-identical between
`main` and the checked-out branch, so every line reference below is a `main` line number.
`yarn vitest run packages/svg packages/dom` is green on this baseline (139 tests) — everything below is
a *new* finding, not a pre-existing failure.

**Out of scope (as instructed, not reported):** gradient/pattern re-parse per resolve, `<stop>` rebuild
per update, the `buffer` flag / rAF-deferred commit, `_domCache` retaining descendants of removed
groups, `_isPointIn` resolving via `getElementById`.

**Method:** every CONFIRMED finding below was reproduced against the real `SVGContext`/`CanvasContext`
in jsdom (scratch spec, since deleted). SUSPECTED findings are code/spec reasoning I could not execute
in jsdom (which implements neither SVG rendering nor `SVGGeometryElement.isPointInFill`).

---

## Checklist verification summary

| # | Item | Verdict |
|---|---|---|
| 1 | save/restore symmetry, `_transformStack` / `_clipStack` | **Mostly correct** — stacks stay index-aligned with `states` under balanced use. Two defects: **S-9** (root-level clip grows all three stacks by one entry per frame, forever) and **S-14** (`restore()` pops the SVG stacks even when the base `restore()` no-ops). |
| 2 | `markRenderStart`/`markRenderEnd` depth + vtree reset | **Correct for balanced use** — depth-0 gating resets `_vtree`/`_currentParentVNode`/`_vnodeStack`/`_usedDefs`, and `markRenderEnd` commits exactly once per outermost pass. Defect **S-13**: any imbalance is *permanently* unrecoverable. Note `markRenderStart` deliberately does **not** reset `_transformStack`/`_clipStack`/`saveDepth`, which is what lets **S-9** accumulate. |
| 3 | push/popGroup balance, `_vnodeStack`, group opacity, group-scoped clip | `_vnodeStack` push/pop is balanced and defensively falls back to `_vtree`. Group opacity stamping is **correct in isolation** (`<g style="opacity">` + `currentState.opacity = 1`) — verified `OUTER 0.5 → INNER 0.5 → leaf` produces nested `<g opacity=.5>` with the leaf carrying only its own value. But it **diverges from canvas** (**S-5**). The group-scoped clip's dangling `save()` is correctly absorbed by `popGroup` *inside a group* — but not at the scene root (**S-9**) — and the clip itself is mis-scoped (**S-2**, **S-3**). |
| 4 | Transform composition | **Correct.** `pushGroup` writes `_currentTransforms.join(' ')` onto the `<g>` and then resets `_currentTransforms = []` (ctx.ts:545), so a leaf carries only its own transform and the group transform is supplied once by the native `<g>`. Verified `<g OUTER translate(50,0)><g INNER translate(20,0)><path …>` — no double application. A `clip: true` shape's `skipRestore` leaks its own transform onto later siblings, but canvas leaks it identically (same CTM), so **parity holds**. |
| 5 | `<defs>` lifecycle, `_usedDefs` keying, cache keys | **Correct.** All five namespaces round-trip: `gradient:${id}:fill|stroke`, `pattern:${id}:fill|stroke`, `clip:${pathId}`, `textpath:${textId}`, `shadow:${elementId}` are added in the resolvers and swept with matching namespaces in `_sweepDefs` (ctx.ts:300-306). `_usedDefs` is cleared only at depth 0; the sweep runs *after* the reconcile (ctx.ts:378-381), so no live node ever references a just-deleted def. `_shadowCache`/`_textPathCache` keys are stable because `Shape2D` passes `this.id` to `createPath` and `Text` passes `id: this.id` to `createText` (`core/src/elements/text.ts:116`). Verified a shadow filter is created, refreshed and then swept when the shadow is removed. Only caveat: a multi-path element (`Polyline` with `segments`) mints one gradient/shadow def **per path node** rather than per element (cosmetic/perf; the geometry is identical because bounds come from `currentRenderElement`). |
| 6 | `_removeFromVTree` narrow search | See **S-16** — no *reachable* caller breaks it today (the only in-tree `applyClip` caller is `Shape2D.render`, which creates and clips within one `_currentParentVNode`), but it is latent, and its sibling defect (only the *primary* path is removed) is real. |
| 7 | Text metrics, `<textPath>`, attribute handling | `<textPath>` wiring is **correct** — verified `<text id="T2"><textPath id="T2:textpath" href="#textpath-…" startOffset="25%">curved</textPath></text>` with the geometry `<path>` in `<defs>`, and `SVGText.definition.textContent` correctly returns `undefined` when `pathData` is set so the `<textPath>` child is not wiped. Defects: **S-11** (`maxWidth` dropped), **S-8** (scene font), **S-21** (`alignment-baseline` dead weight). |
| 8 | `updateSVGElement` stale removal | **Correct.** Verified across frames: a `<path>` that had `filter="url(#shadow-…)"` and `transform="translate(10,10)"` in frame 1 has **both attributes removed** in frame 2 when the definition no longer carries them, and the orphaned shadow filter is swept from `<defs>`. Ordering is right (set-then-prune for both attributes and styles) and `id` is correctly exempted. The `APPLIED_DEFINITION` snapshot holds a *reference* to the previous frame's `attributes` object rather than a copy, which is safe only because every backend object is rebuilt per frame — worth a comment, not a bug. |
| 9 | `export()` / `destroy()` | `export()` correctly forces a synchronous `_commit()` first. Defects: **S-10** (no `destroy()` override at all), **S-17** (no `width`/`height` in the exported markup). |
| 10 | Canvas/SVG visual parity | **S-4** (group gradient — the assigned deep-dive), **S-5** (opacity), **S-2**/**S-3** (clip), **S-6** (hit testing), **S-8** (font), **S-11** (maxWidth), **S-12** (blend mode), **S-18** (shadow space), **S-20** (filter order). |

---

## CONFIRMED findings

### S-1 · `packages/dom/src/vdom.ts:147` · HIGH
**Defect:** `reconcileNode` only recurses into a child when `childVNode.children.length > 0`, so a
container whose vnode has *zero* children is never reconciled and keeps the previous frame's DOM
children forever.

```ts
if (childVNode.children.length > 0) {
    reconcileNode(domChild, childVNode, domCache, options);
}
```

**Failure scenario (reproduced):** `group = createGroup({ id: 'G' })` holding shapes `A` and `B`;
render → `<g id="G"><path id="A"/><path id="B"/></g>`. Call `group.clear()` and render again.
`Scene._collectInstructions` still emits a `push`/`pop` pair for the now-empty group, so
`SVGContext.pushGroup` (ctx.ts:506) creates a `<g>` vnode with `children: []`, the guard skips the
recursion, and the DOM is **unchanged**: `<g id="G"><path id="A"/><path id="B"/></g>`. The removed
elements stay painted for the rest of the session. `_domCache` still lists `['G','A','B']`.

The 2→1 transition works correctly (only 2→0 breaks), which is why this has gone unnoticed —
it fires exactly when a group is emptied (chart series toggled off, `axis.set([])`, a filtered
category dropping to zero, a legend clearing, `group.set([])` during a data update).
A group that renders *only* a `clip: true` child hits the same path: it produces `<g id="GC"></g>`
with zero vnode children, so any children it had last frame survive.

**Severity:** HIGH — wrong pixels, permanent, common trigger.

**Test sketch:**
```ts
test('Should remove every child when a group is emptied', () => {
    const scene = createScene(ctx);
    const group = createGroup({ id: 'G', children: [rectA, rectB] });
    scene.add(group);
    scene.render();
    expect(ctx.element.querySelector('#G')!.children.length).toBe(2);

    group.clear();
    scene.render();
    expect(ctx.element.querySelector('#G')!.children.length).toBe(0); // fails: still 2
});
```
Also worth a `packages/dom/test/reconcile.test.ts` unit: reconcile `{id:'g', children:[a,b]}` then
`{id:'g', children:[]}` against the same DOM parent.

---

### S-2 · `packages/svg/src/context.ts:596-623` (`applyClip`) · HIGH
**Defect:** `_currentClipId` is a single scalar, so a second `applyClip` in the same scope **replaces**
the active clip instead of intersecting with it; canvas's `ctx.clip()` always intersects.

**Failure scenario (reproduced):** apply clip `rect(0,0,50,50)`, then clip `rect(25,25,50,50)`, then
fill a `rect(0,0,100,100)`.
- Canvas: `ctx.clip()` called twice → the leaf paints only in the intersection `25,25 → 50,50`.
- SVG: leaf gets `clip-path="url(#clip-2)"` only → it paints across the whole `25,25 → 75,75`.
Both `<clipPath>` defs are emitted into `<defs>`; only the last is referenced.

The same defect covers the far more common nesting form: an outer group establishing a plot-area clip
and an inner group establishing a brush/zoom clip — descendants of the inner group escape the outer
clip entirely.

**Severity:** HIGH — silently paints outside the intended region.

**Test sketch:** two `clip: true` shapes as siblings, then a leaf; assert the leaf's `clip-path`
resolves to a def whose geometry is the intersection (or that the leaf carries *two* clip references,
e.g. a `<g clip-path>` wrapper plus the leaf's own).

---

### S-3 · `packages/svg/src/context.ts:338-340` + `506-546` · HIGH
**Defect:** the clip is stamped on each **leaf** (`element.definition.attributes['clip-path']`) and never
on the `<g>` that established it. `<clipPath>` defaults to `clipPathUnits="userSpaceOnUse"`, which is the
user space of the *referencing element* — so a leaf nested inside further transformed `<g>` nodes has the
clip geometry displaced by those transforms. On canvas the clip region is baked into device space at
`ctx.clip()` time and is immune to later transforms.

**Failure scenario (reproduced structurally):**
```
<g id="OUTER" transform="translate(50,0)">
  <g id="INNER" transform="translate(20,0)">
    <path id="LEAF" … clip-path="url(#clip-bd3f2273)"/>
<defs><clipPath id="clip-bd3f2273"><path d="M 0,0 L 40,0 L 40,40 L 0,40 L 0,0"/></clipPath></defs>
```
The clip shape is a child of `OUTER`, so its geometry is authored in `OUTER`'s space (root-x `50..90`).
`LEAF` sits inside `INNER`, so the browser resolves the clip in `OUTER ∘ INNER` space → root-x `70..110`.
**20px off**, and the error grows with nesting depth. A rotated or scaled inner group also rotates/scales
the clip.

Note `applyClip` (ctx.ts:611-615) *does* write `_currentTransforms` onto the `<clipPath>`'s `<path>`,
which correctly accounts for the clip shape's own transform — the bug is purely the ancestor `<g>`s
between the clip's scope and the referencing leaf.

**Severity:** HIGH — any nested-group scene with a group-scoped clip (cartesian plot area + a
transformed series group is the canonical chart layout).

**Test sketch:** build `OUTER(translate 50) > [clip rect(0,0,40,40), INNER(translate 20) > leaf]`;
assert the leaf's clip is expressed in the space it was authored in — e.g. that `clip-path` lands on
`<g id="OUTER">` rather than on the leaf, or that the `<clipPath>` path carries a compensating
`transform`.

---

### S-4 · Group gradient fill — the assigned deep-dive · HIGH
**Defect:** a `Group` carrying a gradient `fill` produces three different pictures depending on the
backend, and *neither* backend resolves it against the group's own box.

**Exactly how it diverges.** `Context.pushGroup` (`core/src/context/context.ts:526`) calls
`applyGroupPaint`, which runs `CONTEXT_OPERATIONS.fill(this, group.fill)` — i.e. it assigns the
gradient *string* to `context.fill` once, at the group boundary.

*Canvas* (`packages/canvas/src/mixins.ts:159-169`): the `fill` setter resolves eagerly:
```ts
const bounds = getGradientBounds(this.gradientBounds(), this.width, this.height);
setCanvasFill(this.context, value, bounds);
```
`gradientBounds()` (mixins.ts:332-334) returns `this.currentRenderElement?.getBoundingBox(true)`.
**`currentRenderElement` is never the group.** `context.currentRenderElement = this` is assigned only in
`Element.render` (`core/src/core/element.ts:859`); `Group.render` (group.ts:194) overrides `render`
entirely without setting it, and `RENDER_OPERATIONS.push` (scene.ts:60) / `Renderer._renderBuffer`
(renderer.ts:368) call `context.pushGroup(element)` directly. So the group's gradient resolves against
whatever leaf was rendered **last**, or `undefined`. Reproduced:
- group is the first thing in the frame → `createLinearGradient(0, 50, 200, 50)` — the fallback
  full-surface box `{0,0,200,100}` from `getGradientBounds`.
- a leaf with local box `(0,0,7,7)` drawn immediately before the group →
  `createLinearGradient(0, 3.5, 7, 3.5)` — **the previous leaf's box**. The group's gradient therefore
  depends on unrelated paint order.

Exactly **one** `CanvasGradient` is created and every leaf under the group shares it, so the ramp runs
continuously across the group (each leaf shows its slice of one ramp).

*SVG* (`packages/svg/src/context.ts:631-635` → `_resolveGradientStyle`, ctx.ts:198-243): the group's
`fill` string is only stored in `currentState`; it is resolved **per leaf**, in `applyFill`, with
`cacheKey = \`${element.id}:fill\`` and bounds `this.currentRenderElement?.getBoundingBox(true)` — which
at that point *is* the leaf. Reproduced with leaves A (local box `0..50`) and B (local box `100..200`)
under a group with `linear-gradient(90deg,#f00,#00f)`:
```html
<g id="G">
  <path id="A" style="fill:url(#gradient-b906e3fb)" …/>
  <path id="B" style="fill:url(#gradient-66af74ba)" …/>
</g>
<defs>
  <linearGradient id="gradient-b906e3fb" gradientUnits="userSpaceOnUse" x1="0"   y1="25" x2="50"  y2="25">…
  <linearGradient id="gradient-66af74ba" gradientUnits="userSpaceOnUse" x1="100" y1="25" x2="200" y2="25">…
```
Two independent defs; each leaf shows the **full** red→blue ramp restarted over its own box.

**Net picture for the same scene:** canvas paints one ramp spanning `x∈[0,200]` (so A is nearly all red
and B is the blue half); SVG paints two complete red→blue ramps. Additionally the canvas result silently
changes if you add or reorder an unrelated sibling before the group.

**What a fix would have to change** (scoping only, not fixing):
1. **Make the group the render element at its boundary.** `pushGroup` (or `RENDER_OPERATIONS.push` /
   `Renderer._renderBuffer`) must set `context.currentRenderElement = group` for the duration of the
   boundary and restore it afterwards, so `gradientBounds()`/`_resolveGradientStyle` see the group's
   `getBoundingBox(true)`. `Group.getBoundingBox` (group.ts:178) already composes children, and
   `Group._boundsCacheable` is `false`, so this is a live (uncached) union — note the cost.
   Careful: `currentRenderElement`'s setter pushes non-abstract elements into `renderedElements`;
   groups are `abstract = true` (element.ts:250 / group.ts:81), so they are correctly skipped.
2. **Resolve the group's paint once at the boundary in SVG too.** `pushGroup` would have to run the
   gradient/pattern resolution against the group box, key the def by the *group* id
   (`gradient:${group.id}:fill`), stamp `fill="url(#…)"` on the `<g>`, and stop
   `_resolveGradientStyle` from re-resolving for a leaf whose fill it did not itself set. The cheapest
   discriminator is a flag in `currentState` (e.g. "the current fill is already a resolved `url(#…)`")
   set by `pushGroup` and cleared by any leaf-level `CONTEXT_OPERATIONS.fill`.
   Doing so also makes the SVG cascade match SVG's own `fill` inheritance instead of stamping a
   redundant `fill` on every leaf.
3. **Decide the semantics deliberately** and encode it in `getGradientBounds`' contract: "a group's
   gradient resolves against the group's local box; a leaf's own gradient against the leaf's local box."
   Today `getGradientBounds`' doc claims cross-backend identity, which is false at group boundaries.
4. A group-box gradient must be invalidated when children move — `Group._boundsCacheable === false`
   means it is recomputed each frame anyway, but the def would then need rewriting every frame
   (bounds already are; the stops are the out-of-scope concern).

**Severity:** HIGH.

**Test sketch:** one spec, two contexts, one scene factory (group with a gradient fill + two leaves at
disjoint boxes). Assert canvas records exactly one `createLinearGradient(x0,y0,x1,y1)` and SVG emits
exactly one `<linearGradient>` with the *same* `x1/x2`, and that both equal the group's box, not the
surface and not a leaf's box.

---

### S-5 · Group opacity vs a leaf's own opacity · HIGH
**Defect:** `Context.pushGroup` composites group opacity **multiplicatively**
(`this.opacity *= opacity`), but a leaf's own opacity is applied by
`CONTEXT_OPERATIONS.opacity` → `basicContextSetter('opacity')` → plain **assignment**. On canvas that
assignment overwrites `globalAlpha`, discarding the accumulated group alpha. In SVG the leaf's value is
stamped as its own `opacity` style *inside* the ancestor `<g opacity>` nodes, so it multiplies.

**Failure scenario (reproduced, both backends, same scene):**
`OUTER(opacity .5) > INNER(opacity .5) > [LEAF_OWN(opacity .5), LEAF_NONE(no opacity)]`
- Canvas fills: `LEAF_OWN` at `globalAlpha` **0.5**; `LEAF_NONE` at **0.25**.
- SVG: `<g id="OUTER" style="opacity:.5"><g id="INNER" style="opacity:.5"><path id="LEAF_OWN" style="…opacity:.5"><path id="LEAF_NONE" style="…opacity:1">`
  → effective **0.125** and **0.25**.

`LEAF_NONE` matches; `LEAF_OWN` is 4× more transparent in SVG. This is the single most likely visual
difference in practice, because chart enter/exit transitions animate `opacity` on leaves that sit inside
groups (and `Element.interpolate` writes straight into `state`, so every animated frame hits this path).

Note SVG's behaviour is the DOM-correct one; canvas's assignment is the anomaly. Either way the two
backends disagree.

**Severity:** HIGH.

**Test sketch:** render the scene above into both contexts; assert the effective alpha of `LEAF_OWN` is
identical (record `globalAlpha` at `fill()` on a stateful canvas stub; multiply the `<g>`/leaf `opacity`
styles on the SVG side).

---

### S-6 · SVG box hit testing is off by the device pixel ratio · HIGH
**Defect:** `Context.rescale` (`core/src/context/context.ts:417-425`) leaves `scaleX`/`scaleY` as an
identity mapping — for SVG the hit point stays in **CSS pixels**. `rescaleCanvas`
(`packages/canvas/src/utilities.ts:250-253`) maps to **device pixels**. But
`Element.intersectsWith` (`core/src/core/element.ts` — the base, box-based test) divides by
`scaleDPR(1)` unconditionally:
```ts
const dpr = this.context?.scaleDPR(1) ?? 1;
return isPointInBox([x / dpr, y / dpr], this.getBoundingBox());
```
`scaleDPR` is built in the base `Context` constructor for *every* backend (context.ts:412), so on SVG it
is the real device pixel ratio while the incoming point was never multiplied by it.

**Failure scenario (reproduced with `devicePixelRatio = 2`):** a `Text` element at `(100,50)` with box
`{left:100, top:42, right:150, bottom:52}`. `DOMContext._handleClick` produces
`scaleX(125) = 125, scaleY(47) = 47` for a click at the box centre.
`label.intersectsWith(125, 47)` → **false**. It only returns `true` at `(250, 94)`.
The same canvas scene produces `scaleX(125) = 250` and hits correctly.

Applies to every element whose hit test falls through to the base box test: `Text`, `ImageElement`,
`Group`, and any `Shape2D` with no traced path. Path-backed shapes are unaffected (they route through
`_isPointIn`). On a standard Retina/2× laptop, **no SVG text label, legend entry or axis label is
clickable/hoverable at the right place** — clicks land at half coordinates.

**Severity:** HIGH.

**Test sketch:**
```ts
factory.set({ devicePixelRatio: 2 });
// same Text element, same click coordinates, canvas vs svg
expect(svgLabel.intersectsWith(ctx.scaleX(cx), ctx.scaleY(cy), { isPointer: true })).toBe(true);
```

---

### S-7 · `packages/svg/src/context.ts:489` (`drawImage`) · HIGH (performance)
**Defect:** `canvasImageSourceToDataURL(image, imgWidth, imgHeight)` is invoked on **every render pass**.
It allocates a fresh `<canvas>`, draws the source into it and calls `toDataURL()` — a synchronous full
PNG encode + base64 — and the resulting multi-megabyte string is then written to the live `<image>`'s
`href` attribute by `updateSVGElement`, forcing the browser to re-decode the image every frame too.

**Failure scenario (reproduced):** one `ImageElement` in a scene; `HTMLCanvasElement.prototype.toDataURL`
is called once per `scene.render()` (1 call after 1 frame, 3 after 3). At 60fps with a 512×512 image
that is ~60 PNG encodes/second per image. Canvas does a plain `ctx.drawImage`.

The href is content-addressable and the `SVGImage` id is stable (`renderElement.id`), so the encode
should be memoized per source+size and the attribute only rewritten when it changes.

**Severity:** HIGH (perf) — a single image element makes an SVG scene unusable.

**Test sketch:** spy on `HTMLCanvasElement.prototype.toDataURL`; render three frames with an unchanged
image; expect exactly one call.

---

### S-8 · `packages/core/src/core/scene.ts:140` · MEDIUM
**Defect:** the scene root inherits the host element's computed font only when
`context.element instanceof HTMLElement`. `SVGSVGElement` is **not** an `HTMLElement`
(it extends `SVGElement`), so an SVG scene never picks up the page font.

**Failure scenario (reproduced):** host `<div style="font: italic bold 22px/1 Georgia">`.
- canvas scene root `font` → `"italic bold 22px / 1 Georgia"`
- SVG scene root `font` → `undefined` → every text element falls back to the context default
  `10px sans-serif`.

This changes both what is painted **and** the layout: `Text._getLocalBoundingBox` measures with
`getComputedValue('font')`, so bounding boxes, label collision avoidance and axis tick spacing all shift
between backends for the same chart.

**Severity:** MEDIUM (visible on every text-bearing chart; trivially fixed by testing for `Element`
rather than `HTMLElement`, or by reading the context's `root`).

**Test sketch:** as above — construct both contexts on identically styled hosts and assert
`scene.font` matches.

---

### S-9 · `packages/core/src/context/context.ts:502-513` + `packages/svg/src/context.ts:555-566` · MEDIUM
**Defect:** a `clip: true` shape that is a **direct child of the scene** (not inside a group) leaves a
dangling `save()` that nothing absorbs. `Shape2D.render` passes `skipRestore = this.clip`
(`core/src/core/shape.ts:170`); inside a group `popGroup` unwinds to the recorded depth, but the scene
root emits no `push`/`pop`, and `Context.batch` performs exactly one `save()`/`restore()` pair.

**Failure scenario (reproduced):** scene with a root-level `clip: true` shape plus one leaf, rendered
three times:

| after frame | `saveDepth` | `states.length` | `_transformStack` | `_clipStack` |
|---|---|---|---|---|
| 1 | 1 | 1 | 1 | 1 |
| 2 | 2 | 2 | 2 | 2 |
| 3 | 3 | 3 | 3 | 3 |

+1 per frame, unbounded — ~216k retained state objects per hour at 60fps, across four arrays
(two of them SVG-specific). Painted output stays correct (`_currentClipId` does return to `undefined`),
so this is a pure leak, but `markRenderStart` deliberately does not reset these stacks, so nothing ever
recovers.

**Severity:** MEDIUM.

**Test sketch:** render a scene containing a root-level `clip: true` shape ten times; assert
`(ctx as any).saveDepth === 0` and `_transformStack.length === 0` afterwards.

---

### S-10 · `packages/svg/src/context.ts` (no `destroy()` override) · MEDIUM
**Defect:** `SVGContext` never overrides `destroy()`. `DOMContext.destroy()` removes the `<svg>` and
disposes retained subscriptions, but nothing cancels the pending `_requestFrame` commit, and none of
`_domCache`, `_gradientCache`, `_patternCache`, `_textPathCache`, `_clipCache`, `_shadowCache`,
`_vtree`, `_vnodeStack`, `_transformStack`, `_clipStack` are cleared. `createFrameBuffer`
(`core/src/animation/utilities.ts:10-21`) returns only a scheduler — it exposes no cancel handle.

**Failure scenario (reproduced):** create a standalone `SVGContext` (`buffer === true`), run one
render pass, call `destroy()`, then wait two animation frames — `_commit()` still fires and reconciles
the **detached** `<svg>` (which ends up with 2 children after destroy). Anything holding the context
alive (a devtools panel, a `WeakRef`-free registry) also keeps every cached `<defs>` node and every
cached DOM node alive.

**Severity:** MEDIUM (post-destroy work + retention; not wrong pixels).

**Test sketch:** spy on `_commit`; render, destroy, await two rAFs; expect zero calls and empty caches.

---

### S-11 · `packages/svg/src/text.ts:26-42` · MEDIUM
**Defect:** `TextOptions.maxWidth` is carried by `ContextText` and honoured by canvas
(`applyCanvasFill` → `ctx.fillText(content, x, y, element.maxWidth)`,
`packages/canvas/src/utilities.ts:294`) but `SVGText.definition` never emits the SVG equivalent
(`textLength` + `lengthAdjust="spacingAndGlyphs"`).

**Failure scenario (reproduced):** `ctx.createText({ x:5, y:6, content:'hello', maxWidth:40 })` →
`<text id="T1" … x="5" y="6">hello</text>` — no `textLength`. Canvas compresses the run to 40px;
SVG lets it overflow. Any label that relies on `maxWidth` to fit a column/cell (heatmap cell labels,
truncated axis ticks) overflows its cell in SVG only.

**Severity:** MEDIUM.

**Test sketch:** `createText({ …, maxWidth: 40 })`; expect `textLength === '40'` and
`lengthAdjust === 'spacingAndGlyphs'` on the `<text>` node.

---

### S-12 · `packages/svg/src/context.ts:313-341` (`_setElementStyles`) · MEDIUM
**Defect:** `globalCompositeOperation` is part of the shared drawing state (`CONTEXT_OPERATIONS`,
`Element.globalCompositeOperation`) and honoured by canvas, but `_setElementStyles` never maps it to
`mix-blend-mode` (nor sets `isolation: isolate` on the enclosing `<g>` to scope it).

**Failure scenario:** an element with `globalCompositeOperation: 'multiply'` composites correctly on
canvas and renders as plain `source-over` in SVG. Silent — no warning, no fallback.

**Severity:** MEDIUM (silent divergence for a documented public state property).

**Test sketch:** render an element with `globalCompositeOperation: 'multiply'`; expect
`style.mixBlendMode === 'multiply'` on the node.

---

### S-13 · `packages/svg/src/context.ts:384-412` · LOW-MEDIUM
**Defect:** an unbalanced `markRenderStart`/`markRenderEnd` wedges the surface **permanently**, in both
directions:
- depth drops below 0 (extra `markRenderEnd`) → `markRenderStart` bumps `-1 → 0` so the vtree reset
  never runs and `markRenderEnd` never observes `0`, so `_commit()` never runs again;
- depth stays above 0 (a throw between start and end) → same outcome.

Verified: after one stray `markRenderEnd`, a full subsequent pass that creates and fills a path leaves
the surface empty (`renderDepth` cycles `-1 → 0 → -1`, `_commit` never called).

**Reachable trigger:** `Group.render` (`core/src/core/group.ts:194-207`) calls `markRenderStart`,
`pushGroup`, renders children, then `popGroup`/`markRenderEnd` **with no `try/finally`** — unlike
`Element.render` and `Context.batch`, both of which are protected. One exception from a child's render
(a custom path renderer reading external data, a bad interpolator) permanently freezes the SVG surface;
the canvas backend just drops that frame and recovers.

**Severity:** LOW-MEDIUM (needs a throw, but the failure is unrecoverable and silent).

**Test sketch:** make one child of a group throw during `render`; assert the next `scene.render()` still
reconciles (i.e. `renderDepth` returns to 0).

---

### S-14 · `packages/svg/src/context.ts:562-566` (`restore`) · LOW
**Defect:** `SVGContext.restore()` pops `_transformStack`/`_clipStack` **before** delegating, but
`Context.restore()` (context.ts:443-450) returns early when `saveDepth === 0`. An unbalanced `restore()`
therefore silently discards the current transform and clip while leaving `currentState` intact.

**Failure scenario (reproduced):** with `saveDepth === 0`, `ctx.translate(10, 20)` then `ctx.restore()`
→ `_currentTransforms` goes from `["translate(10,20)"]` to `[]` while `saveDepth` stays `0` and
`currentState` is unchanged; subsequent elements render untransformed.

**Severity:** LOW (latent — no in-tree caller over-restores today; `popGroup` is depth-guarded).

**Test sketch:** `ctx.translate(1,2); ctx.restore();` expect `_currentTransforms` unchanged when
`saveDepth === 0`.

---

### S-15 · `packages/svg/src/context.ts:631` (`applyFill`) · LOW
**Defect:** `applyFill(element, fillRule)` accepts a `fillRule` (part of the abstract `Context`
contract, honoured by canvas via `ctx.fill(path, fillRule)`) and drops it — the parameter is
`eslint-disable`d as unused. `fill-rule` is never emitted, so an `evenodd` fill silently renders
`nonzero`. (`applyClip` *does* honour it, ctx.ts:617-619 — so the two are inconsistent.)

**Failure scenario:** a self-intersecting/donut path filled with `evenodd` shows the hole on canvas and
is solid in SVG. No in-tree element passes a `fillRule` today, so this is latent.

**Severity:** LOW (latent contract gap).

**Test sketch:** `ctx.applyFill(path, 'evenodd')`; expect `fill-rule="evenodd"` on the node.

---

### S-16 · `packages/svg/src/context.ts:365-371` + `596-623` · LOW
**Defect (two parts):**
1. `_removeFromVTree` searches only `_currentParentVNode.children`. Every current caller
   (`Shape2D.render` → `createPath` then `applyClip`, `core/src/core/shape.ts:157-160`) creates and
   clips within the same parent, so it works — but nothing enforces that invariant, and the failure mode
   is a silent no-op leaving a stray node.
2. Reachable today: `applyClip` removes only `path.id`. A multi-path element removes only its
   **primary** path. `Polyline` with `segments` mints extra paths via
   `context.createPath(\`${this.id}:${index}\`)` (`core/src/elements/polyline.ts:336`) which are all
   `_addToVTree`'d; if such an element is `clip: true`, the run paths stay in the vtree as stray
   `<path>` nodes.

They are invisible (`SVGPath` defaults to `stroke:none; fill:none` and `_setElementStyles` never runs
on them), so this is DOM/`_domCache` bloat rather than wrong pixels. I could not get the segmented
tracer to emit run paths in my repro, so part 2 is **CONFIRMED by code reading, not by execution**.

**Severity:** LOW.

**Test sketch:** `createPolyline({ segments: […], clip: true })` in a scene; assert
`svg.querySelectorAll('path[id^="PL:"]').length === 0`.

---

### S-17 · `packages/svg/src/context.ts:415-430` (`export`) · LOW
**Defect:** the serialized markup carries `viewBox` and the inline
`style="display:block; width:100%; height:100%; user-select:none"` but **no `width`/`height`
attributes**:
```
<svg xmlns="http://www.w3.org/2000/svg" style="display: block; width: 100%; height: 100%; …" viewBox="0 0 200 100">…</svg>
```
As a standalone document (which is exactly how `toURL()` and `svgMarkupToImageData` consume it) the
`100%` percentages have no containing block, so the intrinsic size is browser-dependent. It also bakes
`user-select: none` into every export.

I could not rasterize in jsdom, so the *consequence* (blank/mis-scaled `toImage()`) is **SUSPECTED**;
the missing attributes are confirmed.

**Severity:** LOW.

**Test sketch:** `expect(ctx.export().toString()).toContain('width="200" height="100"')`.

---

## SUSPECTED findings (code/spec reasoning; not executable in jsdom)

### S-18 · shadow geometry lives in user space · LOW-MEDIUM
`_resolveShadowFilter` (ctx.ts:245-280) writes `dx`/`dy`/`stdDeviation` onto `<feDropShadow>` in the
filter's user space, which inherits every ancestor `<g>` transform. Canvas shadow offsets and blur are
explicitly **not** affected by the CTM. So the same element with `shadowOffsetX: 4, shadowBlur: 8`
inside `<g transform="scale(2)">` casts an 8px/16px shadow in SVG and a 4px/8px shadow on canvas.
Verify in a browser (Playwright, alongside the existing `test/visual/` specs) by screenshot-diffing a
shadowed rect inside a scaled group.

### S-19 · `_isPointIn` coordinate space · MEDIUM-HIGH *(distinct from the out-of-scope `getElementById` concern)*
`packages/svg/src/context.ts:343-354` builds an `SVGPoint` from the hit coordinates — which arrive in
the **SVG root's** user space — and passes it to `SVGGeometryElement.isPointInFill/isPointInStroke`.
Per SVG 2 those methods interpret the point in the **element's own local coordinate space**. Since
`_setElementStyles` stamps a `transform` on the element itself and ancestors are transformed `<g>`s,
the point is in the wrong space for any transformed element. Meanwhile
`hitTestHonorsTransform = true` (ctx.ts:130) explicitly tells `Shape2D.intersectsWith`
(`core/src/core/shape.ts:104-117`) *not* to map the point into local space — the opposite of what would
be needed. jsdom implements neither method, so this needs a real browser to settle.
Test sketch: Playwright — a rect inside `<g transform="translate(100,0)">`, click at its on-screen
centre, assert the element's `click` handler fires.

### S-20 · filter chain order · LOW
`_resolveElementFilter` (ctx.ts:282-298) emits `filter="url(#shadow-…) <cssFilter>"`, so a CSS
`blur(4px)` is applied to the shape **and its drop shadow**. Canvas applies `ctx.filter` to the shape
and derives the shadow from the filtered result, so the shadow is not additionally blurred. Needs a
browser screenshot diff.

### S-21 · `alignment-baseline` is dead weight, and its `middle` mapping disagrees · LOW
`_setElementStyles` writes both `alignment-baseline` and `dominant-baseline` on **every** element
(including `<path>` and `<image>`). `SVG_STYLE_MAP` maps `middle → 'middle'` for `alignmentBaseline` but
`middle → 'central'` for `dominantBaseline` (`packages/svg/src/constants.ts:20-30`). Browsers ignore
`alignment-baseline` on `<text>` (the constants file says so), and `SVGTextPath.definition.styles` is
`{}` so a `<textPath>` never receives it either — it inherits `dominant-baseline: central`. Net effect:
`alignmentBaseline` is unreachable dead configuration, and the two mappings would disagree if it ever
became reachable. Also worth noting canvas `textBaseline: 'middle'` (em-box middle) and SVG
`dominant-baseline: 'central'` are close but not identical, so text sits a fraction of an em apart
between backends.

---

## Ranked summary

| Rank | ID | Severity | One-liner | Status |
|---|---|---|---|---|
| 1 | **S-1** | HIGH | `vdom.ts:147` skips reconciliation for zero-child vnodes → an emptied `<g>` keeps last frame's children forever | CONFIRMED |
| 2 | **S-6** | HIGH | SVG box hit testing divides a CSS-pixel point by DPR → every `Text`/`Image`/`Group` mis-hits by 2× on Retina | CONFIRMED |
| 3 | **S-4** | HIGH | Group gradient: canvas resolves once against the *previous leaf's* box (or the surface), SVG once per leaf against each leaf's box — neither uses the group's box | CONFIRMED |
| 4 | **S-5** | HIGH | A leaf's own opacity overrides group alpha on canvas but multiplies with it in SVG (0.5 vs 0.125) | CONFIRMED |
| 5 | **S-3** | HIGH | Clip stamped on the leaf resolves in the leaf's user space → displaced by every intervening `<g>` transform | CONFIRMED |
| 6 | **S-2** | HIGH | `applyClip` replaces the active clip instead of intersecting it | CONFIRMED |
| 7 | **S-7** | HIGH (perf) | `drawImage` re-encodes the image to a PNG data URL every frame | CONFIRMED |
| 8 | **S-19** | MED-HIGH | `isPointInFill` is fed a root-space point but is specified in element-local space | SUSPECTED |
| 9 | **S-8** | MEDIUM | SVG scene root never inherits the host font (`SVGSVGElement` is not an `HTMLElement`) | CONFIRMED |
| 10 | **S-9** | MEDIUM | Root-level `clip: true` leaks one entry per frame across `states`/`_transformStack`/`_clipStack` | CONFIRMED |
| 11 | **S-10** | MEDIUM | No `destroy()` override: buffered commit fires post-destroy, all caches retained | CONFIRMED |
| 12 | **S-11** | MEDIUM | `maxWidth` honoured by canvas, silently dropped by SVG | CONFIRMED |
| 13 | **S-12** | MEDIUM | `globalCompositeOperation` silently dropped (no `mix-blend-mode`) | CONFIRMED |
| 14 | **S-18** | LOW-MED | Shadow `dx/dy/stdDeviation` scale with ancestor transforms; canvas shadows do not | SUSPECTED |
| 15 | **S-13** | LOW-MED | One render exception permanently freezes the SVG surface (`Group.render` has no `try/finally`) | CONFIRMED |
| 16 | **S-14** | LOW | `restore()` pops the SVG stacks even when the base `restore()` no-ops | CONFIRMED |
| 17 | **S-16** | LOW | `applyClip` removes only the primary path; `_removeFromVTree`'s single-parent search is latent-fragile | CONFIRMED (code) |
| 18 | **S-15** | LOW | `applyFill` drops `fillRule` (while `applyClip` honours it) | CONFIRMED |
| 19 | **S-17** | LOW | Exported markup has no `width`/`height` | CONFIRMED |
| 20 | **S-20** | LOW | `filter="url(#shadow) blur(…)"` blurs the shadow too | SUSPECTED |
| 21 | **S-21** | LOW | `alignment-baseline` is unreachable dead config and disagrees with the `dominant-baseline` mapping | CONFIRMED |
