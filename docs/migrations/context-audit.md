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

_No entries yet._

## @ripl/dom

_No entries yet._

## @ripl/node

_No entries yet._

## @ripl/terminal

Almost every entry here changes the **bytes written to the terminal**. If you snapshot terminal
output, expect to re-record.

### Paint resolution

**`colorToAnsiFg`** and **`colorToAnsiBg`** — **API**, return type widened to `string | undefined`,
and **behaviour**. `''` used to mean both "transparent" and "unparseable", and `applyFill` painted
for both, so a `transparent` fill drew solid braille. The two are now distinct: `undefined` means
*do not paint* (`''`, `none`, `transparent`, or zero effective alpha) and `''` means *paint, but
uncolored* (a real color this backend cannot resolve, e.g. `currentColor`). Both take an optional
second `opacity` argument. A caller that assigned the result straight into a `string` must handle
`undefined` — treat it as "skip this paint".

**`colorToAnsiFg`** / **`colorToAnsiBg`** — **behaviour**. Resolution now covers the 148 CSS named
colors, and follows a gradient to its first stop and a `pattern(...)` to its foreground. `red`,
`#888`, `white` and `linear-gradient(...)` previously resolved to no color at all, so the geometry
was rasterized uncolored and inherited whatever color the *previous, unrelated* element had left in
that cell. Terminal output gains color everywhere those values are used, including this repo's own
terminal demo.

**`colorToAnsiFg`** / **`colorToAnsiBg`** — **behaviour**. Alpha is no longer discarded. A paint's
own alpha, multiplied by `Context.opacity`, attenuates the emitted color toward the background. A
character cell cannot composite, and the terminal background is unknowable, so the conventional dark
one is assumed — the same assumption the rasterizer's light default foreground already encoded.
`rgba(255, 0, 0, 0.5)` now emits a darker red than `#ff0000`.

**`TerminalContext.applyFill`** / **`TerminalContext.applyStroke`** — **behaviour**. Read
`Context.opacity`. It was maintained by the pipeline (element alpha via `CONTEXT_OPERATIONS`, group
alpha composited at the boundary) and read by nobody, so `opacity: 0` rendered identically to
`opacity: 1`. `@ripl/charts` parks crosshair lines at `opacity: 0` until hover and fades axis and
legend elements in from `0`, so terminal charts drew that chrome permanently. Anything that relied
on a zero-opacity element still being visible must set an explicit opacity.

**`TerminalContext.applyStroke`** — **behaviour**. Handles `ContextText`, drawing the glyphs in the
stroke color. `Text.render` prefers stroke over fill, so text with a `stroke` set took the stroke
branch and produced **no output at all** — an outlined label vanished rather than degrading.

**`TerminalContext.applyFill`** — **behaviour**. Fills only; it no longer also rasterizes the path
outline in the fill color. That painted one pixel beyond the even-odd interior (so adjacent filled
shapes bled into each other) and painted something for a degenerate, zero-area fill, where canvas
paints nothing. Fill-only shapes lose roughly a pixel of outline; set a `stroke` to keep it.

### Rasterizer output

**`BrailleRasterizer.serialize`** — **behaviour**. A cell with no color emits an SGR reset rather
than nothing. An uncolored glyph previously inherited the preceding cell's color and suppressed the
row's trailing reset, so a single stale color leaked across the rest of the row, the rest of the
frame, and every frame after it.

**`BrailleRasterizer.serialize`** — **behaviour**. The ANSI form appends `\x1b[K` to every row and
`\x1b[J` below the last one. Nothing erased the display, so shrinking the terminal left the previous
frame's rows and columns stranded on screen until something else scrolled. The plain-text form
(`{ ansi: false }`) is unchanged.

**`BrailleRasterizer.setPixel`** — **behaviour**. Ignores non-finite coordinates. `NaN` passes every
bounds comparison, so a malformed element (one missing a required coordinate) indexed the braille dot
map out of range and threw, taking the whole frame down.

**`BrailleRasterizer.toImageData`** — **behaviour**. Character cells are rasterized as filled
blocks. The loop read only the dot grid, so every glyph placed by `setChar` — axis labels, legend
labels, titles — was absent from `export().toImage()` and from the exported PNG while
`export().toString()` showed them. A 2×4-pixel cell cannot carry a letterform, so a block is the
honest rasterization; whitespace glyphs stay transparent.

### Geometry

**`rasterizeEllipse`** — **API**, signature changed. Now
`(cx, cy, rx, ry, rotation, startAngle, endAngle, counterclockwise, plot)`, matching
`rasterizeArc`'s shape. Callers passing `(cx, cy, rx, ry, plot)` must insert `0, 0, TAU, false`
before `plot`.

**`flattenEllipse`** — **API**, additive. Takes optional `rotation`, `startAngle`, `endAngle` and
`counterclockwise`. A full sweep samples as before (no duplicate closing point); a partial sweep
includes both endpoints, so filling it closes with a chord exactly as canvas does.

