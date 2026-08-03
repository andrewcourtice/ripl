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

**`PATTERNS.rgba`**, **`PATTERNS.hsla`** and **`PATTERNS.hsva`** — **behaviour**. An integer `0`
alpha is accepted. The alternation matched `1`, `.5`, `0.5` and `50%` but had no integer branch, so
`rgba(255, 0, 0, 0)` — the idiomatic fully-transparent form — matched no parser and resolved to
nothing. Canvas hid it by falling through to a raw `fillStyle` assignment; the terminal painted it
opaque. Fully-transparent paints that used to render now correctly render nothing.

### Runtime

**`Factory.set`** — **behaviour**. Copies property descriptors instead of spreading, so an accessor
passed in stays an accessor. `@ripl/web` supplies `devicePixelRatio` as a live getter over
`window.devicePixelRatio`; the spread invoked it once and froze the number, so no surface ever
re-rasterised after a browser zoom or a move to a monitor with a different ratio. A platform layer
can now supply any option as a getter and have it read live.

**`interpolateImage`** and **`ImageElement.getBoundingBox`** — **behaviour**. Image sources are
sized by naming each DOM constructor and skipping runtimes that never declare it. Only
`OffscreenCanvas` was guarded before, so the first `instanceof HTMLImageElement` threw a
`ReferenceError` on any runtime without the DOM globals — `@ripl/node` hit it immediately. Sizing an
unrecognised source still yields `[0, 0]`.

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

### Paint state

**`Context.fill`** and **`Context.stroke`** — **behaviour**. The resolved paint strings are pushed and
popped alongside the native drawing state by `save()`/`restore()`, so the getters report the paint the
context is actually painting with. They were plain instance fields outside the stack, so once a paint
had been assigned inside any scope the getter reported that value for the life of the context — a
lying getter, not a wrong pixel, since nothing in the render pipeline reads them back.

**`Context.fill`** and **`Context.stroke`** — **behaviour**. Assigning an empty string is ignored.
Native canvas rejects an invalid colour, so `fill = ''` neither cleared the paint nor reported the
failure; it only blanked the tracked value and unmasked whatever the native context still held. To
clear a paint, assign a transparent colour (`'transparent'`, `'rgba(0, 0, 0, 0)'`).

### Sizing

**`rescaleCanvas`** — **behaviour**. The returned scales map logical coordinates onto `width * dpr` —
the exact transform drawing goes through — instead of the floored backing-store size. The backing
store is still floored to whole device pixels. Pointer mapping and drawing disagreed by up to a device
pixel at the far edge of a surface whose scaled size is not an integer.

**`CanvasContext.rescale`** — **behaviour**. Assigns the DPR-aware scales *before* emitting `resize`,
and no longer delegates to `Context.rescale`, which installs identity scales and emits from inside
that window. Any `resize` handler reading `context.scaleX`/`scaleY` — including `Scene`'s own
synchronous re-render — saw the identity mapping. A `Context` subclass that overrides `rescale` to
install its own scales has to do the same.

### Text and images

**`renderTextAlongPath`** — **behaviour**. Each glyph is placed at the point its own `textAlign`
anchors it to rather than always at its mid-point, which was only correct for `center`; under the
canvas default of `start` every glyph slid forward by half its own advance. `startOffset` is clamped
to `[0, 1]` (a negative value stacked the leading glyphs on the path start, because the sampler
clamps but the layout kept advancing from a negative distance) and `maxWidth` caps the run's advance
instead of being ignored. Text on a path moves back by half a glyph wherever `pathData` is used.

**`canvasDrawImage`** — **behaviour**. A width supplied without a height (or the reverse) is honoured,
with the missing dimension taken from the image's intrinsic size; it used to fall through to the
three-argument form and draw at natural size. A `0` is honoured too and draws nothing, rather than
reading as "no size given".

### Lifecycle

