# Audit — `@ripl/dom` context layer + `@ripl/node` runtime bindings

**Tree audited:** `/home/user/ripl` @ `8121b9d` — verified `HEAD == main == origin/main` for
`packages/{core,dom,node}` (`git diff --stat origin/main...HEAD` empty). Read-only; no repo file
was modified.

**Out of scope, confirmed present, not reported:** (a) stale `_interactionState.left/top`
— being fixed on `origin/claude/pointer-origin`; (b) `_domCache` retaining descendants of removed
subtrees — being fixed on `origin/claude/svg-commit-model`. I diffed both branches: **neither
touches any finding below.** In particular `claude/svg-commit-model` keeps
`if (childVNode.children.length > 0)` (F3) and the `desiredIds` Set (F5) unchanged.

**Method.** Every finding marked CONFIRMED was reproduced by executing the real code under
`vitest`/`node` against the repo sources (scratch harness outside the repo, now deleted). Findings
marked SUSPECTED were reached by tracing only and are labelled as such.

---

## Checklist coverage

| # | Area | Verdict |
|---|---|---|
| 1 | `DOMContext` interaction | 6 confirmed defects — F2, F4, F6, F7, F8, F9 (+F12) |
| 2 | `hitTest` / memo / z-order | 3 confirmed defects — F1, F10, F11 |
| 3 | **SEED LEAD** `createFrameBuffer` starvation | **REFUTED** — see §Seed Lead. Real defect in the same code is F8 |
| 4 | `vdom.ts` reconciler | 2 confirmed defects — F3, F5 (+F20). Reorder / `getChildId` / `ensureGroupPath` / `getAncestorGroupIds` all verified correct |
| 5 | Resize observation | 2 confirmed — F14, F15; rescale-during-render mechanism confirmed (F13), reachability suspected |
| 6 | `export.ts` | 1 low — F21. Snapshot semantics correct |
| 7 | `navigator.ts` | 4 low/medium — F22, F23, F24, F25. Feature detection + `preventDefault` verified correct |
| 8 | `destroy()` cleanup | F8, F9 confirmed; observers/listeners otherwise fully released; double-destroy unsafe (F19) |
| 9 | `packages/node/src/*` | 4 confirmed — F16, F17, F18, F27 (+F28) |

---

## SEED LEAD — verdict: **NOT REACHABLE. This is a correct throttle, not a starvation.**

`createFrameBuffer` (`packages/core/src/animation/utilities.ts:10-21`) does cancel and reschedule
on every call, and `_handleMouseMove` (`packages/dom/src/context.ts:146`) does drive
`_handleHoverHitTest` through it. But the analogy to `0bc2fc4` does not hold, and I could not
starve it.

**Why `0bc2fc4` was a real starvation and this is not.** The slider used a *relative* deadline:
`clearTimeout(timer); timer = setTimeout(flush, debounce)` pushes the firing time `debounce`ms
into the future *on every event*. A stream faster than 120ms therefore moves the deadline forever
and the trailing edge never arrives. `requestAnimationFrame`'s deadline is **absolute** — every
`cancelAnimationFrame` + `requestAnimationFrame` pair lands in the *same* next rendering
opportunity's callback list. Cancelling N-1 times before that opportunity still leaves exactly one
callback registered when it arrives. The deadline cannot be pushed.

**Measured.** Dispatching 20 synthetic `mousemove`s per frame for 10 frames (≈20× more than any
browser delivers, since Chrome/Firefox/WebKit all rAF-align and coalesce mouse moves to ≤1 per
frame) produced **9 element `mousemove` emissions — one per frame**, not zero. A 200-event
*synchronous* burst with no frame boundary produced exactly 1 callback (the last position), which
is the intended coalescing. Hover fires on every painted frame with the latest pointer position
during a fast drag.

The only way to get zero hover events is to saturate the main thread so no rendering opportunity
occurs at all — in which case rAF, paint, and the drag itself are equally dead, so the frame buffer
is not the cause.

**Residual real defect in this code:** the buffer is *uncancellable* — it returns only a scheduling
function. That is F8 below, and it is genuine.

---

## CONFIRMED findings

### F1 — `hitTest` sorts by additive z-index, which is not paint order across groups — HIGH
`packages/core/src/context/context.ts:689-695`

The comparator sorts hits by `eb.zIndex - ea.zIndex` and only falls back to paint order on ties.
`Element.zIndex` is **additive** (`packages/core/src/core/element.ts:468-470`:
`(parent?.zIndex ?? 0) + (state.zIndex ?? 0)`), while `Scene._collectInstructions`
(`packages/core/src/core/scene.ts:209-234`) paints groups as contiguous stacking contexts. A
descendant's additive z-index therefore says nothing about its position relative to a descendant of
a *different* group. `renderedElements` is already exact paint order, so the z-index sort actively
destroys correct information.

