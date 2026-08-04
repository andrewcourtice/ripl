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

### Pointer payloads

**Element `click`, `dragstart`, `drag` and `dragend` payloads** — **behaviour**. `x`/`y` (and
`startX`/`startY`) carry **CSS pixels**, not device pixels. Element `mousemove` already reported CSS
pixels, so the same pointer position produced payloads differing by the device pixel ratio depending
on which event you read — `packages/charts/src/core/interaction.ts` documents `InteractionPoint` as
"chart pixels" and feeds `onEnter`/`onLeave` from `mousemove` while `onClick` reads `click`. On a
non-retina display nothing moves. Elsewhere, multiply by `devicePixelRatio` — or better, map through
`Context.toSurfacePoint` — to recover the old values. Hit testing is unchanged: it still runs in
surface space.

### Pointer lifecycle

**`DOMContext.disableInteraction`** — **behaviour**. Emits `mouseleave` on every element that was
hovered before dropping the set, and cancels the pending hover frame. It used to clear
`_activeElements` silently, so a bar stayed enlarged and its tooltip stayed painted with nothing left
that could ever produce the leave. `destroy()` delegates here, so teardown is complete when it
returns rather than a frame later. Any `mouseleave` handler must therefore tolerate running during
teardown.

**Surface `mouseleave`** — **behaviour**. Also unwinds the hovered element. The element-level
`mouseleave` was only ever emitted from the hover hit test, which only runs on `mousemove`, so
leaving the canvas left the last-hovered element hovered forever — the reason chart tooltips stayed
on screen after the pointer left.

**`mouseup`** — **behaviour**. Also bound at the window, so a release outside the surface ends the
drag. A gesture released off-canvas previously never emitted `dragend` and resumed on re-entry with
no button held. A `dragend` may now arrive with coordinates outside the surface bounds (including
negatives); clamp if your handler assumes otherwise.

**`mousedown`** — **behaviour**. Assigns drag state unconditionally instead of only when something
is hit, so a press on empty canvas clears the previous gesture's `dragElement` and origin rather than
making it the next gesture's delta baseline.

**`click`** — **behaviour**. Suppressed once for the gesture that ended a drag. The DOM fires `click`
after `mouseup`, so a drill-down or selection handler fired at the end of every drag. A click below
the drag threshold is unaffected.

### Reconciliation

**`reconcileNode`** — **behaviour**. Sibling vnodes sharing an id each get their own DOM node.
Duplicates previously collapsed onto one node — the second overwrote the first's attributes and
subtree, and the reorder step desynchronised — so a duplicate key in chart data silently dropped a
mark and reordered the rest. Node identity is stable across passes.

**`reconcileNode`** — **behaviour**. Nodes matched by `excludeSelectors` keep their position instead
of drifting to the end of the parent. The reorder step indexed the parent's children directly, which
counts excluded nodes, so managed children were inserted before them and pushed them rightward.
Harmless for a `<defs>`; not for a positioned overlay.

### Resize

**`onDOMElementResize`** — **behaviour**. The `window.resize` fallback reports the **content box**,
matching what the `ResizeObserver` branch reports via `entry.contentRect`. It reported the border box
before, so on a padded host the two branches of one function disagreed and the backing store was
sized to a box the surface was never stretched over. Only reachable on engines without
`ResizeObserver`.

**`onDOMElementResize`** — **behaviour**. Returns an inert disposable outside a browser rather than
throwing `ReferenceError: window is not defined`. `@ripl/dom` ships `sideEffects: false`, so an SSR
consumer can import this helper directly.

### Export

**`createCanvasExport`** — **API**, additive. The returned `ContextExport` implements `release()`,
revoking every object URL `toURL()` handed out. Without it each URL pinned its blob for the
document's lifetime. Call `release()` when you are done with an export; it is safe to call
repeatedly.

### Navigator

**`DOMNavigator`** — **behaviour**. Lifting one finger of a pinch hands the survivor back to panning.
It previously cleared every gesture flag, leaving a finger still on the surface matching no branch at
all until it was lifted and re-pressed.

**`DOMNavigator`** — **behaviour**. Every tracked pointer is captured on `pointerdown`, not just the
ones that pan or brush. A secondary-button gesture or the second finger of a pinch released off the
element never reached the cleanup, and the leaked pointer id made the next single-touch gesture read
as a pinch — a one-finger pan that zoomed.

