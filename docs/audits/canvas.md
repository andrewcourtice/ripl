# Canvas rendering-context audit — `packages/canvas/src/*`

Read-only investigation. No file under `/home/user/ripl` was modified.

**Method.** Traced the base contract (`packages/core/src/context/context.ts`), the DOM layer
(`packages/dom/src/context.ts`), and the drive path (`element.ts`, `group.ts`, `scene.ts`,
`renderer.ts`, `shape.ts`) into `packages/canvas/src/{context,mixins,path,utilities}.ts`.
Everything marked **CONFIRMED** below was reproduced by executing the real code against a
`CanvasRenderingContext2D` stub that implements a *real* save/restore stack and a real CTM.
(The repo's own `mockCanvasContext` in `packages/test-utils/src/canvas.ts:99` uses `vi.fn()`
no-ops for `save`/`restore`, which structurally hides every state-stack defect in this package —
see finding **13**.) Scratch harness has been deleted; the reproductions are reproduced inline as
test sketches.

---

## Checklist verdicts

| # | Item | Verdict |
|---|------|---------|
| 1 | save/restore symmetry & state-stack integrity | **Partially holds.** `saveDepth` bookkeeping is correct and the `currentState`/`states` bypass is benign (nothing on the canvas path reads them). But a `clip: true` shape at scene root leaks one native `save()` **per frame**, unbounded → findings **1**, **2**. |
| 2 | markRenderStart/markRenderEnd depth | **Holds for the normal path**, but `Element.render` orders `currentRenderElement =` *before* `markRenderStart()`, so a direct `element.render(ctx)` silently drops the element from `renderedElements` → finding **9**. |
| 3 | pushGroup/popGroup balance, group opacity, clip scoping | **Balance holds.** Group opacity does **not** composite multiplicatively with a child's own opacity → finding **5**. A clip shape's transform/paint leaks to later siblings → finding **2**. |
| 4 | transform composition & ordering | **HOLDS.** Verified numerically: the native CTM at draw time equals `DPR · element.getWorldTransform()` for a nested group + rotated/translated/scaled child. `matrixMultiply` post-multiplies, matching canvas accumulation. |
| 5 | gradient/pattern/shadow resolution & cache lifecycle | **Does not hold.** Group-level gradients resolve against the *previously drawn element's* box → finding **3**. Pattern cache is global and outlives the context that made it → finding **11**. A fresh `CanvasGradient` is allocated per element per frame → finding **12**. `shadowBlur`/`filter` do not scale with DPR → finding **10** (SUSPECTED). |
| 6 | text metrics & text-along-path | **Does not hold.** Glyphs are placed at their mid-point but drawn with `textAlign: 'start'` → half-glyph drift, finding **6**. `measureText` drops the context's `textAlign`/`textBaseline` → finding **7**. |
| 7 | hit testing (isPointInPath/Stroke, DPR, world transform) | **Path/DPR/world mapping HOLDS.** Stroke hit testing does not: it runs with the *residual* line style (`lineWidth === 1`), never the element's → finding **4**. DPR is frozen at module load → finding **8**. |
| 8 | `export()` | **Holds** (snapshot-on-call, guards zero-size). Two nits: `toURL()` never revokes its object URL; on a context hit by finding **1** it exports a blank 300×150. |
| 9 | `destroy()` cleanup & leak surface | **Does not hold.** `renderedElements`/`renderElement` retain the whole element graph, which retains the context back (`Element.context`); the canvas backing store is not released; module-level pattern/gradient caches are never pruned → finding **11**. |

---

# Findings

## SEED LEAD — verified and characterised

### 1a. `_fillCSS` / `_strokeCSS` are not part of the save/restore stack (CONFIRMED)

**Location** — `packages/canvas/src/mixins.ts:152-153` (fields), `:155-157` / `:159-169` (fill
get/set), `:299-301` / `:303-313` (stroke get/set), `:341-348` (`restore`).

**Defect** — `restore()` rolls the native `fillStyle`/`strokeStyle` back via `this.context.restore()`
but leaves the plain instance fields `_fillCSS`/`_strokeCSS` holding the inner scope's value, so the
public `context.fill` / `context.stroke` getters report a paint the context is not using.

**Failure scenario** (executed):

```
ctx.fill = '#ff0000';   // _fillCSS='#ff0000', native fillStyle='#ff0000'
ctx.save();
ctx.fill = '#0000ff';   // _fillCSS='#0000ff', native fillStyle='#0000ff'
ctx.restore();          // native fillStyle back to '#ff0000'
ctx.fill                // -> '#0000ff'   WRONG (native is '#ff0000')
```

Worse variant, also executed — the getter can never return to the native default once written
inside any scope:

```
ctx.save(); ctx.fill = '#123456'; ctx.restore();
ctx.fill                // -> '#123456'   WRONG; the outer scope never had this value
```

Identical behaviour for `stroke` (`:299-313`).

**Blast radius — the real answer.** I grepped the whole monorepo (all `.ts`/`.vue`, including
`packages/charts`, `packages/devtools`, `apps/website`) for reads of these getters:

* **No product code reads `Context.fill` or `Context.stroke`.** The only reads are in tests:
  `packages/canvas/test/context.test.ts:74,85` and `packages/core/test/context/context.test.ts:105,114`.