**Failure (measured).** `G1{zIndex:0} > A{zIndex:10}` and `G2{zIndex:5} > B{zIndex:0}`, both under
the scene root, both hit by the pointer, both listening for `click`.
- Paint order: `['a','b']` — B is drawn on top and is what the user sees under the cursor.
- Additive z-index: `a=10`, `b=5`.
- `hitTest(['click'], x, y)` → `['a','b']`, so `hitElements[0]` is **A**.

Every `DOMContext` consumer takes `hitElements[0]` as topmost
(`packages/dom/src/context.ts:125, 196, 256`), so the click/hover lands on the element the user
cannot see. Any chart that layers furniture groups over series groups (grid, annotations, crosshair,
legend all use groups) is exposed.

**Test sketch.** Build the two-group scene above; assert `ctx.renderedElements.map(e => e.id)` is
`['a','b']` and `hitTest(['click'],0,0)[0].id === 'b'`. Then assert the invariant generally: for any
scene, `hitTest` order equals `renderedElements` reversed, filtered to the hits.

---

### F2 — a `mouseup` outside the surface strands the drag permanently — HIGH
`packages/dom/src/context.ts:222-246` (handler), `:287` (attachment site)

`mouseup` is bound to `this.element` only. There is no pointer capture, no window-level fallback,
and `_handleMouseLeave` (`:111-113`) does not touch drag state. A gesture released off-canvas
therefore never clears `state.dragElement` / `state.dragStarted`, and never emits `dragend`.

**Failure (measured).** `mousedown` at (10,10) on a draggable element → two `mousemove`s → pointer
leaves the canvas → button released outside. Re-enter and move with **no button held**: the element
receives `drag` again. Sequence recorded after re-entry: `['drag']`. `dragend` is never emitted, so
any consumer holding drag state (a brush, a navigator handle, a resizable annotation) stays latched
and the shape follows the bare cursor.

**Test sketch.** Dispatch `mousedown` → `mousemove`×2 → `mouseleave`; then `mouseenter` +
`mousemove` and assert no `drag` is emitted and that a `dragend` was emitted at teardown.

---

### F3 — a group that empties keeps its stale DOM children painted — HIGH
`packages/dom/src/vdom.ts:147-149`

`reconcileNode` only recurses `if (childVNode.children.length > 0)`. A vnode whose children all
disappeared is never descended into, so its live DOM children are never removed.

This is reachable in SVG on every empty group: `SVGContext.pushGroup`
(`packages/svg/src/context.ts`) unconditionally emits a `<g>` vnode with `children: []` and fills it
during the pass, so a `Group` whose contents are removed produces exactly this shape.

**Failure (measured).**
```
pass 1 vtree: root > g > [x, y]   DOM: <div id="g"><span id="x"/><span id="y"/></div>
pass 2 vtree: root > g > []       DOM: <div id="g"><span id="x"/><span id="y"/></div>   ← unchanged
```
Concretely: a bar chart whose series is updated to an empty array, or a crosshair/annotation group
that is emptied rather than removed, leaves its last-rendered shapes on screen forever. They are
also still returned by `SVGContext._isPointIn`, so they stay hit-testable.

Related to but distinct from out-of-scope item (b): (b) is about `_domCache` map entries; this is
live DOM nodes that stay *painted*. The `claude/svg-commit-model` fix does not address it — its
`evictDetachedNodes` only runs when `state.removed` is set, and nothing here is removed.

**Test sketch.** Reconcile a populated group vnode, then the same group with `children: []`; assert
`domParent.querySelector('#g').children.length === 0`.

---

### F4 — leaving the surface never emits element-level `mouseleave` — HIGH
`packages/dom/src/context.ts:111-113`, `:191-220`

`_activeElements` is only reconciled inside `_handleHoverHitTest`, which only runs from
`_handleMouseMove`. `_handleMouseLeave` emits the *context* `mouseleave` and nothing else, so an
element that was hovered when the pointer left the canvas stays in `_activeElements` and never
receives its `mouseleave`.

**Failure (measured).** `mouseenter` → `mousemove` over an element → `mouseleave` on the surface →
recorded element events: `['enter']`. No `leave`. This is common in practice: any element touching
the canvas edge (a bar at the plot boundary, a full-bleed background, a legend swatch in the
gutter) is the last thing under the pointer as it exits.

**Impact is visible, not theoretical.** `packages/charts/src/core/interaction.ts:140-152` binds
`tooltip.hide()` **and** the `restore` transition to the element's `mouseleave`. The tooltip is a
scene `Group` (`packages/charts/src/components/tooltip.ts:61,163`), so it stays **painted on the
chart** with the bar left highlighted while the pointer is elsewhere on the page. The cartesian
axis-tooltip is unaffected because it hides on the *context* `mouseleave`
(`packages/charts/src/core/cartesian.ts:1274`) — only the per-element hover path is broken.

**Test sketch.** Hover an element, dispatch `mouseleave` on the surface, assert the element received
`mouseleave` and that `_activeElements` is empty.

---

### F5 — a duplicate id silently deletes one element and reorders the rest — MEDIUM-HIGH
`packages/dom/src/vdom.ts:99` (`desiredIds` Set), `:121-150`

