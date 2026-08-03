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

_No entries yet._

## @ripl/3d

_No entries yet._

## @ripl/webgpu

_No entries yet._
