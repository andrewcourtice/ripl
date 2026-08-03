# Migrating through the rendering-context audit

Every behavioural and API change made while implementing the rendering-context audit, grouped by
package. Each entry names the exact symbol, what changed, and what a consumer has to do about it.

Entries marked **behaviour** change what gets rendered or emitted without changing any type — code
keeps compiling, output moves. Entries marked **API** change a type or signature and will surface as
a compile error.

## @ripl/core

### Hit testing

**`Context.hitTest`** — **behaviour**. Results are ordered topmost-first by **paint order alone**;
the additive-`zIndex` sort is gone. `renderedElements` is already the resolved stacking order, and
`Element.zIndex` sums the parent chain, so it could not compare descendants of different groups —
`hitElements[0]` regularly resolved to an element the user could not see. Every `DOMContext`
consumer takes `hitElements[0]` as topmost and now gets the element actually drawn on top. If a
scene relied on a high `zIndex` to win a hit **across** group boundaries, reorder the groups
instead; within one group nothing changes, because siblings are painted in z-index order.

**`Context.hitTest`** — **behaviour**. Hits are re-filtered on `element.has(event)` rather than
trusting the tracked-element memo. `EventBus.off`, a spent `once()`, and `EventBus.destroy()` all
bypassed the memo's only invalidation path, and a destroyed element outlived it by a frame, so a
dead element kept consuming the topmost slot and swallowing the event meant for the element
beneath. No action required; hit testing simply stops returning elements with no listener.

**`Element.intersectsWith`** and **`Shape2D.intersectsWith`** — **behaviour**. The incoming point is
mapped back to logical space through `Context.scaleX`/`scaleY` instead of being divided by
`Context.scaleDPR`. `Context.rescale` leaves the scales identity (SVG, terminal) while canvas maps
to device pixels, so on a retina display every SVG box hit — `Text`, `Image`, `Group`, and any
`Shape2D` with no traced path — landed at half coordinates. A custom `Context` that scales its
surface without updating `scaleX`/`scaleY` must now override `toLogicalPoint`/`toSurfacePoint`.

**`Context.toLogicalPoint`** and **`Context.toSurfacePoint`** — **API**, additive. New public methods
mapping a point between the surface space pointer coordinates arrive in and the logical space
elements are authored in. Override them in a backend whose surface mapping is not expressed by
`scaleX`/`scaleY`.

**`Shape2D.intersectsWith`** — **behaviour**. The element's `lineWidth`, `lineCap`, `lineJoin`,
`miterLimit`, `lineDash`, and `lineDashOffset` are applied (inside a `Context.layer`) around the
stroke hit test. `isPointInStroke` strokes with the context's *current* line style, and a hit test
runs after the frame's trailing `restore`, so every element was tested at the backend default width
of 1. **Stroke hit areas grow** for anything with `lineWidth > 1` (and shrink below 1) — a Sankey
link with `pointerEvents: 'stroke'` becomes hoverable across its full ribbon rather than a 1px
centreline. If a scene tuned its hit areas around the old behaviour, set `lineWidth` deliberately.

### Group boundaries

**`CONTEXT_OPERATIONS.opacity`** — **behaviour**. Composites multiplicatively rather than assigning,
so an element's own alpha stacks under its ancestor groups' instead of replacing it. A group at
`0.5` containing a leaf at `0.5` now renders the leaf at `0.25`, matching SVG and the DOM. To keep
an element at a fixed absolute alpha, take it out of the opacity-bearing group or divide its value
by the accumulated group alpha. `Context.opacity` is unchanged — **assigning that property still
replaces**, and `Context.pushGroup` no longer multiplies it explicitly (`applyGroupPaint` does).

**`Context.pushGroup`** / **`Context.popGroup`** — **behaviour**. The group becomes
`Context.currentRenderElement` for the duration of its boundary, and the previous element is
restored on pop. A gradient or pattern set on a `Group` therefore resolves against
`group.getBoundingBox(true)` — the composed box of its children. It previously took whatever leaf
was painted last on canvas (or the whole surface, if the group came first) and each leaf's own box
on SVG, so the same scene rendered differently on each backend and canvas output depended on
sibling order. Groups are `abstract`, so they are still excluded from `renderedElements`.

**`Group.render`** — **behaviour**. `popGroup`/`markRenderEnd`/`$reset` run in a `finally`, so a
throwing child no longer leaves the group stack and render depth permanently unbalanced. On the
terminal that state froze the display for the rest of the session.

### Render pass

**`Context.batch`** — **behaviour**. Unwinds the state stack to the depth captured on entry, giving
the scene root the same guarantee `popGroup` gives a group. A `clip: true` shape that is a direct
child of the scene deliberately skips its own `restore()` so the clip persists to later siblings;
with no enclosing group to absorb it, that leaked one saved state per frame, unbounded, and (on
canvas) progressively corrupted `clear()`.

**`Context.batch`** — **behaviour**. Only clears the surface at render depth 0. A pass entered while
an outer one is open continues it, matching `markRenderStart`, rather than wiping what the outer
pass had already drawn.