* The only `Context`-getter read anywhere in element code is
  `packages/core/src/elements/polyline.ts:362-363` (`context.lineDash` / `lineDashOffset`), which the
  mixin maps to genuine native state (`:227-241`) and is therefore correctly restored.
* The render pipeline only ever *writes* paint — `CONTEXT_OPERATIONS`
  (`packages/core/src/core/constants.ts:34-65`) is setters-only; `Element.render`
  (`element.ts:889-895`) and `Context.applyGroupPaint` (`context.ts:545-557`) read the *element's*
  state, never the context's.

**Conclusion: this is a lying getter, not a rendering bug.** No pixel is currently wrong because of
it. It is a latent API-contract defect: the first consumer (or a future backend/devtools inspector)
that reads `context.fill` after a `restore()` gets a wrong answer, and it silently invalidates the
"getter mirrors the drawing state" contract the base class documents at
`packages/core/src/context/context.ts:145-152`. Note the fields exist for a real reason — once a
gradient/pattern is set, `context.fillStyle` is a `CanvasGradient`/`CanvasPattern` object and
`as string` would be a different lie — so the fix must be stack-aware (push/pop the two strings
inside the overridden `save`/`restore`, or store them in a `BaseState`-shaped stack), not a deletion.

**Severity: low** (medium if a consumer starts reading it — it is public API).

**Test sketch** (needs a stub whose `restore()` actually rolls state back):

```ts
test('fill getter tracks the restored native paint', () => {
    const ctx = createContext(host);          // stateful stub
    ctx.fill = '#ff0000';
    ctx.save();
    ctx.fill = '#0000ff';
    ctx.restore();
    expect(ctx.fill).toBe('#ff0000');         // fails today: '#0000ff'
});

test('a paint set only inside a scope does not survive the restore', () => {
    const ctx = createContext(host);
    ctx.save(); ctx.fill = '#123456'; ctx.restore();
    expect(ctx.fill).toBe('#000000');         // fails today: '#123456'
});
```

### 1b. Same lines: `ctx.fill = ''` is a silent no-op that then unmasks the native value (CONFIRMED by trace)

`mixins.ts:159-169` — an empty string is neither a gradient nor a pattern, so it takes
`this.context.fillStyle = ''`, which native canvas **ignores** (invalid CSS colour). `_fillCSS` is
then `''`, so the `||` in the getter falls through to the *stale* native value. Setting an element's
fill to `''` therefore neither clears the paint nor reports the failure. **Severity: low.**

---

## State-stack / clip

### 2. A top-level `clip: true` shape leaks one native `save()` per frame; two or more corrupt the next frame's `clear()` (CONFIRMED)

**Location** — `packages/canvas/src/mixins.ts:336-348` (`save`/`restore`), interacting with
`packages/core/src/context/context.ts:502-513` (`batch`),
`packages/core/src/core/shape.ts:157-160,170` (`clip` ⇒ `skipRestore`) and
`packages/core/src/core/element.ts:899-901`.

**Defect** — a clipping shape deliberately skips its own `restore()` so the clip persists to later
siblings; `Context.popGroup` (`context.ts:565-571`) is what absorbs that dangling save. A clip shape
added **directly to the `Scene`** has no enclosing `pushGroup`, so nothing absorbs it: `batch()`'s
single `restore()` pops the *clip element's* save and leaves `batch()`'s own save outstanding
forever. Net **+1 outstanding native `save()` per clip shape per frame**, unbounded.

**Failure scenario** (executed):

```
scene.add(createRect({ clip: true, ... }));   // one clip shape at scene root
5 x scene.render()  ->  outstanding native saves: [1, 2, 3, 4, 5]
```

With **two** top-level clip shapes it stops being a pure leak and becomes visible corruption,
because the leftover state is a *transformed, clipped* state and `batch()` calls `clear()`
**before** `save()` (`context.ts:503-505`):

```
scene.add([
    createRect({ clip: true, translateX: 40 }),
    createRect({ clip: true, translateY: 25 }),
]);
frame 1 clear(): CTM [1,0,0,1, 0,0]  active clips 0
frame 2 clear(): CTM [1,0,0,1,40,0]  active clips 1   <- clears the wrong rect, masked
frame 3 clear(): CTM [1,0,0,1,80,0]  active clips 2   <- drift grows every frame
outstanding native saves after 3 frames: 6
```

That is progressive ghosting/trails plus an unbounded browser-side canvas state stack (60 fps ⇒
~7 200 stacked states per minute). In-repo usage is currently safe — the only `clip: true` producer
is `packages/charts/src/components/annotation.ts:172`, which always sits inside a group — so this is
reachable only through the public element API today.

**Severity: high** (unbounded leak + visible corruption; latent for chart users, live for direct
`@ripl/core` consumers).

**Test sketch:**

```ts
test('a top-level clip shape does not leak native saves', async () => {
    const scene = createScene(ctx);
    scene.add(createRect({ id: 'c', x: 0, y: 0, width: 50, height: 50, clip: true }));
    await flushGraphRebuild();                     // Scene rebuilds on rAF
    for (let i = 0; i < 5; i++) scene.render();
    expect(nativeSaveDepth()).toBe(0);             // fails today: 5
});
```

### 3. A clip shape's transform *and* paint leak onto its later siblings (CONFIRMED)