**`Context.reset`** — **behaviour**. Calls `super.reset()` and re-installs the
`setTransform(dpr, 0, 0, dpr, 0, 0)` matrix the surface is drawn through. Native `reset()` clears the
state stack, the clip **and** the transform, so on a 2× display everything after a `reset()` rendered
at half size in the top-left quadrant, while `Context.saveDepth` kept counting saves the native stack
no longer held and a later `popGroup()` unwound to the wrong depth.

**`CanvasContext.destroy`** — **API**, additive override. Releases the gradients and patterns cached
against the context, together with the offscreen tile canvases the patterns hold, and zeroes the
canvas backing store (`width × height × 4` bytes, otherwise held until collection). Do not draw into a
context after `destroy()`.

**`toCanvasPattern`** — **behaviour**. Cached per context *and* string rather than in one module-global
map. A destroyed context's `CanvasPattern` was handed to the next context that asked for the same
string, and neither it nor its tile canvas was ever released.

**`releaseCanvasPaintCache`** — **API**, additive. Drops every `CanvasGradient` and `CanvasPattern`
cached against a native context. Call it from the teardown of a backend that composes
`canvas2DStateMixin` itself.

### Performance

**`setCanvasFill`** and **`setCanvasStroke`** — **behaviour**. The native `CanvasGradient` is cached
per context, paint string and bounds instead of rebuilt on every assignment — 500 gradient elements at
60 fps allocated 30 000 gradients a second. **`renderTextAlongPath`** caches path length and glyph
sample points per `d` string and distance, so a text element parses its path once rather than once per
glyph per frame. Both are pure functions of their inputs; no output changes.

### Known limitation

**Group `globalCompositeOperation`** — unchanged. A group's blend mode is still applied to each
descendant independently rather than to the subtree as a unit, so it does not match SVG's
`<g mix-blend-mode>`. True group compositing needs an offscreen layer and real blending, neither of
which the jsdom stub can express; left for the pixel harness.

## @ripl/svg

_No entries yet._

## @ripl/dom

_No entries yet._

## @ripl/node

_No entries yet._

## @ripl/terminal

_No entries yet._

## @ripl/3d

### Projection

**`mat4Perspective`** and **`mat4Orthographic`** — **behaviour**, breaking. Depth maps to the
WebGPU convention: near → `0`, far → `1`, instead of the OpenGL `[-1, 1]`. WebGPU clips to
`0 ≤ z ≤ w`, so under the old matrices everything between `near` and roughly
`2·near·far/(near+far)` fell outside the clip volume and was discarded — with the default
60°/0.1/1000 frustum, anything closer than ~0.2 units vanished on `WebGPUContext3D` while still
rendering on `CanvasContext3D` — and what survived was compressed into the upper half of the depth
buffer, costing about a factor of two in depth resolution. `out[10]` and `out[14]` therefore hold
different values, and **`Context3D.project(...)[2]` (and so `Shape3D.zIndex` on the CPU path) now
spans `[0, 1]` rather than `[-1, 1]`**. Depth is still monotonic with distance, so painter's
sorting and picking are unaffected; rescale any code comparing a projected depth against a literal.

**`Context3D.setOrthographic`** / **`Context3D.updateProjectionMatrix`** — **behaviour**. The
orthographic frustum is retained and replayed whenever the projection is rebuilt.
`updateProjectionMatrix` built a perspective matrix unconditionally and `rescale` calls it on every
size change, so an orthographic chart silently gained perspective distortion on the first window
resize while `camera.projection` still reported `'orthographic'`. It does **not** re-fit the
frustum to the new aspect ratio — the caller owns that, and `Camera` recomputes it on its next
flush. New **`Context3D.projectionMode`** accessor (**API**, additive) reports which projection is
live.

**`mat4LookAt`** — **behaviour**. An `up` parallel to the view direction falls back to a
perpendicular axis instead of yielding `xAxis = [0, 0, 0]`, and an `eye` equal to `target` returns
the identity instead of a matrix of NaN. `setCamera([0, 5, 0], [0, 0, 0], [0, 1, 0])` used to
project every point in the scene onto the viewport centre.