`desiredIds` is a `Set`, and `domCache` is keyed by id, so two sibling vnodes sharing an id resolve
to the **same DOM node**. The second `updateElement` overwrites the first's attributes, the second
recursion overwrites the first's subtree, and the index arithmetic in the reorder step
(`domParent.children[i]`) desynchronises because the DOM has fewer children than the vnode list.

**Failure (measured).** vtree `[dup(red), other(green), dup(blue)]` →
```html
<span id="other" fill="green"></span><span id="dup" fill="blue"></span>
```
Two nodes for three vnodes: the red element vanished entirely, and the surviving order is wrong
(`other` before `dup`, expected `dup, other, dup`).

Reachable because DOM ids come straight from Ripl element ids —
`Shape2D.render` calls `context.createPath(this.id)`
(`packages/core/src/core/shape.ts:150`) and `SVGContext._reconcilerOptions.createElement` stamps
that id onto the node. `Element.id` is caller-supplied (`packages/core/src/core/element.ts:540`),
and charts build ids from data (`packages/charts/src/components/grid.ts:206`,
`annotation.ts:204,245,280`, `navigator.ts:310`), so any duplicate key/tick value in user data
silently drops a mark. There is no uniqueness assertion anywhere.

**Test sketch.** Reconcile a vtree with two sibling vnodes sharing an id and assert
`domParent.children.length === vnode.children.length`; or add a dev-mode duplicate-id assertion in
`reconcileNode` and test it fires.

---

### F6 — `click` fires immediately after a drag on the same gesture — MEDIUM
`packages/dom/src/context.ts:248-261`, `:222-246`

The DOM fires `click` after `mouseup`, and `_handleMouseUp` clears `dragStarted`/`dragElement`
*before* `_handleClick` runs, so nothing records that the gesture was a drag. There is no
suppression flag and no distance check in `_handleClick`.

**Failure (measured).** `mousedown(10,10)` → `mousemove(100,100)` → `mousemove(140,140)` →
`mouseup` → `click`. Element events: `['dragstart','drag','dragend','click']`. Dragging a chart
element that also has a click handler (drill-down, selection toggle, navigation) fires the click
action at the end of every drag.

**Test sketch.** Run the gesture above and assert `click` is absent; then run a plain
`mousedown`/`mouseup`/`click` under the drag threshold and assert `click` *is* present.

---

### F7 — a stale `dragElement` survives a `mousedown` that hits nothing — MEDIUM
`packages/dom/src/context.ts:124-129`

`_handleMouseDown` only assigns drag state inside `if (hitElements.length > 0)`. It never clears it
in the `else` branch, so a mousedown on empty canvas leaves the *previous* gesture's
`dragElement`, `dragStartX`, and `dragStartY` in place.

**Failure (measured).** Strand a drag per F2, move the element out from under the pointer, then
`mousedown` at (300,300) on empty space and move: events `['dragstart','drag']` — the old element
starts dragging, and the `dragstart` payload carries the **first** gesture's origin (10,10), not
(300,300). So the delta baseline is wrong too.

**Test sketch.** `mousedown` on a hit element, then `mousedown` on empty space, then `mousemove`;
assert no `drag` is emitted.

---

### F8 — `destroy()` / `disableInteraction()` leave a scheduled hit test that fires after teardown — MEDIUM
`packages/dom/src/context.ts:146`, `:292-301`, `:303-308`; `packages/core/src/animation/utilities.ts:10-21`

`createFrameBuffer` returns only a scheduling function — there is no handle to cancel. `destroy()`
disposes listeners and removes the element but cannot cancel the in-flight
`scheduleHitTest(() => this._handleHoverHitTest(x, y))`. `_handleHoverHitTest` touches no
`_interactionState`, so it runs happily after teardown: it re-reads `renderedElements`, mutates the
already-cleared `_activeElements`, and emits on scene elements.

**Failure (measured).** `mouseenter` → `mousemove` → `ctx.destroy()` → next frame: the scene element
receives `mouseenter`. In charts that starts a `renderer.transition` and shows a tooltip on a
context whose surface is already detached from the DOM.

**Test sketch.** Dispatch a `mousemove`, call `ctx.destroy()` synchronously, await two frames, assert
zero element events. Fix shape: have `createFrameBuffer` return a `{ schedule, cancel }` pair (or a
`Disposable`) and `retain` it under `INTERACTION_KEY`.

---

### F9 — `disableInteraction()` drops active elements without emitting `mouseleave` — MEDIUM
`packages/dom/src/context.ts:300`

`this._activeElements.clear()` discards the set silently. Every element that was mid-hover keeps its
highlight state and its tooltip, with no leave event to unwind it. Same visible consequence as F4,
reached through the public API instead of the pointer.

**Failure (measured).** Hover an element (`mouseenter` recorded), call `ctx.disableInteraction()`,
await a frame: events `[]`. The bar stays enlarged and the tooltip stays on screen indefinitely,
because interaction is now off and nothing will ever produce the leave.