**Location** — `packages/core/src/core/element.ts:885-901` reached from
`packages/core/src/core/shape.ts:170` (`}, this.clip)`), applied on canvas via
`mixins.ts:358-378`.

**Defect** — `skipRestore` suppresses the *whole* `restore()`, not just the clip. Everything
`Element.render` applied before the callback — `applyElementTransform` **and** every
`CONTEXT_OPERATIONS` write (opacity, fill, lineWidth, filter, shadow…) — stays in force for every
later sibling in the group.

**Failure scenario** (executed) — group containing `[clipRect{translateX:100, opacity:0.25},
siblingRect{fill:'#f00'}]`:

```
sibling CTM:         [1,0,0,1,100,0]   (expected [1,0,0,1,0,0])
sibling globalAlpha: 0.25              (expected 1)
```

So a transformed clip mask silently shifts every subsequent sibling by its own translate, and a
clip rect that happens to carry an opacity dims the whole rest of the group.

**Severity: medium** (silent, geometry-corrupting; only bites when the clip shape carries a
transform/paint, which is easy to do by accident).

**Test sketch:**

```ts
test('a clip shape does not leak its transform to later siblings', async () => {
    const group = createGroup();
    group.add([
        createRect({ id: 'clip', clip: true, translateX: 100, x: 0, y: 0, width: 100, height: 100, zIndex: 0 }),
        createRect({ id: 'sib', fill: '#f00', x: 0, y: 0, width: 10, height: 10, zIndex: 1 }),
    ]);
    scene.add(group);
    await flushGraphRebuild();
    scene.render();
    expect(ctmAtLastFill()).toEqual([1, 0, 0, 1, 0, 0]);   // fails today: [1,0,0,1,100,0]
});
```

---

## Gradients / paint resolution

### 4. A group's gradient fill resolves its bounds against the *previously drawn element* (CONFIRMED)

**Location** — `packages/canvas/src/mixins.ts:159-169` and `:332-334`
(`gradientBounds() => this.currentRenderElement?.getBoundingBox?.(true)`), driven by
`packages/core/src/context/context.ts:526-538` (`pushGroup`) → `:545-557` (`applyGroupPaint`).

**Defect** — canvas bakes gradient geometry at **set** time. `pushGroup` never assigns
`currentRenderElement`, so when `applyGroupPaint` writes the group's inherited `fill`, the
"current render element" is still whatever leaf was drawn last (or `undefined` on the first group
of a pass). The gradient's coordinates therefore come from an unrelated element's box — and because
the group's paint is what descendants *inherit* (`shape.ts:163` uses `getComputedValue('fill')`),
none of them ever re-resolves it.

**Failure scenario A** (executed) — scene = `[leafRect(0,0,10,10), group{fill: 'linear-gradient(90deg,#f00,#00f)'} → childRect(200,100,100,50)]`:

```
createLinearGradient(0, 5, 10, 5)          <- the LEAF's box
expected createLinearGradient(200, 125, 300, 125)   <- the group's content box
```

The child renders effectively single-colour (it sits 190px past the end of a 10px-wide ramp).

**Failure scenario B** (executed) — the same group as the *first* thing in the scene:

```
createLinearGradient(0, 150, 400, 150)     <- full-surface fallback (getGradientBounds, gradient/bounds.ts:40-45)
```

so the ramp spans the whole canvas instead of the group. Both are wrong, in different directions,
and both are non-deterministic w.r.t. sibling order. SVG does not have this: it re-resolves the
gradient per element at draw time (`packages/svg/src/context.ts:633,644`), so the two backends
render the same scene differently.

**Severity: high** (silent, visible mis-paint; ordering-dependent).

**Test sketch:**

```ts
test('a group gradient resolves against the group, not the previous sibling', async () => {
    scene.add([
        createRect({ id: 'leaf', x: 0, y: 0, width: 10, height: 10, fill: '#000', zIndex: 0 }),
        withChild(createGroup({ zIndex: 1, fill: 'linear-gradient(90deg,#f00,#00f)' }),
                  createRect({ x: 200, y: 100, width: 100, height: 50 })),
    ]);
    await flushGraphRebuild();
    scene.render();
    expect(lastCreateLinearGradientArgs()).toEqual([200, 125, 300, 125]);  // fails: [0,5,10,5]
});
```

*(Minimal fix direction: have `pushGroup` set `currentRenderElement = group` around
`applyGroupPaint`, or make the canvas `fill`/`stroke` setters lazy so the gradient is materialised
at `applyFill`/`applyStroke` time against the element actually being painted.)*

---

## Hit testing

### 5. `isPointInStroke` runs with the residual line style, never the element's (CONFIRMED)

**Location** — `packages/canvas/src/mixins.ts:412-418` →
`packages/canvas/src/utilities.ts:336-338` (`ctx.isPointInStroke(path.ref, x, y)`), called from
`packages/core/src/core/shape.ts:48,123-135`.

**Defect** — native `isPointInStroke` strokes the path using the context's *current*
`lineWidth`/`lineCap`/`lineJoin`/`miterLimit`/dash. Hit tests happen outside a render pass, at which
point `batch()`'s trailing `restore()` (`context.ts:511`) has rolled the line style back to the
pre-frame value — i.e. the canvas default `lineWidth === 1`. Nothing re-applies the element's stroke
width before testing.