**`TerminalContext`** ellipse rendering — **behaviour**. Both command passes read only the first
four recorded arguments, so an `Ellipse` element's `rotation`/`startAngle`/`endAngle`/direction were
dropped and every ellipse drew whole and upright. They are honored now, so a partial or rotated
ellipse renders different geometry than before — the geometry that was asked for.

**`dashPixels`** — **API**, additive. Gates a plot callback on a dash pattern.

**`thickenPixels`** — **API**, additive. Widens a plot callback by stamping a round brush at every
pixel it plots.

**`TerminalContext.applyStroke`** — **behaviour**. Honors `lineDash`/`lineDashOffset`. Dashed grid
lines and zero-lines were indistinguishable from solid data lines. Arc length is approximated by
counting plotted pixels, which is exact for axis-aligned runs and up to √2 short on a diagonal.

**`TerminalContext.applyStroke`** — **behaviour**. Honors `lineWidth`. Every stroke was one dot
wide regardless of width, which erased the encoding of any chart carrying its data in stroke
thickness — a Sankey's links (`lineWidth` *is* the flow magnitude, 20–200px) all collapsed to
identical hairline curves, and a radial bar's rings to concentric hairlines. Thickness quantises to
an odd number of dots because the brush centres on one: widths of 1, 2, 3, 4 and 5 give strokes 1,
3, 3, 5 and 5 dots across. **A scene that strokes anything wider than 1 now emits different bytes.**
`lineCap`, `lineJoin` and `miterLimit` are still ignored — the round brush shapes every cap and
join — so a gap narrower than the stroke is wide gets bridged by its caps, as it is on canvas.

**`TerminalPath.arcTo`** — **behaviour**. Constructs the real tangent arc instead of two straight
lines through the corner. Canvas `arcTo` never passes through `(x1, y1)`; the old approximation was
the `radius === 0` degenerate case and was visibly wrong for large radii. Degenerate inputs (zero
radius, collinear points) still fall back to a line.

**`TerminalPath.arc`** / **`ellipse`** / **`lineTo`** / **`bezierCurveTo`** / **`quadraticCurveTo`**
— **behaviour**. These open a subpath when none is current, so a `closePath()` after a bare
`circle()` closes back to the arc's own start rather than the previous subpath's start (or the
origin).

**`TerminalPath.addPath`** — **behaviour**. Warns when handed a path from another backend instead of
dropping it silently, which yielded an empty composed path with no indication why.

### Sizing and lifecycle

**`TerminalContext`** resize handling — **behaviour**. An explicit `width`/`height` survives a
terminal resize. The handler forwarded the terminal's new dimensions unconditionally, so a
deliberately fixed-size viewport silently became full-screen on the first `SIGWINCH`.

**`TerminalContext.rescale`** — **behaviour**. The letterbox mapping is installed before `resize` is
emitted. The base `rescale` resets `scaleX`/`scaleY` to identity and *then* emits, and a bound
`Scene` repaints synchronously on that event, so the repaint placed points with identity scales and
extents with the new raster scale. Under a running `Renderer` the next tick corrected it; a static
scene kept the mis-placed frame.

**`TerminalContext.reset`** — **API**, additive override. Calls `super.reset()` and clears the
character grid. It was inherited as a no-op, so `reset()` left the previous frame on screen.

**`TerminalContext.destroy`** — **behaviour**. Writes an SGR reset, shows the cursor, and parks it
below the grid before tearing down. Nothing restored terminal state, so a colored final frame could
leave the user's shell colored after the process exited.

**`TerminalContext.export`** — **API**, additive. Implements `ContextExport.release()`, and mints the
URL once so repeated `toURL()` calls no longer leak a new `Blob` URL each time.

**`TerminalContext.supportsPathCaching`** — **behaviour**, now `true`. `createPath` is a plain
`new TerminalPath(id)` with no per-frame registration, so cached paths stay valid and shapes stop
re-tracing their whole command list every frame.

**`TerminalContext.hitTestHonorsTransform`** — **behaviour**, now `true`. `Shape2D.intersectsWith`
reads `false` as "the transform was applied at draw time, so map the point into local space". This
backend applies no transform, so the point is already in the space it drew in. Latent today
(`isPointInPath` always returns `false`), correct the moment hit testing exists.

### Transforms and compositing

**`TerminalContext.rotate`** / **`scale`** / **`translate`** / **`transform`** / **`setTransform`** —
**behaviour**. Still no-ops, but a non-identity call now warns once per context. Transforms remain
**unimplemented by decision**: a real matrix stack would have to run through the whole command
pipeline, and rotation into a 2×4 braille lattice is lossy regardless. The class JSDoc previously
claimed elements are "positioned through the context's own `scaleX`/`scaleY`/`rasterScale` mapping
instead"; that mapping is a single global letterbox and never was a substitute. The docs now say
transforms are *discarded* and name the casualties.

**`TerminalContext.applyFill`** / **`applyStroke`** — **behaviour**. Warn once when
`globalCompositeOperation` is `'destination-out'`. Shadows, filters and other composite modes stay
silently ignored, but `destination-out` means canvas *erases* where the terminal *draws*, so the
output is inverted rather than degraded.

## @ripl/3d

_No entries yet._

## @ripl/webgpu

_No entries yet._