**Test sketch.** Hover, `disableInteraction()`, assert the element received `mouseleave`.

---

### F10 — the tracked-element memo is not invalidated by `off()`, `once()` self-removal, or `EventBus.destroy()` — MEDIUM
`packages/core/src/context/context.ts:671-673`; `packages/core/src/core/element.ts:626-641`;
`packages/core/src/core/event-bus.ts:121-143,174-178`

`_getTrackedElements` memoizes a **snapshot array** per event name and is only cleared by
`invalidateTrackedElements`. `Element.on` wraps its disposable to invalidate on dispose — but that
is the *only* invalidation path for listener changes, and three common routes bypass it:
`EventBus.off(type, handler)` called directly, `EventBus.once`'s internal `this.off(type, callback)`
after firing (`:139`), and `EventBus.destroy()`'s `_listeners.clear()` (`:176`).

**Failure (measured).**
- `a.on('click', h)` → render → prime memo → `a.off('click', h)`. `a.has('click') === false`, yet
  `hitTest(['click'])` still returns `['a']`.
- `top.once('click', h)` over `under`: after the once fires and self-removes,
  `hitTest(['click'])` still returns `['top','under']`. `_handleClick` takes `hitElements[0]` =
  `top` and emits into a bus with no listeners — **the click is swallowed and `under` never gets
  it.** The element beneath is permanently shadowed by a dead one.

`hitTest` never re-checks `element.has(event)`, so the stale entry is load-bearing.

**Test sketch.** Prime the memo, then remove the listener via each of the three routes and assert
`hitTest` no longer returns the element. Cheapest fix: re-filter on `has(event)` inside `hitTest`,
or move invalidation into `EventBus.off`.

---

### F11 — a destroyed element stays hit-testable until the deferred rebuild — MEDIUM-LOW
`packages/core/src/context/context.ts:671-673`; `packages/core/src/core/scene.ts:152-177`

`Element.destroy()` → `parent.remove()` → `'graph'` → `requestFrame(rebuild)`, so
`invalidateTrackedElements()` is deferred by a frame; `renderedElements` clears only on the next
paint. In between, `hitTest` still returns the destroyed element, and because it sorts to the front
under F1 it consumes the `hitElements[0]` slot.

**Failure (measured).** Two hit elements, `el.destroy()`, then `hitTest(['click'],0,0)` in the same
tick → `['other','target']` — the destroyed `target` is still returned. Its bus is cleared, so the
emit is a no-op and the live element beneath never receives the event. Self-heals after ~1 frame.

Verified *not* an unbounded leak: a `scene.remove()` + render + `destroy()` sequence does clear
correctly (`'graph'` always fires), so this is a one-frame window, not a permanent stale entry.

**Test sketch.** Destroy an element and assert `hitTest` excludes it synchronously.

---

### F12 — element `mousemove` payloads are CSS pixels; `click` and `drag` payloads are device pixels — MEDIUM
`packages/dom/src/context.ts:216-219` vs `:178-185`, `:250-259`

`_handleHoverHitTest` emits `{x: rx, y: ry}` — the raw `clientX/Y`-relative values — while
`_handleClick` emits `{x: this.scaleX(...), y: this.scaleY(...)}` and `_handleDrag` does the same.
`scaleX` maps CSS px → device px (`rescaleCanvas`, `packages/canvas/src/utilities.ts:249-252`
returns `scaleContinuous([0,width],[0,width*dpr])`).

**Failure (measured).** Same pointer position, scale factor 2:
```
element 'mousemove' payload -> { x: 50,  y: 50  }
element 'click'     payload -> { x: 100, y: 100 }
```
`packages/charts/src/core/interaction.ts:107-152` documents `InteractionPoint` as "chart pixels" and
feeds `onEnter`/`onLeave` from the `mousemove` payload while `onClick` reads the `click` payload —
so on any HiDPI display the two callbacks report positions differing by the DPR for the same spot.

**Test sketch.** Force a 2× scale, dispatch `mousemove` twice then `click` at the same client
coordinates, assert the two element payloads are equal.

---

### F13 — a synchronous nested render pass duplicates `renderedElements` (and the SVG vtree) — MEDIUM *(mechanism confirmed; reachability SUSPECTED)*
`packages/core/src/context/context.ts:488-499`; `packages/svg/src/context.ts:384-398`;
`packages/core/src/core/scene.ts:162-169`

`markRenderStart` only resets at `renderDepth === 0`. A `scene.render()` entered while an outer pass
is open therefore appends to the outer pass's `renderedElements` — and, for SVG, appends to the same
`_vtree`, producing duplicate ids that F5 then collapses. `batch()` also calls `clear()` at any
depth, wiping what the outer pass had already drawn.

**Failure (measured).**
```js
ctx.batch(() => {
    ctx.currentRenderElement = a;   // outer pass in flight
    scene.render();                 // Scene's resize handler does exactly this
});
// ctx.renderedElements -> ['a', 'a']
```
Duplicated entries double-count in the F1 paint-order map and in `_getTrackedElements`.