**Failure scenario** (executed) — a rect with `lineWidth: 24, pointerEvents: 'stroke'`, rendered,
then hit-tested:

```
native lineWidth after the frame: 1
native lineWidth at isPointInStroke: 1   (expected 24)
```

Real-world impact: `packages/charts/src/charts/sankey.ts:499` creates every Sankey link with
`pointerEvents: 'stroke'` and `lineWidth: link.width` (the ribbon thickness, routinely 10–100 px).
On canvas those ribbons are only hoverable within ~1 CSS px of their centreline; on SVG they work,
because `SVGContext._isPointIn` (`packages/svg/src/context.ts:343-354`) delegates to the DOM element
which carries its own `stroke-width`. Same class of error for any thin-stroke element
(`lineWidth < 1` over-hits) and for `pointerEvents: 'all'` elements with no fill (lines/polylines),
where `isPointInStroke` is the only test that can succeed (`shape.ts:123-126`).

**Severity: high** (interaction silently broken for stroke-hit elements; backend divergence).

**Test sketch:**

```ts
test('stroke hit testing uses the element line width', async () => {
    const rect = createRect({ x: 10, y: 10, width: 100, height: 100,
                              stroke: '#f00', lineWidth: 24, pointerEvents: 'stroke' });
    scene.add(rect); await flushGraphRebuild(); scene.render();
    const widths: number[] = [];
    spyOnNative('isPointInStroke', () => widths.push(native.lineWidth));
    rect.intersectsWith(10, 10, { isPointer: true });
    expect(widths[0]).toBe(24);                 // fails today: 1
});
```

### 6. What *does* hold in hit testing (verified)

* **World-transform mapping** — `shape.ts:104-117` inverts `getWorldTransform()` and applies the
  `/dpr … *dpr` round trip; native `isPointInPath(path2d, x, y)` transforms the Path2D by the CTM
  (which is the DPR matrix at rest) and treats `x,y` as untransformed device coordinates. The two
  agree. **Correct.**
* **Transform composition** — verified numerically: native CTM at draw time ==
  `DPR · child.getWorldTransform()` for a scaled+translated group containing a rotated+translated
  child. **Correct.**
* **Sub-pixel DPR skew (SUSPECTED, low)** — `DOMContext` maps pointer coords with
  `scaleX = scaleContinuous([0,width],[0,floor(width*dpr)])` (`utilities.ts:251`) while
  `Element.intersectsWith` divides by the exact `scaleDPR(1)` (`element.ts:834`). When
  `width*dpr` is not an integer these disagree by up to `dpr/width` per pixel (≈0.3 px at the far
  edge of a 300 px canvas). Not reproduced; arithmetic only.

---

## Sizing / DPR

### 7. A container whose device size matches the canvas default leaves the context completely uninitialised (CONFIRMED)

**Location** — `packages/canvas/src/utilities.ts:231-254` (`rescaleCanvas`) and
`packages/canvas/src/context.ts:51-62` (`CanvasContext.rescale`).

**Defect** — `rescaleCanvas` early-returns `undefined` when `floor(width*dpr) === canvas.width &&
floor(height*dpr) === canvas.height`, and `CanvasContext.rescale` then returns **before**
`super.rescale(width, height)`. A brand-new `<canvas>` defaults to **300×150**, so at `dpr === 1`
any container measuring `300×150` (or anything in `[300,301) × [150,151)`) short-circuits on the
very first `init()`: `this.width`/`this.height` stay `0`, `scaleX`/`scaleY` stay the degenerate
`[0,0]→[0,0]` scales from the `Context` constructor (`context.ts:413-414`), and no `resize` is
emitted.

**Failure scenario** (executed) — host element 300×150, `devicePixelRatio: 1`:

```
ctx.width / ctx.height : 0 / 0        (canvas backing store: 300 x 150)
ctx.scaleX(150)        : 0            -> every pointer coordinate collapses to 0
ctx.clear()            : clearRect(0, 0, 0, 0)   -> nothing is ever cleared -> full-frame ghosting
```

Downstream: `getGradientBounds` falls back to a `0×0` surface, `Scene.width/height` report 0, and
`export()` returns a blank 300×150. `300×150` is a very common explicit chart-container size, and
the failure is total (garbage rendering) rather than degraded.

**Severity: high** (total failure, plausible trigger).

**Test sketch:**

```ts
test('a 300x150 container at dpr 1 still initialises the context', () => {
    mockElementSize(300, 150);
    const ctx = createContext(host);
    expect([ctx.width, ctx.height]).toEqual([300, 150]);   // fails today: [0, 0]
    ctx.clear();
    expect(nativeClearRectArgs()).toEqual([0, 0, 300, 150]); // fails today: [0,0,0,0]
});
```

### 8. `reset()` silently discards the DPR transform and desynchronises `saveDepth` (CONFIRMED)

**Location** — `packages/canvas/src/mixins.ts:354-356`.

**Defect** — `this.context.reset()` resets the native context to defaults: it clears the state
stack, the clip, **and the transform**. The DPR matrix installed by `rescaleCanvas`
(`utilities.ts:248`) is thrown away and never reinstalled, and `Context.saveDepth` keeps counting
saves the native stack no longer holds.

**Failure scenario** (executed):