**`mat4TransformDirectionInverse`** — **API**, additive. Transforms a direction by a matrix's
transposed upper-3×3, i.e. the inverse rotation for a rigid transform.

### Face rendering

**`CanvasContext3D`'s deferred face draw** — **behaviour**. Faces are painted with the drawing
state they were projected under: element and group opacity (composited multiplicatively),
compositing operation, filter, shadow, line style, and the element's composed **2D transform**.
The flush ran inside `markRenderEnd` at render depth 0, after every element `restore()` and
`popGroup()`, so a face was painted with none of it. `group{opacity: 0.2} > Cube` rendered fully
opaque, and a 3D chart inside a `group{translateX: 40}` stayed put while the 2D axes moved — even
though `cube.getBoundingBox()` did include the translate. **Scenes that were compensating for the
missing transform or opacity will now double-apply it.**

**`ProjectedFace3D.state`** and **`ProjectedFaceState3D`** — **API**, additive. The captured state
each face is painted with. The property is optional, so a hand-built `ProjectedFace3D` still
compiles and still paints — just with no state applied. Faces sharing one state object are painted
in a single save/restore scope, so **object identity is load-bearing**: build one state per shape,
not one per face.

**`Context3D.captureFaceState`** — **API**, additive. Snapshots the drawing state for a face.

**`CanvasContext3D.flushFaces`** — **API**, additive — and **behaviour**. Faces depth-sort within a
flush rather than globally across the frame, and the buffer is drained as it is painted. Every 2D
paint operation (`applyFill`, `applyStroke`, `drawImage`, `applyClip`) flushes first, so a `Text`
label or legend added after a 3D series paints **on top of** it rather than underneath, and so do
the renderer's debug overlays. A 2D element or a clip sitting between two 3D shapes now separates
them into different sorting runs, so they no longer interleave by depth. `popGroup` also flushes
when a clip was installed inside the group, which it is about to unwind — a group-scoped clip and
an identical root-level clip now mask 3D geometry the same way.

**`Context3D.faceBuffer`** — **behaviour**. Reset at the start of every render pass by the base
class, and drained as faces are painted. Only `CanvasContext3D` used to clear it, so any other
`Context3D` accumulated faces across frames without bound. Do not read it after a frame; it is
empty.

**`CanvasContext3D.gradientBounds`** — **API**, removed (the override; the mixin hook remains).
It resolved gradients against `getBoundingBox()` (the world box), but a canvas gradient resolves in
user space where the CTM already carries the element's and its groups' transforms — so they were
counted twice and a hosted 2D element's gradient was offset by exactly its own transform. It was
dead for 3D shapes either way, since `_drawFace` assigns `fillStyle` per face.

**`CanvasContext3D.supportsPathCaching`** — **behaviour**. Returns `true`, matching
`CanvasContext`. Hosted `Shape2D`s re-traced their path every frame.

**`Shape3D`'s face shading** — **behaviour**. A declared `face.normal` is transformed into world
space by the model matrix. The `??` fallback was world-space and the declared branch model-space,
so every element that hard-codes normals — `Cube`, `Plane`, `Cylinder` caps, `Cone` base — kept
byte-identical face colours through a full rotation while a `Sphere` re-shaded correctly. The GPU
shader already did this, so the two backends painted the same scene differently.

**`Shape3D.render`** — **behaviour**. A `fill` that `parseColor` cannot read (a named colour like
`'red'`, a gradient, `currentColor`) no longer throws. It degrades to the raw style string on the
CPU path — as `_renderCPU` always intended — and to the default grey in the GPU mesh, which needs
numeric channels. The unguarded `triangulateFacesFlat` used to read channel 0 off `undefined` and
throw out of the whole render pass.

**`Shape3D.render`** — **behaviour**, breaking. Throws a diagnostic error when the context is not a
`Context3D`, instead of `TypeError: ctx.submitMesh is not a function`. New
**`contextIsContext3D`** type guard (**API**, additive).