**Reachability — honest assessment.** The obvious trigger (`Scene`'s `'resize'` handler calling
`this.render()` synchronously at `scene.ts:166-168`) is *unlikely* in practice: `ResizeObserver`
callbacks run in the "gather and broadcast resize observations" step, after animation-frame
callbacks, so they cannot land inside `Renderer._tick`. I found no in-tree caller that reliably
re-enters. Marked SUSPECTED for that reason; the corruption itself is confirmed.

**Test sketch.** The snippet above, asserting `renderedElements` has no duplicates; plus the SVG
variant asserting `_vtree` has no duplicate child ids. A `renderDepth > 0` guard in `Scene`'s resize
handler (defer to the next frame) closes it.

---

### F14 — the `window.resize` fallback measures the border box; `ResizeObserver` reports the content box — LOW-MEDIUM
`packages/dom/src/dom.ts:43-52` vs `:62-72`

The observer path reports `entry.contentRect` (content box). The fallback reports
`element.getBoundingClientRect()`, which is the **border box** — padding and border included. The
two branches of the same function therefore return different numbers for the same element.

**Failure.** Root `<div>` with `padding: 8px`, content width 400. Observer path → `rescale(400,…)`.
Fallback path → `rescale(416,…)`, so the canvas backing store is 16px wider than the CSS box it is
stretched over and every drawn coordinate is scaled by 400/416. Only bites on engines without
`ResizeObserver` (Safari < 13.1), so severity is bounded by the fallback being near-dead code.

Note also `observer.observe(element, { box: 'border-box' })` (`:54-56`) selects which box's changes
are *reported* in `borderBoxSize`, but the handler reads `contentRect` — the option is inert, and a
padding-only change that leaves the border box constant fires no notification.

**Test sketch.** Stub `ResizeObserver` away, give the root padding, fire `window.resize`, and assert
the reported width matches what the observer path would report.

---

### F15 — `onDOMElementResize` dereferences `window` unconditionally — LOW
`packages/dom/src/dom.ts:42`

`if ('ResizeObserver' in window)` throws `ReferenceError: window is not defined` outside a browser.
The same module exports `hasWindow` (`:27`) for exactly this guard and does not use it. `@ripl/dom`
is a published package with `sideEffects: false`, so this is reachable by any SSR/Node consumer
calling the helper directly (the `DOMContext` path fails earlier at `document.querySelector`, so
it is not the exposure).

**Test sketch.** Run the module under `environment: 'node'` and assert `onDOMElementResize` degrades
to a no-op disposable rather than throwing.

---

### F16 — Node `measureText` disagrees with the terminal context by 4×/2.5× and ignores `MeasureTextOptions` — MEDIUM
`packages/node/src/index.ts:54-69`

`nodeMeasureText(value)` takes no `options` and hard-codes 8px/char, ascent 8, descent 2. Two
consequences:

1. **It disagrees with the renderer it feeds.** `TerminalContext.measureText`
   (`packages/terminal/src/context.ts:412-431`) reports `BRAILLE_CELL_WIDTH / _rasterScale` = **2**
   logical units per char and `BRAILLE_CELL_HEIGHT / _rasterScale` = **4** ascent, descent 0
   (`packages/terminal/src/rasterizer.ts:51,54`). But `Text._getLocalBoundingBox`
   (`packages/core/src/elements/text.ts:98-110`) calls the *free* `measureText`, which always goes
   through `factory.measureText` and never sees the context override. **Measured:** `"hello"` →
   factory says width 40, ascent 8, descent 2; the terminal paints it at width 10, ascent 4,
   descent 0. Text bounding boxes in Node are ~4× too wide and ~2.5× too tall, so hit boxes, group
   box composition, label-collision culling, and tooltip sizing are all wrong.
2. **It ignores font, `textAlign`, and `textBaseline`.** Measured: `{font:'10px monospace'}` and
   `{font:'40px monospace'}` both return width 40; `textAlign: 'center'` still returns
   `actualBoundingBoxLeft: 0` where a real canvas (and the web binding — see the explicit comment in
   `packages/web/src/index.ts` `domMeasureText`) returns `width/2`. Centred and right-aligned text
   boxes are anchored wrongly.

**Test sketch.** Assert `factory.measureText('hello', {font:'40px …'}).width >
factory.measureText('hello', {font:'10px …'}).width`, and assert the Node metric agrees with
`TerminalContext.measureText` for the same string.

---

### F17 — Node `createContext` discards its `target` — LOW-MEDIUM
`packages/node/src/index.ts:78-81`

```js
createContext: (target, options) => createContext(createTerminalOutput(), options as …)
```
`target` is dropped. `new Scene('#chart')` or `createChart({ target: someElement })` silently
produces a terminal context writing to `process.stdout` regardless of what was asked for — the
caller gets no error and no way to detect the substitution. It also builds a **fresh**
`createTerminalOutput()` per context, each registering its own `SIGWINCH` handler
(`packages/node/src/output.ts:26`), so ten scenes trip Node's `MaxListenersExceededWarning` and
every handler fires on every resize.