```
ctx.save(); ctx.save();  -> native stack depth 2, saveDepth 2
ctx.reset();             -> native stack depth 0, saveDepth 2   (desynced)
                         -> CTM back to identity (was [dpr,0,0,dpr,0,0])
```

After `reset()` on a 2× display everything renders at half size in the top-left quadrant, and the
next two `restore()` calls decrement `saveDepth` while doing nothing natively — so a later
`popGroup()` unwinds to the wrong depth and paint leaks between groups. The same state-stack
desync occurs on every resize, because assigning `canvas.width` inside `rescaleCanvas`
(`utilities.ts:245-246`) also clears the native stack while `saveDepth` is untouched (harmless at
`saveDepth === 0`, compounding once finding **2** is active).

**Severity: medium** (`reset()` is public API; the resize path is only harmful in combination).

**Test sketch:**

```ts
test('reset() restores the DPR transform and zeroes saveDepth', () => {
    factory.set({ devicePixelRatio: 2 });
    const ctx = createContext(host);
    ctx.save(); ctx.save();
    ctx.reset();
    expect(nativeMatrix()).toEqual([2, 0, 0, 2, 0, 0]);       // fails today: identity
    expect((ctx as any).saveDepth).toBe(0);                   // fails today: 2
});
```

### 9. `resize` is emitted with stale `scaleX`/`scaleY` (CONFIRMED)

**Location** — `packages/canvas/src/context.ts:51-62`. `super.rescale()`
(`packages/core/src/context/context.ts:417-425`) installs *identity* scales and emits `resize`
**before** `CanvasContext.rescale` overwrites them with the DPR-aware ones on lines 60-61.

**Failure scenario** (executed, `dpr = 2`, resize to 800×600):

```
inside the resize handler: ctx.scaleX(100) === 100     (identity)
immediately after:         ctx.scaleX(100) === 200     (correct)
```

`Scene`'s own resize handler (`scene.ts:162-169`) calls `render()` synchronously inside that window,
and any user handler that reads `context.scaleX/scaleY` (or hit-tests) gets the identity mapping.

**Severity: low** (narrow window; drawing itself uses the CTM, not the scales).

**Test sketch:** subscribe to `resize`, capture `ctx.scaleX(100)` inside the handler, assert it
equals `ctx.scaleX(100)` after the call returns.

### 10. `factory.devicePixelRatio` is frozen at module load, so the canvas never re-rasterises after a zoom/monitor change (CONFIRMED)

**Location** — `packages/web/src/index.ts:82-84` (`get devicePixelRatio() { return window.devicePixelRatio; }`)
passed to `factory.set`, which spreads it at `packages/core/src/core/factory.ts:91-94`
(`{ ...this._state, ...options }`). Object spread **invokes** the getter once and stores the number.

**Failure scenario** (executed against `Factory` directly): after `factory.set({ get devicePixelRatio() { return live; } })`
and `live = 3`, `factory.devicePixelRatio` still reads `1`.

Consequence for this package: `rescaleCanvas` (`utilities.ts:237`) and
`Context.scaleDPR` (`context.ts:412`) both consume that frozen value, so a browser zoom or a drag to
a different-DPI monitor leaves the backing store at the old ratio — a permanently blurry (or
over-sampled) chart. Compounding: `scaleDPR` is captured once in the constructor and never
refreshed on rescale, so if an application *does* call `factory.set({ devicePixelRatio })` at
runtime, `scaleX`/`scaleY` (recomputed) and `scaleDPR` (stale) disagree and hit testing shifts.

**Severity: medium** (visible blur; the fix is outside `packages/canvas`, but canvas is the only
consumer that cares).

**Test sketch:** `factory.set({ get devicePixelRatio() { return live; } }); live = 3;
expect(factory.devicePixelRatio).toBe(3);`

---

## Group compositing

### 11. A child's own opacity replaces the group's composited alpha instead of multiplying (CONFIRMED)

**Location** — `packages/core/src/core/constants.ts:40`
(`opacity: basicContextSetter('opacity')` — an assignment) versus
`packages/core/src/context/context.ts:532-537` (`this.opacity *= opacity` for groups), landing on
`packages/canvas/src/mixins.ts:203-209` (`globalAlpha`).

**Failure scenario** (executed) — `group{opacity: 0.5}` containing `rect{opacity: 0.5, fill:'#f00'}`:

```
globalAlpha at the child's fill: 0.5     (expected 0.25)
```

Nested *groups* compound correctly (`pushGroup` multiplies); only leaves clobber. SVG does not have
this: `SVGContext.pushGroup` stamps the opacity on the `<g>` and zeroes `currentState.opacity`
(`packages/svg/src/context.ts:536-542`), so the DOM multiplies — the two backends render the same
scene at different alphas.

**Severity: medium** (visible, cross-backend divergence).

**Test sketch:** as above — assert `globalAlpha === 0.25` at the child's `fill()`.

### 12. Group `globalCompositeOperation` is applied per-child, not to the group as a unit (SUSPECTED, by trace)

`applyGroupPaint` (`context.ts:545-557`) pushes the group's blend mode onto the context, so each
descendant blends against the backdrop independently. True group compositing needs an offscreen
layer. SVG's `<g mix-blend-mode>` composites the subtree. Not reproduced (needs pixels).
**Severity: low** (design limitation; worth documenting).

---

## Text

### 13. Text along a path is offset by half a glyph under any non-`center` `textAlign` (CONFIRMED)