**`Shape3D.render`** — **behaviour**. `submitMesh` is only called on a `'gpu'` context. It is a
no-op on the CPU path, but the interleaved mesh was still built and discarded every frame — about
33 KB per 16×12 sphere.

### Element state

**`Shape3D.interpolate`** — **behaviour**. The returned tick invalidates the cached face geometry.
`Element.interpolate` writes `state[key]` directly, the one path that bypasses `setStateValue` —
the face cache's only invalidation hook — so a transition on `size`, `radius`, `segments`, `width`,
`tube` or any other geometry property finished with the new state value and a mesh still built from
the old one. `x`/`y`/`z` and the rotations animated fine, because `getModelMatrix` reads the live
accessors, so a transition on `{ x, size }` moved but did not grow.

**`Shape3D.getBoundingBox`** — **behaviour**. No longer cached (`_boundsCacheable` is `false`). The
box is projected through the context's camera, which no element state version can see, so it froze
at the first camera position until an unrelated state write happened to bust it — poisoning
gradient bounds, the renderer's debug outlines, and `intersectsWith`'s fallback box test.

**`Shape3D.zIndex`** — **behaviour**, breaking. Derived from the depth of the shape's **nearest
projected face**, on both render strategies. The CPU path used the mean of the shape's face depths
and the GPU path the shape's origin, while painting sorts per face — so a shape spanning depth
could have its nearest face painted in front of another shape while its mean sat behind, and a
click reported the wrong element. The two strategies did not agree with each other either.
**Hit-test ordering between overlapping 3D shapes changes.**

### Lighting

**`Context3D.getLightDirectionForRender`** — **behaviour**, breaking. `lightMode: 'world'` and
`'camera'` were exchanged: both consumers dot the result against a **world-space** normal, so
pushing the light through the view matrix is exactly what makes it follow the camera. The
documented default `'world'` re-lit every face as the camera orbited a static scene, and `'camera'`
froze the lighting in world space. `'world'` is now the identity, and `'camera'` reads
`lightDirection` as camera-relative and carries it into world space through the inverse view
rotation — note the old formula was not even correct for camera mode; it aimed the lamp backwards.
**A scene that selected `'camera'` to get world-fixed lighting must now say `'world'`, and vice
versa.**

### Camera

**`Camera`** (constructor) — **behaviour**. Attaches no touch listeners and does not set
`touch-action: none` when every interaction is disabled, and a touch gesture is only
`preventDefault`ed when the enabled interactions can act on that finger count. It used to attach
`touchstart`/`touchmove`/`touchend` unconditionally and `preventDefault` before consulting the
flags, so a chart built with `interactions: { zoom: false, pivot: false, pan: false }` stopped a
phone scrolling past it and moved the camera not at all.

**`Camera.orbit`** — **behaviour**. A no-op when the camera sits on its target, rather than
dividing by zero into an all-NaN view matrix that blanked the scene permanently with no error.

**`Camera.zoom`** — **behaviour**. Clamps so the target cannot cross the near plane. It clamped to
`dist - 0.01` while `near` defaults to `0.1`, so a full zoom-in emptied the frustum.

### Context construction

**`Context3D`** (constructor) — **API**, additive, and **behaviour**. Takes a trailing
`renderStrategy` argument, applied **after** the caller's `meta`. It is the backend's invariant,
not a preference: `new WebGPUContext3D(…, { meta: { renderStrategy: 'cpu' } })` used to route every
shape into the CPU painter, which that class neither draws nor clears — a blank canvas plus a face
buffer growing without bound. A `meta.renderStrategy` supplied by a caller is now ignored.

### Known gaps (decided, not fixed)

**No back-face culling on the CPU path.** Every face of a closed shape is transformed, shaded,
projected, sorted and filled — roughly double the work, and with `fill` alpha below 1 the hidden
back faces visibly bleed through. Left as-is deliberately: a face's winding is whatever the element
author emitted, and rejecting on `dot(normal, viewDir)` would silently drop geometry from any shape
that is not a closed, consistently wound solid. The GPU pipeline makes the same call
(`cullMode: 'none'`). Recorded at `Shape3D._renderCPU`.