**Test sketch.** Call `factory.createContext('#anything')` twice and assert either a thrown error
for a non-`TerminalOutput` target, or at minimum that `process.listenerCount('SIGWINCH')` does not
grow per context.

---

### F18 — Node `createElement` / `createElementNS` return `{}`, defeating core's graceful-degradation guards — MEDIUM
`packages/node/src/index.ts:84-85`

`FactoryOptions` declares these as returning real `HTMLElement`/`Element`
(`packages/core/src/core/factory.ts:25-28`). Returning `{}` means callers get a `TypeError` on the
first DOM call instead of a detectable failure.

**Failures (measured, under the real Node bindings).**
- `getPathLength('M0,0 L10,10')` (`packages/core/src/math/geometry.ts:192-198`, exported from
  `@ripl/core`) → **`TypeError: pathEl.setAttribute is not a function`**.
- `packages/core/src/elements/image.ts:44-51` was clearly written to degrade:
  `const context = canvas.getContext('2d'); if (!context) return undefined;` and the image
  interpolator has an `if (!ref)` fallback at `:89-91`. The Node stub has **no `getContext` at
  all**, so it throws before the guard can run — the intended non-DOM path is unreachable.

In-tree the path-length callers are canvas-only (`packages/canvas/src/utilities.ts:259,270`), so
today's exposure is via the public `@ripl/core` surface rather than the chart pipeline. Returning a
minimal duck-typed stub (or `undefined` and letting the guards fire) fixes both.

**Test sketch.** Under the Node bindings, assert `getPathLength(...)` and the image interpolator
either return a defined fallback or throw a typed Ripl error — not a raw `TypeError`.

---

### F19 — `destroy()` is not idempotent: a second call re-emits `destroyed` — LOW
`packages/core/src/core/event-bus.ts:174-178`

`destroy()` emits `destroyed`, clears listeners, disposes — with no guard. `DOMContext.destroy()`
(`packages/dom/src/context.ts:303-308`) is safe on its own (the `_interactionEnabled` flag and
`Element.remove()` are both idempotent), but the base re-emit is not.

**Failure (measured).** `ctx.destroy()` → register a new `destroyed` listener → `ctx.destroy()`
again: the listener fires. `Renderer` wires `scene.once('destroyed', () => this.destroy())`
(`packages/core/src/core/renderer.ts:255`), so this is a real teardown-ordering hazard for anything
that re-subscribes.

**Test sketch.** `destroy(); destroy();` and assert `destroyed` fired exactly once total.

---

### F20 — excluded nodes drift to the end of the parent — LOW
`packages/dom/src/vdom.ts:137-145`

`excludeSelectors` skips excluded nodes in the removal pass but the reorder step indexes
`domParent.children[i]` — which still counts them — so managed children are repeatedly inserted
*before* an excluded node and push it rightward.

**Failure (measured).** `<defs>` at index 0 plus one existing child, reconciled against
`[a, b]` → `<span id=a><span id=b><defs>`; `defs` moved from index 0 to index 2. Harmless for SVG
`<defs>` (position-independent, and it settles at a stable trailing position), but it contradicts
the documented contract "existing DOM children to leave untouched" and would reorder a
position-sensitive excluded node (an overlay, a watermark).

**Test sketch.** Reconcile with a leading excluded node and assert its index is unchanged.

---

### F21 — `createCanvasExport().toURL()` leaks an object URL on every call — LOW
`packages/dom/src/export.ts:51`

`URL.createObjectURL(...)` with no matching `revokeObjectURL` and no revoke hook on `ContextExport`
(`packages/core/src/context/types.ts:166-176`). The blob is pinned for the document's lifetime; a
"save chart" button on a 4K canvas leaks a few MB per press. `SVGContext.export()` has the same
shape, so the fix belongs on the shared `ContextExport` contract.

The rest of `export.ts` checks out: the snapshot is taken eagerly onto a detached canvas so later
rendering can't mutate it; `Math.max(1, …)` plus the `canvas.width > 0` guard keeps a 0×0 canvas
from throwing; `dataURLToBlob`'s `split(',')` is safe because base64 has no comma. `toURL` does
encode the PNG twice (`toDataURL` then re-parse) — perf only.

**Test sketch.** Spy on `URL.revokeObjectURL` and assert the export exposes a way to release the URL.

---

### F22 — releasing one finger after a pinch leaves the other finger inert — LOW-MEDIUM
`packages/dom/src/navigator.ts:247-258`, `:189-216`

`endPointer` unconditionally clears `_brushing`, `_panning`, and `_dragStart`. Lifting one finger of
a two-finger pinch therefore drops the *remaining* pointer into a state where `pointermove` matches
neither the pinch branch (size is now 1) nor the pan/brush branches (both flags cleared). The user
is still touching the surface and dragging, and nothing moves until they lift and re-press.

**Test sketch.** `pointerdown`×2 → `pointermove` (pinch) → `pointerup` (one) → `pointermove`; assert
`panBy` is called.

---