**Location** — `packages/canvas/src/utilities.ts:257-285` (`renderTextAlongPath`).

**Defect** — line 264 computes `midDistance = distance + charWidth / 2` and translates the context
to that **mid-point** (`:272-274`), but the glyph is then drawn at `(0,0)` (`:277`) using whatever
`textAlign` the context carries. That geometry is only correct for `textAlign: 'center'`; the canvas
default is `'start'`, so every glyph is pushed forward along the path by half its own advance.

**Failure scenario** (executed) — content `'AB'`, 10 px glyphs, straight 1000-unit path,
`textAlign: 'start'`:

```
translate(5, 0);  fillText('A', 0, 0)   -> 'A' occupies 5..15   (should be 0..10)
translate(15, 0); fillText('B', 0, 0)   -> 'B' occupies 15..25  (should be 10..20)
```

The whole string is shifted forward by half a glyph, and the shift varies per glyph for
proportional fonts. SVG `<textPath>` (`packages/svg/src/text.ts:46-62`) places glyphs by advance, so
the backends disagree. Related, same function: `element.maxWidth` is ignored, `startOffset` is not
clamped (a negative value stacks the leading glyphs at the path start, because `samplePathPoint`
clamps), and the loop `break`s on the first overflowing glyph.

**Severity: medium** (visible mis-placement wherever `pathData` text is used).

**Test sketch:**

```ts
test('glyphs are placed at their advance offset, not their mid-point', () => {
    stubPathLength(1000);
    renderTextAlongPath(native, new ContextText({ x: 0, y: 0, content: 'AB', pathData: 'M0,0 L1000,0' }), 'fill');
    expect(translateLog()).toEqual(['translate(0,0)', 'translate(10,0)']);   // fails: 5,15
});
```

*(Either set `ctx.textAlign = 'center'` for the duration of the run, or translate to
`distance` instead of `midDistance`.)*

### 14. `measureText` drops the context's `textAlign`/`textBaseline`, and its `context` option is dead (CONFIRMED)

**Location** — `packages/canvas/src/mixins.ts:380-382` →
`packages/canvas/src/utilities.ts:323-328`.

**Defect** — `canvasMeasureText` forwards `{ context: ctx, font }` only. `actualBoundingBoxLeft/Right`
are anchor-relative (they shift with `textAlign`) and `actualBoundingBoxAscent/Descent` shift with
`textBaseline`, so measurements taken through the context are wrong whenever it is not at the
defaults. Separately, **no factory implementation consumes `MeasureTextOptions.context`** —
`domMeasureText` (`packages/web/src/index.ts:63-73`) measures on its own cached ref canvas and
`nodeMeasureText` (`packages/node/src/index.ts:54`) ignores options entirely — so passing the live
context is a no-op that reads as if it were meaningful.

**Failure scenario** (executed): `ctx.font = '20px serif'; ctx.textAlign = 'center';
ctx.measureText('hello')` forwards `{ context: <ctx>, font: '20px serif' }` — no `textAlign` — so
the result reports `actualBoundingBoxLeft: 0, actualBoundingBoxRight: width` instead of
`±width/2`. `Element._getLocalBoundingBox` for `Text` (`packages/core/src/elements/text.ts:98-102`)
is unaffected because it calls the core `measureText` with explicit alignment; the defect is
confined to consumers of `context.measureText`, e.g. `Renderer._renderDebugOverlay`
(`renderer.ts:415-419`).

**Severity: low.**

**Test sketch:** spy on `factory.measureText`; assert the options object forwarded by
`ctx.measureText('hello')` contains `textAlign: 'center'` after `ctx.textAlign = 'center'`.

### 15. `renderTextAlongPath` re-parses the SVG path once per glyph (SUSPECTED perf, by trace)

`utilities.ts:262-284` calls `samplePathPoint` per character; each call does
`setAttribute('d', …)` + `getTotalLength()` + 3 × `getPointAtLength()` on a shared ref
`<path>` (`packages/core/src/math/geometry.ts:201-213`), plus one `getPathLength` up front. That is
O(chars) full path re-parses **per text element per frame**. **Severity: low** (perf only).

---

## Lifecycle / leaks

### 16. `destroy()` retains the whole element graph, the backing store, and cached patterns (CONFIRMED)

**Location** — `packages/canvas/src/context.ts` (no `destroy` override) →
`packages/dom/src/context.ts:304-308` → `packages/core/src/context/context.ts:708-711`.

**Defect** — nothing clears the render/interaction state:

* `renderedElements` and `renderElement` still hold every element that was drawn
  (executed: `renderedElements.length === 1` and `renderElement` truthy **after** `ctx.destroy()`).
  Each of those elements holds `this.context = context` (`element.ts:878`), so the context and the
  entire scene graph keep each other alive as long as anything references either.
* `_getTrackedElements`'s memoize cache (`context.ts:671-673`) is not cleared
  (`invalidateTrackedElements()` is never called from `destroy`).
* The `<canvas>` is removed from the DOM but `this.element` / `this.context` still reference it;
  its backing store (`width × height × 4` bytes — 7.7 MB at 1600×1200) is only freed at GC. The
  standard release (`canvas.width = canvas.height = 0`) is not done.