**No near-plane clipping on the CPU path.** `mat4TransformPoint` performs the perspective divide
with no `w` sign test, so a point behind the eye comes back mirrored through the origin and
geometry straddling the camera renders inside-out. Clipping is a rasteriser's job — the GPU backend
does it in hardware — and doing it in a point transform would mean returning something other than a
point. Keep the near plane in front of the scene. Recorded at `mat4TransformPoint`.

**A group-scoped clip fragments the depth sort.** Confining a clip to its group requires flushing at
the group boundary, so 3D shapes in different clipped groups no longer inter-sort by depth. That is
the same trade every 2D compositing boundary makes, and the alternative was a clip that silently
did not apply.

## @ripl/webgpu

**`WebGPUContext3D.rescale`** — **behaviour**. Reads `factory.devicePixelRatio` rather than
`window.devicePixelRatio`, like every other backend. `scaleX`/`scaleY`/`scaleDPR` were derived from
the factory while the canvas backing store and the hit-canvas transform came from `window`, so any
consumer overriding the factory value (tests, offscreen or server rendering, a DPR cap) had pointer
coordinates scaled by one ratio and hit paths by the other and picking silently missed by that
factor. `window` may also be absent outside the DOM, which yielded `element.width = NaN`.

**`WebGPUContext3D.rescale`** — **behaviour**. Gates on the logical size instead of the canvas
backing store. A fresh `<canvas>` is 300 × 150, so a host measuring exactly 300 × 150 CSS px at DPR
1 returned early forever: `width`/`height` stayed `0`, the depth texture was never created, and the
canvas was permanently blank. It also bails when the context is destroyed, so a late resize cannot
allocate textures nothing will free.

**`WebGPUContext3D.applyFill`** / **`applyStroke`** / **`applyClip`** / **`drawImage`** /
**`createText`** — **behaviour**. Still no-ops, but they now `console.warn` once. `createPath`
returns a real `CanvasPath`, so a `Shape2D` traced its path, painted nothing, and stayed
hit-testable with no diagnostic at all — invisible but clickable. A warning rather than a throw:
a mixed 2D/3D scene should lose its labels, not its geometry. **2D elements remain unsupported on
this backend**; render them on a separate canvas layer, or use `createContext` from `@ripl/3d`.

**`WebGPUContextOptions.clearColor`** — **behaviour**, breaking. Documented and treated as
**straight** (non-premultiplied) RGBA, and premultiplied on the way in. The surface is configured
`alphaMode: 'premultiplied'`, so `[1, 0, 0, 0.5]` was out of gamut and implementation-defined. A
caller already passing premultiplied values must stop. The default `[0, 0, 0, 0]` is unaffected.

**`WebGPUContext3D.destroy`** — **behaviour**. Calls `gpuContext.unconfigure()` and nulls the depth
and MSAA textures. The swap chain was left configured against a canvas about to detach.

**`WebGPUContext3D`'s render pass** — **behaviour**. Depth and MSAA texture views are created with
their textures rather than twice per frame. Views are immutable, so the per-frame pair was pure
garbage.

**`GeometryManager.flush`** — **behaviour**, breaking. Returns `null` once `destroy()` has run
instead of recreating GPU buffers on a device it has already released (which raises validation
errors on real hardware). **The existing test `'Should create fresh buffers after destroy'` asserted
the defect** and has been rewritten as `'Should allocate nothing after destroy'`.
`GeometryManager` is a public export, so this is reachable directly even though `WebGPUContext3D`
guards every call site.

**`GeometryManager.destroy`** — **behaviour**. Clears `_submissions`, which retained the last
frame's vertex and index typed arrays from a destroyed manager.

**`WebGPUContext3D`** — inherits the `@ripl/3d` projection, orthographic-resize and
`renderStrategy` changes above.