### F23 — a gesture that neither pans nor brushes leaks its pointer id — LOW
`packages/dom/src/navigator.ts:189-216`

`_pointers.set(...)` happens at the top of `pointerdown`, but the `if (!this._brushing &&
!this._panning) return` at `:205-207` bails **before** `setPointerCapture`. Without capture, a
`pointerup` outside the element never reaches `endPointer`, so the entry is never deleted. The
second pointer of a pinch takes the same early return at `:196` and is likewise uncaptured.

**Failure.** Touch: a right-button/secondary gesture, or the second finger of a pinch, released off
the surface leaves a stale entry; the next single-touch `pointerdown` makes `_pointers.size === 2`
and is misread as a pinch, so a one-finger pan zooms instead. Mouse is largely immune (pointerId is
constant, so the entry is overwritten).

**Test sketch.** `pointerdown` with `button: 2`, `pointerup` dispatched elsewhere, then a normal
`pointerdown` + `pointermove`; assert `panBy` is called and `zoomBy` is not.

---

### F24 — `_localPoint` forces a layout on every `pointermove` — LOW (perf)
`packages/dom/src/navigator.ts:127-137`

`getBoundingClientRect()` per move event, synchronously flushing layout mid-gesture. `DOMContext`
caches this origin (see out-of-scope item (a) and its fix on `claude/pointer-origin`); the navigator
should reuse the same cached-with-invalidation approach.

---

### F25 — `touchAction` is clobbered even when no interaction is enabled — LOW
`packages/dom/src/navigator.ts:145-186`

`_attachInteractions` runs whenever `options.interactions` is truthy, and sets
`element.style.touchAction = 'none'` (`:154-155`) *before* resolving anything. Passing
`{ zoom: false, pan: false, brush: false }` — or `{}` — is truthy, so native scrolling over the
chart is disabled while no gesture is wired up. Related: `fallback` is `false` for object form, so
`{ zoom: { sensitivity: 2 } }` silently disables pan and brush; defensible, but undocumented in the
`interactions` JSDoc (`:26`).

Verified correct in the same file: the `isInteractiveElement` feature detection (`:43-47`) means a
terminal context degrades to an inert navigator rather than crashing; `destroy()` releases both
retention keys and `super.destroy()` sweeps the rest; and the `wheel` `preventDefault()` works
because the listener is on the surface element, not `window`/`document`/`body`, so the
passive-by-default rule does not apply.

---

### F27 — the Node `requestAnimationFrame` pins the event loop open forever — MEDIUM
`packages/node/src/index.ts:72`

`requestAnimationFrame: (cb) => setTimeout(cb, 16)` returns a **ref'd** timer. `Renderer._tick`
reschedules itself every frame (`packages/core/src/core/renderer.ts:277,287`) and `autoStart`
defaults to `true`, so the process can never exit. `autoStop` cannot rescue a static scene: it fires
only from `context.on('mouseleave')` — which `TerminalContext` never emits — or from a transition
completing (`renderer.ts:251,569,610`).

**Failure (measured).** A script that builds a terminal context, a `Scene` with one circle, and a
`Renderer` was **still alive at 1500ms** with no other ref'd handles. Control run with the
`createRenderer` line removed exits immediately (code 0). A CLI that renders one chart and finishes
hangs until killed. An *animated* chart does exit, because the transition's completion callback
reaches `_stopOnIdle()`.

**Test sketch.** Spawn a child process that creates a scene + renderer and assert it exits within a
timeout. Fix: `.unref()` the timer (accepting that the loop no longer holds the process open) or
have `@ripl/node` document/require an explicit `renderer.destroy()`.

---

### F28 — the Node `requestAnimationFrame` callback receives no timestamp — LOW
`packages/node/src/index.ts:72`

`FactoryOptions.requestAnimationFrame(callback: FrameRequestCallback)` promises a
`DOMHighResTimeStamp` argument; `setTimeout(cb, 16)` invokes `cb()` with none. Harmless today —
every in-tree consumer (`Renderer._tick`, `createFrameBuffer`, `Scene`'s rebuild,
`SVGContext._commit`) ignores the argument and reads `factory.now()` instead — but it silently
breaks any consumer written against the declared contract.

---

## Verified correct (no finding)

- **Reconciler reordering.** The "insert before whatever currently sits at index `i`" algorithm is
  correct for arbitrary permutations — checked `[C,A,B]`, `[B,C,A]`, and the full reverse `[C,B,A]`;
  each converges in one pass with the minimum number of moves.
- **`getAncestorGroupIds` / `ensureGroupPath`.** Correct (root→leaf order, scene root excluded,
  intermediate nodes created idempotently) and well covered by `packages/dom/test/reconcile.test.ts`.
  Note they have **no callers** anywhere in the monorepo — public API only.
- **`getChildId`.** Default (`getAttribute('id')`) matches what `SVGContext.createElement` stamps.
  Nodes with no id and no `excludeSelectors` match are removed — that is the documented purpose of
  `excludeSelectors`, not a bug.