* Module-level `patternCache` (`utilities.ts:105`) retains `CanvasPattern` objects **created by the
  destroyed context**, together with their offscreen tile canvases, and is never pruned. Executed:
  after `first.destroy()`, a brand-new context asking for the same pattern string gets the old
  object back with **zero** `createPattern` calls on its own context. Same for `gradientCache`
  (`utilities.ts:85`) — bounded to 256 but never scoped to a context or cleared on teardown.
* `export().toURL()` (`packages/dom/src/export.ts:51`) mints an object URL that is never revoked.

**Severity: medium** (leaks scale with scene size and context churn — SPA route changes, dashboards
that rebuild charts).

**Test sketch:**

```ts
test('destroy() releases the rendered element list', async () => {
    scene.add(createRect({ id: 'r', x: 0, y: 0, width: 10, height: 10, fill: '#f00' }));
    await flushGraphRebuild(); scene.render();
    ctx.destroy();
    expect(ctx.renderedElements).toHaveLength(0);   // fails today: 1
    expect(ctx.renderElement).toBeUndefined();      // fails today: the rect
});
```

### 17. A fresh `CanvasGradient` is allocated per element per frame (CONFIRMED, perf)

**Location** — `packages/canvas/src/mixins.ts:163-165` → `utilities.ts:187-193` →
`toCanvasGradient` (`utilities.ts:68-81`). `parseGradientMemoized` (`:88-101`) memoises only the
*parse*; the native object is rebuilt every time `fill`/`stroke` is assigned.

**Failure scenario** (executed): 5 gradient-filled rects × 2 frames ⇒ **10** `createLinearGradient`
calls plus 20 `addColorStop` calls. At 60 fps with 500 gradient elements that is 30 000
`CanvasGradient` allocations per second. A `(gradientString, bounds)` keyed cache would collapse
this. **Severity: low** (perf only; no wrong pixels).

---

## Cross-cutting / pipeline

### 18. `Element.render` wipes the element it just registered when called at render depth 0 (CONFIRMED)

**Location** — `packages/core/src/core/element.ts:878-881`:

```ts
context.currentRenderElement = this;   // pushes into renderedElements (context.ts:137-143)
context.markRenderStart();             // if renderDepth === 0 -> renderedElements = []  (context.ts:488-494)
```

**Failure scenario** (executed) — a direct `rect.render(ctx)` (no `scene.render()` / `batch`):

```
ctx.renderedElements -> []      (the rect was pushed, then wiped)
```

so the element is drawn but can never be hit-tested. The normal path is safe because `batch()`
raises `renderDepth` to 1 first (`context.ts:505`), but `Element.render` and `Group.render` are
public. **Severity: low.** *Fix: swap the two lines.*

**Test sketch:** `rect.render(ctx); expect(ctx.renderedElements.map(e => e.id)).toEqual(['r']);`

### 19. Group/render bookkeeping is not exception-safe (SUSPECTED, by trace)

`Group.render` (`group.ts:194-207`) and the instruction loops in `Scene.render`
(`scene.ts:270-274`) / `Renderer._renderBuffer` (`renderer.ts:355-373`) have no `try/finally` around
`pushGroup`/`popGroup`. A throw inside a child leaves `Context._groupDepthStack` (`context.ts:79`)
permanently unbalanced, so every subsequent `popGroup()` unwinds to a stale depth and paint/clip
leak between groups for the rest of the session. `_groupDepthStack` is also never cleared by
`reset()` or `destroy()`. **Severity: low** (needs a throwing element).

### 20. `canvasDrawImage` silently ignores a width given without a height (CONFIRMED, by trace)

`packages/canvas/src/utilities.ts:314-320` — `if (width && height)`. `drawImage(img, x, y, 200)`
falls through to the 3-argument form and draws at natural size; `width: 0` (a legitimate degenerate)
does the same. **Severity: low.**

### 21. `packages/test-utils/src/canvas.ts:99` structurally hides this whole class of bug (CONFIRMED)

`mockCanvasContext`'s `save`/`restore` are bare `vi.fn()` no-ops and it has no CTM. Consequently
`packages/canvas/test/context.test.ts:132-140` ("save and restore delegate without throwing") can
never observe finding **1**, and no existing test can observe findings **2**, **3**, **5** or **8**.
Any fix for those needs a stateful stub (a real state stack + a 2×3 matrix) added to
`@ripl/test-utils` first. **Severity: medium** (test-infrastructure gap, not a runtime bug).

---

## Things that were checked and are correct

* Transform composition/ordering on canvas matches `MatrixTransformTarget`, and the native CTM at
  draw time equals `DPR · getWorldTransform()` (verified numerically for a nested group + rotated
  child). `applyElementTransform`'s origin round-trip (`transform.ts:91-103`) is symmetric.
* `saveDepth` accounting inside the mixin is correct: `save` increments, `restore` guards
  `saveDepth === 0` and never over-pops the native stack.
* The `currentState` / `states` bypass is **harmless on canvas**: every `BaseState` accessor except
  `zIndex` is overridden by the mixin, `zIndex` is written by `CONTEXT_OPERATIONS` but never read on
  this path (only `packages/svg/src/context.ts:322` reads it), and `pushGroup`/`popGroup`/`layer`/
  `batch`/`applyGroupPaint` touch only `saveDepth` and the overridden accessors.