**`DOMNavigator`** — **behaviour**. The element origin is cached and invalidated on resize and
scroll, instead of `getBoundingClientRect` being called on every `pointermove`. If you move the
element by means that fire neither (a transform on an ancestor, say), invalidate by resizing or
recreating the navigator.

**`DOMNavigatorOptions.interactions`** — **behaviour**. `touchAction` is left alone when every
interaction resolves to disabled. `{}` and `{ zoom: false, pan: false, brush: false }` are both
truthy, so they used to suppress native scrolling over the chart with no gesture wired up.

## @ripl/node

**`factory.measureText`** — **behaviour**. Measures in braille cells — 2 logical units per character
and ascent 4 at the default `10px monospace`, descent 0 — scaled by the requested font size, and
anchors `actualBoundingBox*` on `textAlign`. It reported 8px per character with ascent 8 and descent
2 regardless of the options passed, so text boxes were roughly 4x too wide and 2.5x too tall against
what the terminal paints, and centred or right-aligned text was anchored at the wrong corner. Core
falls back to this only before an element's first paint; anything rendered measures through
`TerminalContext`. `textBaseline` is deliberately not modelled — the terminal paints one cell per
glyph with no baseline variation.

**`factory.requestAnimationFrame`** — **behaviour**. Returns an **unref'd** timer and invokes its
callback with a `DOMHighResTimeStamp`. The render loop re-arms every frame with `autoStart` on, so a
ref'd timer meant a process that drew one static chart never exited. A script that relied on the
render loop to keep the event loop alive must now hold it open itself.

**`factory.createElement`** and **`factory.createElementNS`** — **behaviour**. Return a duck-typed
stub (`getContext()` → `null`, `getTotalLength()` → `0`, attribute accessors) instead of `{}`. Core's
graceful-degradation guards are written against exactly those probes and could never run — the first
property access threw a raw `TypeError`. `getPathLength` now returns `0` off-platform rather than
throwing.

**`factory.createContext`** — **behaviour**. Builds one `TerminalOutput` per process rather than one
per context, and that output multiplexes its resize subscribers behind a single `SIGWINCH` handler;
ten scenes used to trip Node's `MaxListenersExceededWarning`. A `TerminalOutput` passed as the target
is honoured; any other target warns that it cannot be, instead of being discarded in silence.

**`createTerminalOutput`** — **behaviour**. `onResize` registers its `SIGWINCH` handler on the first
subscription and removes it with the last, rather than one handler per subscriber.

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

### Every 3D scene renders differently

The two shading fixes above are the only changes to what a 3D scene looks like, and between them
they touch every scene that moves. Nothing about the diffuse or ambient maths changed —
`computeFaceBrightness`, `shadeFaceColor` and the `0.3` ambient term are untouched on both the CPU
and GPU paths. What changed is the two inputs that were wrong, so **expect a visible difference and
treat it as the fix arriving, not as a regression**:

- **A camera that orbits** now leaves the lighting where it is instead of carrying it around, because
  the default `lightMode: 'world'` finally means what it says: a lit face stays lit and the camera
  simply views it from elsewhere. Every shape page under `apps/website/src/docs/3d/shapes/` calls
  `startRotation`, so all of them change.
- **Geometry that spins** now re-shades as it turns. Anything built from elements that hard-code
  normals — `Cube`, `Plane`, `Cylinder` caps, `Cone` base — previously held byte-identical face
  colours through a full rotation. `apps/website/src/demos/jet-engine`, `jet-engine-webgpu` and
  `piston-mechanism` all spin such parts.

The fix also makes the pairing between a light and what moves matter for the first time. An orbiting
camera under a world-fixed light can look *more* static than it did before, because that is what a
fixed light does when nothing in the scene actually moves: the same faces stay lit for the whole
orbit, and the shape falls dark as the camera swings behind the light. Pair an orbiting camera with
`lightMode: 'camera'`, which now genuinely means "headlight", and keep the default `'world'` for
scenes that rotate their objects under a static camera. The website's shared `startRotation` helper
sets `'camera'` for exactly this reason; the jet-engine and piston demos spin geometry and stay on
`'world'`.

One trap is worth calling out, because the old behaviour hid it. A world-fixed light aimed down an
object's body diagonal sits at equal angles to three of its faces: the default
`LIGHT_DIRECTION.topLeftFront` (`[-0.577, -0.577, -0.577]`) lights a cube's `+X`, `+Y` and `+Z` at
an identical `0.704`, so correct shading renders it as an edgeless hexagon. The counter-rotating
light used to break that tie by accident. Offset the light, or switch to `'camera'`, rather than
reading it as a regression.

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