**`Context.markRenderEnd`** — **behaviour**. Clamped at zero. An unbalanced call could previously
drive `renderDepth` negative, making backends that gate their flush on depth 0 fire per element
instead of per frame.

**`Element.render`** — **behaviour**. Registers itself *after* `markRenderStart`, which at depth 0
was wiping the list the element had just joined. A direct `element.render(context)` outside a
`batch` now leaves the element in `renderedElements` and therefore hit-testable.

**`Renderer`** — **behaviour**. The animation loop re-arms `requestAnimationFrame` in a `finally`.
A single throw inside a frame previously stopped the loop permanently, freezing every surface bound
to that renderer with no further errors to diagnose it by.

### Text and colour

**`Text.getBoundingBox`** — **behaviour**. Text is measured through the **bound context** (inside a
`Context.layer` that applies the element's computed font, `textAlign`, and `textBaseline`), falling
back to `factory.measureText` only when the element has never been rendered. It always went to the
platform factory before, which on `@ripl/node` reports 8px per character while the terminal draws
one braille cell — boxes roughly 4× too wide. Boxes now match what the backend actually paints, so a
backend whose `measureText` disagrees with the platform factory will report different boxes.

**`Context.measureText`** — **behaviour**. Forwards the context's current `font`, `textAlign`, and
`textBaseline`. `actualBoundingBox*` is anchor-relative, so dropping the alignment anchored the
reported box at the wrong corner for every consumer.

**`MeasureTextOptions.context`** — **API**, removed. No factory implementation ever read it, so
passing a live 2D context read as meaningful but did nothing. Delete the property from any
`MeasureTextOptions` literal; pass `font`/`textAlign`/`textBaseline` instead.

**`PATTERNS.hex`** and **`parseHEX`** — **behaviour**. 3- and 4-digit shorthand hex is accepted and
each digit doubled, as CSS specifies. `#f00` previously matched no parser at all and resolved to
nothing on every backend, so a shorthand fill silently painted the inherited or default colour.
Colours that used to fall through to a default now resolve.

### Lifecycle

**`Context.destroy`** — **behaviour**. Clears `renderedElements`, `renderElement`, and the
tracked-element memo. Together they retained the entire element graph, and each element retains the
context back, so nothing was collectable after teardown. Do not read `renderedElements` after
`destroy()`.

**`Context.reset`** — **behaviour**. No longer a no-op: drops the saved-state stack, restores the
default drawing state, and closes any open group boundary. Backends that override `reset()` and want
this should call `super.reset()`.

**`EventBus.destroy`** — **behaviour**. Idempotent. A second `destroy()` used to re-emit `destroyed`,
waking anything that re-subscribed during teardown (`Renderer` wires `scene.once('destroyed', …)`).

**`ContextExport.release`** — **API**, additive and optional. A hook for releasing what an export
holds — above all the object URL from `toURL()`, otherwise pinned for the document's lifetime.
Existing `ContextExport` implementations keep compiling; call `release()` when you are done with an
export.

**`createFrameBuffer`** — **API**, additive. Returns a `FrameBuffer`: the same callable scheduler,
now carrying a `cancel()` property that drops the pending frame. Existing call sites are unaffected.
Call `cancel()` on teardown so work scheduled by the last interaction cannot run against a destroyed
target. `Scene` already does this for its deferred graph rebuild.

### Scene

**`Scene`** (constructor) — **behaviour**. The root inherits the host's computed `font` from any DOM
`Element`, not just an `HTMLElement`. An `SVGSVGElement` extends `SVGElement`, so SVG scenes never
picked up the page font and every text element fell back to the context default `10px sans-serif` —
shifting painted text, bounding boxes, label collision avoidance, and axis tick spacing against the
identical canvas scene. SVG text now matches canvas; a scene that relied on the default font should
set `font` explicitly on the scene or the host.

## @ripl/canvas

_No entries yet._

## @ripl/svg

### Clipping

**`SVGContext.applyClip`** — **behaviour**, and the one change likely to break a snapshot. A clip no
longer stamps `clip-path` on each leaf; it opens a `<g clip-path="url(#…)" id="${pathId}:clip">` and
nests everything drawn after it, until the enclosing `restore()`/`popGroup()`, inside that group.
Two defects fall out of the same mechanism. `<clipPath>` defaults to `userSpaceOnUse`, which is the
user space of the *referencing* element, so a clip stamped on a leaf was displaced by every
intervening `<g transform>` — 20px per nested translate, growing with depth, where canvas bakes the
region into device space at `clip()` time and is immune to later transforms. And `_currentClipId`
was a single scalar, so a second `applyClip` **replaced** the active clip instead of intersecting
it: descendants of an inner brush/zoom clip escaped the outer plot-area clip entirely. Nested
scopes intersect, matching `ctx.clip()`. **Markup assertions and CSS selectors that walked straight
from the surface to a clipped node must account for the scope element**; nothing else changes, since
a `<g>` carrying only `clip-path` establishes no new user space.

**`SVGContext.applyClip`** — **behaviour**. A clipped multi-path element drops *all* of its paths.
A `Polyline` with `segments` mints run paths keyed `${id}:${index}`; only the primary was removed,
so the runs stayed in the tree as stray (invisible) `<path>` nodes bloating the DOM and the node
cache.

### Paint

**`SVGContext.pushGroup`** — **behaviour**. A gradient or pattern on a `Group` resolves **once at the
boundary**, against `group.getBoundingBox(true)`, keyed by the group's id and stamped on the `<g>`;
descendants inherit the resolved `url(#…)` instead of re-resolving the paint against their own box.
Every leaf used to get its own def showing the **full** ramp restarted over its own geometry, where
canvas painted one ramp across the whole group — the same scene, two pictures. A leaf that sets its
own gradient still resolves against its own box, unchanged. See the `Context.pushGroup` entry under
`@ripl/core` for the other half.

**`SVGContext.applyFill`** — **behaviour**. The `fillRule` argument is honoured and emitted as
`fill-rule`. It was accepted and discarded (while `applyClip` honoured it), so an `evenodd` fill
silently rendered `nonzero` — a donut path was solid on SVG and holed on canvas.

**`SVGContext`** (element styles) — **behaviour**. `globalCompositeOperation` maps to
`mix-blend-mode` for the operations that have a CSS equivalent (`lighter` maps to `plus-lighter`;
`source-over`, `destination-out`, `xor` and `copy` have none and are left alone). The surface also
carries `isolation: isolate`, so a blend composites against the surface's own content the way canvas
does rather than against the page behind it. An element with `globalCompositeOperation: 'multiply'`
that used to render as plain `source-over` on SVG now blends.

**`SVGContext`** (element styles) — **behaviour**. `alignment-baseline` is no longer written.
It was set on **every** element, `<path>` and `<image>` included; browsers ignore it on `<text>`,
`SVGTextPath` never received it, and its `middle` mapping disagreed with `dominant-baseline`'s
`central`. The mapping is dropped from the package-internal `SVG_STYLE_MAP` too; `dominantBaseline`
is the one that was ever reaching a node.

### Text

**`SVGText`** — **behaviour**. `TextOptions.maxWidth` emits `textLength` plus
`lengthAdjust="spacingAndGlyphs"`. Canvas has honoured it via `fillText`'s third argument all along,
so a label sized to fit a heatmap cell or a truncated axis tick overflowed on SVG only. **SVG text
with a `maxWidth` now compresses**; drop the option to get the old overflow.

### Lifecycle

**`SVGContext.destroy`** — **API**, additive (there was no override). Clears the reconciler's node
cache, all five `<defs>` caches, the `<defs>` element itself and the virtual tree. Anything holding
the context alive — a devtools panel, a registry — used to retain every cached DOM node with it.
Do not render through a context after destroying it.

**`SVGContext.reset`** — **API**, additive. Drops the accumulated transform, the open clip scopes
and the group nesting alongside `super.reset()`'s base state. `Context.reset()` is no longer a
no-op, and the SVG-side stacks have to unwind with it or they point into a tree the base class has
already dropped.

**`SVGContext.export`** — **behaviour**. The returned export implements the optional
{@link ContextExport.release}: it tracks every object URL `toURL()` hands out and revokes them.
Call `release()` when done with an export; the URLs were previously pinned for the document's
lifetime.

**`SVGContext.export`** — **behaviour**. The serialized markup carries `width`/`height` attributes.
As a standalone document — exactly how `toURL()` and `toImage()` consume it — the inline
`width: 100%` has no containing block, so the intrinsic size was browser-dependent. The attributes
are written on the live `<svg>` at every `rescale`; the inline style still wins for on-page layout,
so nothing about how the surface renders in the host changes.

**`canvasImageSourceToDataURL`** — **behaviour**. The result is memoized per source and size. It was
called on every render pass by `drawImage`: a fresh `<canvas>`, a synchronous full PNG encode and a
base64 pass per frame, whose result was then written to the live `<image>` href, forcing the browser
to re-decode too — one image element made a 60fps scene unusable. Sources whose pixels change
without their identity changing (`HTMLCanvasElement`, `OffscreenCanvas`, `HTMLVideoElement`) are
deliberately **not** memoized and still re-encode per call. An `HTMLImageElement` is keyed by `src`,
so swapping the source re-encodes; mutating a canvas source's pixels was never observable through
this function's identity and still is not.

### Known gaps

Three findings need a real browser and are left for the Playwright harness: `<feDropShadow>`
geometry scales with ancestor transforms where canvas shadows do not (**S-18**); `isPointInFill` is
fed a root-space point but is specified in the element's own local space, so hit testing on a
transformed element is wrong — the reconciler-cache lookup was fixed, the coordinate space was not
(**S-19**, HIGH); and `filter="url(#shadow-…) blur(…)"` blurs the drop shadow along with the shape,
where canvas derives the shadow from the filtered result (**S-20**).

## @ripl/dom

_No entries yet._

## @ripl/node

_No entries yet._

## @ripl/terminal

_No entries yet._

## @ripl/3d

_No entries yet._

## @ripl/webgpu

_No entries yet._