* `markRenderStart`/`markRenderEnd` are balanced in `batch`, `Element.render` (`finally`) and
  `Group.render`; nothing in the canvas backend reads `renderDepth`.
* `popGroup` correctly absorbs the dangling `save()` of a group-scoped clip (verified: no leak for a
  clip inside a group — the leak in finding **2** is specific to the scene root).
* `isPointInPath` fill hit testing, the DPR round trip, and the world-transform inverse mapping all
  agree with native `isPointInPath` semantics.
* `CanvasPath` overrides every drawing primitive it needs; the one base method it does *not*
  override, `ContextPath.polyline` (`packages/core/src/context/path.ts:81-86`), is implemented in
  terms of `moveTo`/`lineTo` and therefore dispatches correctly.
* `export()` snapshots the pixels at call time onto a detached canvas, so later frames cannot
  mutate an already-returned exporter, and it guards zero-size canvases.
* `supportsPathCaching = true` is safe: `Shape2D` always allocates a fresh `CanvasPath` when it
  re-traces, so `Path2D` commands never accumulate.

---

## Ranked summary

| Rank | Finding | Severity | Status |
|------|---------|----------|--------|
| 1 | **#7** `rescaleCanvas` no-ops on a 300×150 @ dpr 1 container → `width/height = 0`, degenerate scales, `clearRect(0,0,0,0)`, total render failure (`canvas/src/utilities.ts:241`) | **high** | CONFIRMED |
| 2 | **#5** `isPointInStroke` uses the residual `lineWidth` (1), never the element's → thick-stroke elements (all Sankey links) are unhoverable (`canvas/src/mixins.ts:412`, `utilities.ts:336`) | **high** | CONFIRMED |
| 3 | **#4** Group gradient fills resolve bounds against the previously drawn element (or the full surface) (`canvas/src/mixins.ts:159-169,332-334` + `core/context.ts:526-538`) | **high** | CONFIRMED |
| 4 | **#2** Top-level `clip: true` shape leaks one native `save()` per frame; ≥2 corrupt the next frame's `clear()` with a drifting CTM and stacked clips (`canvas/src/mixins.ts:336-348` + `core/context.ts:502-513`) | **high** | CONFIRMED |
| 5 | **#3** A clip shape's transform and paint leak onto later siblings (`core/element.ts:899` + `core/shape.ts:170`) | medium | CONFIRMED |
| 6 | **#13** Text-along-path is offset by half a glyph under the default `textAlign` (`canvas/src/utilities.ts:264-277`) | medium | CONFIRMED |
| 7 | **#11** A child's opacity replaces rather than multiplies the group's alpha (`core/constants.ts:40` + `canvas/src/mixins.ts:203-209`) | medium | CONFIRMED |
| 8 | **#16** `destroy()` retains the element graph, the backing store and cached patterns (`canvas/src/context.ts`, `canvas/src/utilities.ts:105`) | medium | CONFIRMED |
| 9 | **#8** `reset()` discards the DPR transform and desyncs `saveDepth` (`canvas/src/mixins.ts:354-356`) | medium | CONFIRMED |
| 10 | **#10** `factory.devicePixelRatio` frozen at module load → no re-rasterisation on zoom/monitor change (`web/src/index.ts:82` + `core/factory.ts:91`) | medium | CONFIRMED |
| 11 | **#21** `mockCanvasContext` has no-op `save`/`restore`, hiding this entire defect class from the suite (`test-utils/src/canvas.ts:99`) | medium | CONFIRMED |
| 12 | **#1a/#1b** `_fillCSS`/`_strokeCSS` are outside the save/restore stack → `context.fill`/`context.stroke` lie after any `restore()`; `fill = ''` is a silent no-op (`canvas/src/mixins.ts:152-169,299-313`) — **no product code reads these getters, so no pixel is wrong today** | low | CONFIRMED |
| 13 | **#14** `measureText` drops `textAlign`/`textBaseline`; its `context` option is dead everywhere (`canvas/src/utilities.ts:323-328`) | low | CONFIRMED |
| 14 | **#18** `Element.render` wipes the element it just registered at render depth 0 (`core/element.ts:878-881`) | low | CONFIRMED |
| 15 | **#9** `resize` fires with identity `scaleX`/`scaleY` (`canvas/src/context.ts:58-61`) | low | CONFIRMED |
| 16 | **#17** A fresh `CanvasGradient` per element per frame (`canvas/src/utilities.ts:68-81`) | low | CONFIRMED (perf) |
| 17 | **#15** `renderTextAlongPath` re-parses the SVG path once per glyph (`canvas/src/utilities.ts:262-284`) | low | SUSPECTED (perf) |
| 18 | **#20** `canvasDrawImage` ignores a width supplied without a height (`canvas/src/utilities.ts:315`) | low | CONFIRMED |
| 19 | **#19** `pushGroup`/`popGroup` bookkeeping is not exception-safe (`core/group.ts:194-207`, `core/scene.ts:270-274`) | low | SUSPECTED |
| 20 | **#12** Group `globalCompositeOperation` applies per child, not to the subtree (`core/context.ts:545-557`) | low | SUSPECTED |
| 21 | **#6 (skew)** Sub-pixel disagreement between `scaleX` (floored) and `scaleDPR` (exact) in pointer mapping (`canvas/src/utilities.ts:251` vs `core/element.ts:834`) | low | SUSPECTED |