- **Node moved between groups.** Node identity is preserved via `domCache` when the destination
  group reconciles first; when the source reconciles first the node is recreated. No corruption
  either way.
- **`DOMContext` disposal.** Every listener (`INTERACTION_KEY`) and the `ResizeObserver` (default
  key) is released: `Context.destroy()`'s unkeyed `dispose()` sweeps all keys, and
  `EventBus.destroy()`'s second `dispose()` is a harmless no-op. The only unreleased resource is the
  frame buffer (F8).
- **`enableInteraction` after `disableInteraction`** correctly rebuilds state and re-attaches.
- **Hit-test coordinate spaces.** `_handleMouseDown`, `_handleClick`, and `_handleHoverHitTest` all
  scale into device pixels before calling `hitTest`, matching `Element.intersectsWith`'s documented
  expectation. (The *emitted payloads* are inconsistent — that is F12.)
- **`export.ts` snapshot semantics.** Eager copy onto a detached canvas; degenerate sizes guarded;
  `dataURLToBlob` parsing sound.
- **Navigator feature detection, disposal, and non-passive `wheel`.** All correct.
- **Resize measurement target.** Both the initial `init()` measure and the observer read the same
  effective box for a `width:100%` surface; the mismatch is confined to the fallback (F14).
- **Node `factory.set` completeness.** All ten `FactoryOptions` members are supplied, and
  `"sideEffects": true` correctly prevents the registration from being tree-shaken.

---

## Ranked summary

| Rank | ID | Severity | Defect | Status |
|------|----|----------|--------|--------|
| 1 | F1 | High | `hitTest` sorts by additive z-index, not paint order — wrong element reported topmost across groups | CONFIRMED |
| 2 | F2 | High | `mouseup` outside the surface strands the drag; no `dragend`, drag resumes with no button held | CONFIRMED |
| 3 | F3 | High | A group that empties keeps its stale DOM children painted and hit-testable | CONFIRMED |
| 4 | F4 | High | Leaving the surface never emits element `mouseleave` — tooltip and highlight stay stuck | CONFIRMED |
| 5 | F5 | Med-High | Duplicate sibling id deletes one element and reorders the rest | CONFIRMED |
| 6 | F6 | Medium | `click` fires immediately after every drag | CONFIRMED |
| 7 | F27 | Medium | Node `rAF` pins the event loop — a static chart never lets the process exit | CONFIRMED |
| 8 | F16 | Medium | Node `measureText` is 4×/2.5× off vs the terminal and ignores `MeasureTextOptions` | CONFIRMED |
| 9 | F8 | Medium | `destroy()` cannot cancel the pending hit test; events fire after teardown | CONFIRMED |
| 10 | F10 | Medium | Tracked-element memo survives `off()` / `once()` / `EventBus.destroy()`; dead element shadows the live one | CONFIRMED |
| 11 | F12 | Medium | Element `mousemove` payload is CSS px, `click`/`drag` are device px | CONFIRMED |
| 12 | F9 | Medium | `disableInteraction()` drops active elements without `mouseleave` | CONFIRMED |
| 13 | F7 | Medium | Stale `dragElement` survives a `mousedown` that hits nothing | CONFIRMED |
| 14 | F18 | Medium | Node `createElement`/`createElementNS` return `{}`, defeating core's degradation guards | CONFIRMED |
| 15 | F13 | Medium | Nested render pass duplicates `renderedElements` / the SVG vtree | mechanism CONFIRMED, reachability SUSPECTED |
| 16 | F11 | Med-Low | Destroyed element stays hit-testable for ~1 frame | CONFIRMED |
| 17 | F22 | Low-Med | Releasing one finger after a pinch leaves the other inert | CONFIRMED (by trace) |
| 18 | F14 | Low-Med | Resize fallback measures the border box; observer reports the content box | CONFIRMED (by trace) |
| 19 | F17 | Low-Med | Node `createContext` discards `target`; one `SIGWINCH` handler leaked per context | CONFIRMED (by trace) |
| 20 | F23 | Low | Uncaptured gesture leaks a pointer id; next gesture misread as a pinch | CONFIRMED (by trace) |
| 21 | F19 | Low | `destroy()` re-emits `destroyed` on a second call | CONFIRMED |
| 22 | F20 | Low | Excluded nodes drift to the end of the parent | CONFIRMED |
| 23 | F21 | Low | `toURL()` never revokes its object URL | CONFIRMED (by trace) |
| 24 | F15 | Low | `onDOMElementResize` dereferences `window` unguarded | CONFIRMED (by trace) |
| 25 | F25 | Low | `touchAction` clobbered even with every interaction disabled | CONFIRMED (by trace) |
| 26 | F24 | Low | `_localPoint` forces layout on every `pointermove` | CONFIRMED (by trace) |
| 27 | F28 | Low | Node `rAF` callback receives no timestamp | CONFIRMED (by trace) |
| — | SEED | — | `createFrameBuffer` mousemove starvation | **REFUTED** — correct per-frame throttle; measured 1 hover per frame at 20 moves/frame |
