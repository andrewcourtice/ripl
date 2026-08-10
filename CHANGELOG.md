# Changelog

Notable changes to the published `@ripl/*` packages. Every package in the monorepo shares one
version, so an entry covers all of them and names the package each change lands in.

Released builds and their auto-generated commit lists live on
[GitHub Releases](https://github.com/andrewcourtice/ripl/releases).

## Unreleased

### 3D lighting, materials and textures

`@ripl/3d` gains a full shading model. Everything below is additive: a scene that
configures none of it renders as it did before.

**Lighting.** A context now carries a list of lights rather than a single direction.
Ambient, hemisphere, directional, point and spot lights are supported, each with a
colour and intensity, and — where meaningful — distance falloff, decay, cone angle and
penumbra. Falloff and cone attenuation follow the same conventions as three.js. A render
pass carries up to eight lights.

The default rig is an ambient light at `0.3` plus a directional at `0.7`, which resolves
to exactly the flat shading model that came before, and `context.lightDirection` /
`context.lightMode` remain as shorthands for that directional light.

**Materials.** `Shape3D` accepts a `material` describing colour, opacity, specular
highlights and shininess, emissive light, which side is drawn, wireframe, flat or smooth
shading, and per-vertex colours. Every property is optional and defaults to the previous
behaviour; the colour falls back through material, then `fill`, then a neutral grey.

**Textures.** A material can carry an image `map`. `Texture` wraps any image a canvas can
draw and a GPU can copy from, with wrap modes, filters, flip, repeat and offset. Every
built-in primitive emits texture coordinates using three.js's conventions.

**Geometry.** `Shape3D` gains per-axis `scale`. `Group3D` composes a transform into every
shape beneath it. Three new primitives: `Mesh` from an explicit face list, `Parametric`
from a function of two parameters, and `BezierSurface` from bicubic patches.

**Raycasting.** `Context3D.raycast` and `Shape3D.raycast` walk the real triangles,
reporting distance, world point, face, normal and texture coordinate. Unlike the pointer
hit test, which flattens a shape to its silhouette, a ray passes cleanly through the hole
of a torus.

### Terminal rasterizer interface

`@ripl/terminal`'s `Rasterizer` interface changed so pixels can be composited rather than
overwritten. A custom implementation needs three changes:

- `setPixel(x, y, color)` and `setChar(col, row, char, color)` now take a `TerminalColor` —
  an `[r, g, b, a]` tuple, or `null` for the terminal's own default foreground — instead of
  a pre-baked ANSI escape string. Alpha is no longer folded into the colour before it
  arrives.
- Add `cellWidth` and `cellHeight`. Text placement and teardown read them instead of
  assuming braille's 2×4 cell, so a rasterizer with different cell geometry now positions
  text correctly.
- A cell can only emit one colour; deriving it from the pixels it covers is the
  implementation's job. `BrailleRasterizer` uses the alpha-weighted mean of its lit dots.

**Fog.** `context.fog` blends distant geometry towards a colour, linearly or
exponentially, resolved identically by both backends.

### Fixed

- A degenerate face shaded black on the Canvas backend and as facing up on the WebGPU
  backend. Both now agree.
- `LIGHT_DIRECTION`'s diagonals were truncated decimals and so fractionally short of unit
  length, biasing every diagonal light slightly dim. They are now normalized exactly.
- `interpolateVector3` was exported but unreachable: `getInterpolator` chose from a closed
  list, and `interpolateBorderRadius` — whose predicate matches any array of up to four
  numbers — claimed a `Vector3` first. `@ripl/core` gains a `registerInterpolator` seam,
  and `@ripl/3d` registers on load.
- `Shape3D` passed its model matrix where a normal matrix was needed, which was only
  correct under uniform scale.
- `scale` worked as a setter but was silently ignored as a construction option.

### Removed

- `triangulatefaces` from `@ripl/webgpu`, an unused byte-for-byte duplicate of the
  triangulation in `@ripl/3d`. Use `triangulateFacesFlat` and `triangulateFacesIndices`.

## v1.2.0 — 2026-08-06

The first release after 1.0, and a large one: 293 commits across 69 pull requests, of which **29 are
breaking**. There was no 1.1.0 — the version moved from 1.0.0 straight to 1.2.0.

Almost all of it comes from two pieces of deliberate work. The first is a **rendering-context
audit**: every backend — canvas, SVG, DOM, terminal, node, 3D and WebGPU — was measured against the
contract the base `Context` declares, and the gaps were closed. The second is a **coordinate-space
consolidation**: the boundary between logical and surface coordinates used to run through the public
API, and it now sits inside the backends.

Both change what existing code renders and how it hit-tests. Nothing here is a rename for its own
sake, but a scene that compensated for a bug will now be compensating twice. Read the breaking
changes before upgrading.

### Migration checklist

The short version. Full detail is in the per-package sections below and in the two migration
documents they link to.

1. Search for `toSurfacePoint`. Every call that existed to feed `intersectsWith`, `isPointInPath`,
   or `isPointInStroke` should be deleted — those methods take logical coordinates now.
2. Search for `setTransform`. If you passed the device pixel ratio to compensate for the old
   replace-outright behaviour, drop it; the backend supplies it.
3. Search for `series[].yAxis` in chart configs. It takes an axis `id` now, not an index.
4. Re-record any snapshot of terminal or SVG output. Both backends emit different bytes.
5. If you set `lightMode` on a 3D scene, swap it — `'camera'` and `'world'` were the wrong way
   round.
6. If you read `Context.scaleDPR` or `Context.buffer`, both are gone.

### Breaking changes

#### Coordinate spaces

Covers `@ripl/core`, `@ripl/canvas`, `@ripl/svg`, `@ripl/dom`, `@ripl/3d` and `@ripl/webgpu`. Full
detail in [`docs/migrations/coordinate-spaces.md`](./docs/migrations/coordinate-spaces.md).

- **Every coordinate crossing the public API is in logical space** — CSS pixels, unaffected by the
  device pixel ratio, origin at the top-left of the context's own element. `Element.intersectsWith`,
  `Shape2D.intersectsWith`, `Context.hitTest`, `Context.isPointInPath` and `Context.isPointInStroke`
  all take logical points. Callers that converted a pointer payload with `toSurfacePoint` now double
  the point on a retina display and must stop. (`3261fd2`, `d27af48`)
- `Context.toLogicalPoint` and `Context.toSurfacePoint` remain public, reframed as the seam for
  authors of custom contexts. A consumer never needs to call either. A custom `Context` that forwards
  `isPointInPath`/`isPointInStroke` to a native canvas test must now convert the point itself.
- **`CanvasContext.setTransform` composes onto the surface's device-pixel base** rather than
  replacing the current matrix outright. `setTransform(1, 0, 0, 1, 0, 0)` previously wiped the ratio
  matrix and halved everything drawn afterwards on a retina display. Code that compensated by passing
  the ratio itself applies it twice now and must drop it. `transform`, `rotate`, `scale` and
  `translate` are relative and unchanged. (`1c99239`)
- **3D and WebGPU hit testing works above a device pixel ratio of 1.** `Shape3D` traced its hit path
  from `Context3D.project`, which emits logical coordinates, and tested it against a point already
  scaled to device pixels — so hits missed by exactly the ratio. No action required.
- `Context3D.rescale` and `WebGPUContext.rescale` emit `resize` *after* the device-scaled
  `scaleX`/`scaleY` and the rebuilt projection are in place. A `resize` handler that read
  `Context.scaleX` to compensate should stop.

#### @ripl/core

Full detail in [`docs/migrations/context-audit.md`](./docs/migrations/context-audit.md).

- **`Context.hitTest` orders results topmost-first by paint order alone**, not by additive `zIndex`.
  `hitElements[0]` is now the element actually drawn on top; a scene relying on a high `zIndex` to
  win a hit across group boundaries must reorder its groups instead. (`613295c`)
- **Element opacity composites multiplicatively.** A leaf with `opacity: 0.5` inside a group with
  `opacity: 0.5` renders at `0.25`, not `0.5`. Assigning `Context.opacity` directly is unchanged.
  (`3abb068`)
- **A gradient or pattern on a `Group` resolves against the group's own composed child box.**
  Previously it took an unrelated sibling's box on canvas and each leaf's own box on SVG. (`29a99ed`)
- **Stroke hit testing uses the element's own `lineWidth`, `lineCap`, `lineJoin`, `miterLimit` and
  dash pattern.** Hit areas grow for any element with `lineWidth > 1` and shrink below 1. (`c212d69`)
- **Text is measured through the bound context**, so a backend whose `measureText` disagrees with the
  platform factory reports different bounding boxes. `MeasureTextOptions.context` is **removed** — no
  factory implementation ever read it. (`5e4a586`)
- **Box hit testing honours `Context.scaleX`/`scaleY`** rather than `scaleDPR`. A custom `Context`
  that scales its surface without updating those scales must override
  `toLogicalPoint`/`toSurfacePoint`. (`84ce519`)
- **`Context.scaleDPR` is removed.** It was assigned once in the constructor and never read.
  (`42232ba`)
- **`Context.buffer` is removed.** SVG always commits at the end of the outermost render pass.
  (`3d356a0`)
- **`EventBus`'s destroyed flag is no longer a `#private` field.** A `#private` field throws when the
  receiver is a `Proxy`, so wrapping any `EventBus` subclass in Vue's `reactive()` made `destroy()`
  fail. `EventBus` is the base of `Element`, `Context`, `Scene`, `Renderer` and `Navigator` — that is
  every object a consumer would hand to a reactivity library. (`88b7feb`)

#### @ripl/canvas

- **Assigning `''` to `Context.fill`/`.stroke` is ignored** rather than clearing the tracked paint,
  matching native canvas. Use a transparent colour to paint nothing. Resolved paint strings are now
  pushed and popped with the save/restore stack. (`aae0812`)

#### @ripl/svg

- **A clipped element is nested inside a generated `<g id="${pathId}:clip">`** rather than carrying
  its own `clip-path` attribute. Markup assertions and CSS selectors that walked straight from the
  surface to a clipped node must account for the scope element. A gradient or pattern on a `Group`
  resolves once at the group boundary. (`6e88739`)
- **Hit testing maps the point into the element's own coordinate space**, so a click over a
  transformed element resolves to the element actually under the cursor. A scene that compensated —
  offsetting a hit target, or relying on a transformed element never being hit — should drop the
  compensation. Untransformed scenes are unaffected. (`d27af48`)

#### @ripl/dom

- **Element `click`, `dragstart`, `drag` and `dragend` payloads carry CSS pixels, not device
  pixels.** On a non-retina display nothing moves; elsewhere divide by `devicePixelRatio` to recover
  the old values. (`db904cc`)
- **`drag` reports `deltaX`/`deltaY` as the total since the drag started**, not the step since the
  previous event — which is what both event maps already documented. Frame-rate independent, and
  survives a dropped move. (`3fd0115`)

#### @ripl/terminal

- **`colorToAnsiFg` and `colorToAnsiBg` return `string | undefined`** and take an optional second
  opacity argument. `undefined` means do not paint (`''`, `none`, `transparent`, zero effective
  alpha); `''` still means paint uncoloured. Callers assigning straight into a string must handle
  `undefined`. Resolution now covers the 148 CSS named colours, and alpha is no longer discarded.
  (`da7ac1c`)
- **A paint that resolves to nothing draws nothing, opacity attenuates the emitted colour, and
  `applyFill` no longer also strokes.** All of these change the bytes written to the terminal.
  (`6a5751b`)
- **`rasterizeEllipse` takes `(cx, cy, rx, ry, rotation, startAngle, endAngle, counterclockwise,
  plot)`**, matching `rasterizeArc`. Callers passing `(cx, cy, rx, ry, plot)` must insert
  `0, 0, TAU, false` before `plot`. Strokes now honour `lineDash`/`lineDashOffset` and `lineWidth`,
  and `TerminalPath.arcTo` constructs the real tangent arc. (`85377a5`)
- **The ANSI form of `BrailleRasterizer.serialize` emits an SGR reset for uncoloured cells, `\x1b[K`
  after every row, and `\x1b[J` below the last one.** Re-record any snapshot of terminal output. The
  plain-text form (`{ ansi: false }`) is unchanged. (`e6230d4`)

#### @ripl/node

- **`factory.measureText` reports braille cell metrics** — 2 units per character at the default 10px
  font, ascent 4, descent 0 — rather than 8px per character with ascent 8 and descent 2. Text boxes
  shrink to what the terminal actually paints. Anything that compensated for the old numbers should
  drop the correction. (`1bb3d0e`)

#### @ripl/3d

- **`lightMode: 'camera'` and `'world'` were swapped.** A scene that set `'camera'` to get
  world-fixed lighting must now say `'world'`, and vice versa. (`4ce2ccc`)
- **Projected depth spans `[0, 1]` instead of `[-1, 1]`.** `mat4Perspective` and `mat4Orthographic`
  return different values for `out[10]` and `out[14]`, so `Context3D.project(...)[2]` and
  `Shape3D.zIndex` on the CPU path rescale. Ordering is unchanged — depth is still monotonic with
  distance — so painter's sorting and picking are unaffected, but code comparing projected depth
  against a literal must be rescaled. (`4343b5c`)
- **`Context3D`'s constructor takes a trailing `renderStrategy` argument**, and a caller-supplied
  `meta.renderStrategy` is ignored. `Shape3D` throws a diagnostic error when rendered into a
  non-`Context3D`; use the new `contextIsContext3D` type guard. **`Shape3D.zIndex` derives from the
  nearest face** rather than the mean (CPU) or the shape origin (GPU), so hit-test ordering between
  overlapping 3D shapes changes. `GeometryManager.flush()` returns `null` after `destroy()`.
  (`8cacded`)
- **`Context3D.faceBuffer` is drained as it is painted** rather than holding the whole frame, and
  `CanvasContext3D` no longer overrides `gradientBounds`. Faces depth-sort within a flush rather than
  globally across the frame, so a 2D element or a clip between two 3D shapes separates them into
  different sorting runs. `ProjectedFace3D` gains an optional `state`; a hand-built face without it
  still paints, just with no state applied. (`81c83cc`)
- **The camera zooms the way the wheel is pushed.** Wheel `deltaY` went into `zoom()` unnegated, so
  scrolling down zoomed in; pinch was inverted the same way. Both now use the navigator's exponential
  factor at the same sensitivity, so 2D and 3D respond identically to one gesture. (`4b6f88d`)

#### @ripl/webgpu

- **`WebGPUContextOptions.clearColor` is treated as straight (non-premultiplied) RGBA** and
  premultiplied on the way in. A caller already passing premultiplied values must stop. (`8cacded`)

#### @ripl/charts

- **`series[].yAxis` names an axis `id` instead of indexing `axis.y`.** Positional binding meant
  reordering the axis array silently re-pointed every series after the one that moved, and nothing
  failed — the chart just drew the wrong series against the wrong scale. `id` is required on a
  multi-axis entry, so omitting one is a compile error rather than a silent fallback at render time.
  A single y-axis keeps `id` optional. (`c93241a`)

  <!-- eslint-skip -->
  ```ts
  // Before
  series: [{ id: 'orders', value: 'orders', yAxis: 1 }],
  axis: { y: [{ … }, { position: 'right', … }] },

  // After
  series: [{ id: 'orders', value: 'orders', yAxis: 'orders' }],
  axis: { y: [{ id: 'revenue', … }, { id: 'orders', position: 'right', … }] },
  ```

- **Option and event names are aligned across charts.** Every rename is mechanical and behaviour is
  unchanged; there are no aliases. The canonical naming rules live in
  [`packages/charts/OPTIONS.md`](./packages/charts/OPTIONS.md), and each chart's generated option
  reference on the docs site is the current source of truth. (`15863ac`)

  | Chart | Before | After |
  |---|---|---|
  | Gauge | `minValue`, `maxValue` | `min`, `max` |
  | Gauge | `tickCount`, `showTickLabels`, `formatTick` | `ticks`, `tickLabels`, `tickFormat` |
  | Radar, radial bar | `maxValue` | `max` |
  | Polar scatter | `maxValue`, `angleTicks` | `max`, `sectors` |
  | Polar scatter | `series[].angle`, `series[].radius` | `series[].angleBy`, `series[].radiusBy` |
  | Bar, line, area, scatter | `series[].axis` | `series[].yAxis` |
  | Chord | `colors`, `labels` | `palette`, `groups` |
  | Heatmap | `colors` | `gradient` |
  | Box plot | `categories` | `categoryOrder` |
  | Radar | `point*` events | `marker*` events |
  | Chord | `arc*`, `ribbon*` events | `segment*`, `link*` events |
  | Treemap, packed circle, sunburst | `cell*` / `segment*` events | `node*` events |

  Payload types follow the event names — `RadarChartPointEvent` → `RadarChartMarkerEvent`,
  `ChordChartArcEvent` → `ChordChartSegmentEvent`, and so on. `format` always formats **values**;
  `tickFormat` always formats **tick labels**. An accessor that maps data onto a visual channel is
  suffixed `By` so it cannot be mistaken for a pixel measurement.

- **Gaps between chart elements come from a shared 8-point scale.** The axis title clears the longest
  tick label by 16px instead of 6px, and the title, legend and navigator bands are separated from
  their neighbours rather than sitting flush. Set `padding` explicitly to recover the tighter layout.
- **Axis ticks, labels, the axis line and the axis title animate on update.** A surviving tick slides
  to its new position, entering ticks fade in from where their value sat under the previous scale,
  and leaving ticks slide away. `chart.render()` on a cartesian chart therefore resolves when the
  axis transitions have settled. Pass `animation: false` for the previous immediate behaviour.
  (`9598ffa`)

#### @ripl/utilities

- **`numberSum` applies its iteratee to a numeric array.** The old contract short-circuited past the
  iteratee whenever the array held numbers, so a mapped sum over numbers silently returned the raw
  sum — a pie over `data: [10, 20]` with `value: v => v * 2` totalled 30 instead of 60 and its
  segments overflowed the circle. (`ecdcd7b`)

### Added

**Core**

- `on(EVENT_WILDCARD)` — `on('*')` — subscribes to every event emitted on a bus regardless of type.
  Each handler receives the `Event` with its own `type` intact; handlers for the concrete type run
  first, then the wildcard subscriptions. (`7acd6d8`)
- `mousedown`, `mouseup` and `click` are emitted on contexts *and* elements. `click` was declared in
  `ContextEventMap` and never fired; it does now. (`90150d1`)
- `Arc` gains `padWidth` — a constant-width gap between segments, measured in pixels rather than
  radians — and `borderRadius` actually rounds the corners. (`61b4c99`, `8aac6cc`)
- CSS named colours parse, so they tween like every other format. (`11055c3`)
- `createFrameBuffer` returns a `FrameBuffer` with a cancel handle. (`a5f33aa`)
- `ContextExport.release()` — an optional hook for releasing what an export retained. (`a11355e`)

**Charts**

- Segmented `lineStyle` for line, area and trend series — a different dash or width per segment.
  (`5bcdebb`)
- Radial segments draw as solid fills with a constant-width gap. (`8aac6cc`)
- A y-axis with nothing bound to it is skipped, and a hidden axis is torn down. (`03d2f4d`)
- `padding` defaults to 16 and accepts a number, a per-edge object or a tuple, on the chart and on
  the title, legend and tooltip alike. `legend.padding` previously had no effect at all. (`4531a5a`)

**Terminal**

- Strokes honour `lineWidth`. (`c9a14e9`)

**Devtools**

- Separate **Elements** and **Events** tabs in the panel. (`a5dd5dc`)
- Every event fired in a scene is recorded and shown on a timeline, with a scrub window and filters
  across both panes. (`84c2a81`, `df11236`)
- The extension reports the Ripl version it is inspecting. (`431ba05`)
- Element rows scroll sideways, and the tree expands in one click. (`dc53240`)

**Website**

- A graphing calculator demo — expression parsing, a preset catalogue and its own renderers.
  (`e86d51c`, `abcddd4`, `b8ed657`, `9dbba2d`, `150f36c`)
- Five new playground examples: pong, boids, a bezier editor, a particle fountain and a wave grid.
  (`abdad2a`, `a35a6ae`)
- Every configurable option is surfaced in the chart demos, grouped into a section per category, and
  a build check enforces that it stays that way. (`5e292eb`, `e8ff7b2`, `aafb23d`)

### Fixed

The bulk of this release. Grouped by package; the rendering-context audit's per-symbol detail is in
[`docs/migrations/context-audit.md`](./docs/migrations/context-audit.md).

- **Core** — render bookkeeping is exception-safe and open group boundaries close when a frame
  throws; the state stack unwinds at the scene root; the surface clears only at render depth 0;
  `hitTest` re-checks listeners instead of trusting its memo; 3- and 4-digit shorthand hex parses;
  the scene inherits the host's computed font from any DOM element surface; keyword lookup is guarded
  against inherited properties; debug bounding boxes draw in world space; an arc's `padWidth` gap
  carries to the centre of a hole-less sector, with the corner clamp guarded against `NaN`.
- **Canvas** — surface coordinates scale by the exact device pixel ratio, `resize` is emitted with
  those scales applied, the surface transform is reinstated on reset, a lone image dimension is
  honoured, path glyphs sit on the anchor their alignment draws from, and cached paint plus the
  backing store are released on destroy.
- **SVG** — arcs stay in the current sub-path, `maxWidth`, `fillRule` and composite operations are
  honoured, defs are swept after the reconcile rather than before it, and chart text is no longer
  selected on drag.
- **DOM** — every sibling and every excluded node keeps its position, a group that empties
  reconciles, the resize observer and the `window.resize` fallback measure the same box, the pointer
  origin stays current instead of being snapshotted once, and the navigator no longer strands fingers
  or forces layout.
- **3D** — declared face normals transform into world space, the face cache invalidates from the
  interpolator tick, the mesh colour is guarded before triangulating, and the camera no longer
  hijacks touch or collapses on degenerate input.
- **Charts** — hover highlight no longer erases elements and strands the chart; per-series paint
  reconciles on update, not only on create; secondary y-axis bindings are restored and axis labels
  stop reading `NaN`; layout resolves outside-in so axes and series agree; the cartesian furniture
  these charts advertise is actually drawn; sankey labels drawn outside the plot get room reserved;
  an unwrapped tooltip sizes to its content; open link and value arcs hit-test on their stroke; polar
  area grid value labels paint above the segments; radial segments take the same rest tint as bars.
- **Core and SVG** — cardinal spline geometry and SVG gradient units. (`c5cf184`)
- **Runtime** — core degrades gracefully on runtimes with a partial DOM. (`1c1084f`)

### Performance

- One bounded gradient and pattern parse memo, shared across both backends. (`95031ea`)
- 3D hit paths are built on demand rather than every frame. (`7e36750`)
- Canvas reuses the resolved gradient and path geometry. (`05ac217`)
- SVG memoizes the image encode and releases what teardown retained. (`35064d4`)
- Charts replace per-item `indexOf`/`find` scans with keyed lookups. (`60b858e`)

### Tooling and build

- Builds move from **tsup to tsdown**, bundling types without a separate `tsc` pass. JSDoc is
  stripped from the JS output and `@webgpu/types` ownership is corrected. (`51dfa9c`, `bece741`)
- The Node floor lifts to **24 LTS**. (`747b333`)
- Each chart's option reference is generated from the TypeScript definitions, so it cannot drift from
  the source. (`2ce6366`)
- The website's option-coverage checks extend to live demos, `.vue` components and docs snippets.
  (`d234d29`, `5369d40`, `d6d1c8f`)

### Documentation

- [`docs/migrations/context-audit.md`](./docs/migrations/context-audit.md) — every behavioural and
  API change from the rendering-context audit, per package, per symbol, with the consumer action
  named. Includes the gaps left open by decision: no CPU back-face culling or near-plane clipping,
  terminal transforms unimplemented, group `globalCompositeOperation` applied per child.
- [`docs/migrations/coordinate-spaces.md`](./docs/migrations/coordinate-spaces.md) — the logical
  space boundary, and a checklist for moving to it.
- Logical space is named at every public coordinate in the API docs. (`2873c78`)
- Each chart is documented with a worked configuration. (`ffd0760`)
- The charts migration page was retired; its option renames are carried by the generated per-chart
  option references, and by the table above. (`a035a01`)

**Full commit list**:
[`v1.0.0...v1.2.0`](https://github.com/andrewcourtice/ripl/compare/v1.0.0...v1.2.0)
