# Implementing the new playground examples and graphing calculator

## Context

The Ripl docs site ships two showcase surfaces: a live **playground**
(`/playground`) with 10 short snippets, and a **demos gallery** (`/demos/`) with 8
full-page demos. Both under-sell the library.

The playground's examples are all *static composition* — draw a circle, draw a
cube, tween a radius. Nothing there exercises a real frame loop with input, and
three of the library's most interesting capabilities have **zero** coverage:
the `dragstart`/`drag`/`dragend` element events, scene-graph throughput at
hundreds of elements, and animated 3D geometry. A newcomer opening the
playground sees a drawing toolkit, not an animation engine.

The demos gallery has no *tool* — every entry is either a dashboard fed by data
or a mechanism that animates itself. There is nothing a visitor can type into
and get a result from, which is the fastest way to convince someone a rendering
library is fast and correct.

This change adds five playground examples (including an interactive Pong game)
and a Desmos-style graphing calculator demo: a plot area you can pan, zoom and
orbit, an editable list of equations, auto-detected parameter sliders, and a
curated gallery of visually interesting 2D and 3D equations.

**Decisions already taken (do not revisit):**

| Decision | Choice |
|---|---|
| Calculator placement | Full-page demo at `apps/website/src/demos/graphing-calculator/`, registered in `data/demos.ts` |
| Expression engine | **mathjs 15.x**, number-only entry (`mathjs/number`), added to `@ripl/website` only — `packages/*` stay zero-dep |
| 3D backend | `@ripl/3d` CPU canvas context (not WebGPU), with adaptive mesh resolution |
| Playground examples | Pong, Boids flocking, Bézier curve editor, Particle fountain, Parametric wave grid (3D) |

## Non-goals

- No changes to any `packages/*` library source. Everything lands under
  `apps/website/`, plus one 1-line ESLint globals addition and one `data/demos.ts`
  entry. If a workstream believes it needs a library change, it must stop and
  escalate rather than widen the diff.
- No inequalities/shading, no regression/statistics, no LaTeX rendering, no
  saved-graph persistence beyond the URL hash. Say so on the page.
- No WebGPU variant of the calculator.

---

## Ground rules for every agent on this task

Read `AGENTS.md` and `CLAUDE.md` before writing a line. The ones that get
violated most often here:

- **One-line `//` comments or none.** Never a multi-line `//` block. Comments
  record *why* — a browser quirk, a constraint, the bug the line prevents. Most
  code should carry none.
- **JSDoc every exported symbol and every public class member**, including each
  property of `*Options`/`*State` interfaces. Getter-only for accessor pairs.
  This applies to the demo's own modules, not just library code.
- 4-space indent, single quotes, semicolons, trailing commas (except function
  params), one named import per line, blank line between every braced import
  group, `import type` split from value imports.
- **No `switch`** anywhere in `packages/*`/`apps/*` — except `apps/website/**`,
  which ESLint exempts. Prefer keyed object dispatch anyway; it reads better in
  a parser.
- `id-length` min 2, with `x y z t a b c d m n p q v w i j k` (and color
  channels) exempted. `u`, `e`, `f` are **not** exempt — `u`/`v` surface
  parameters must be named `paramU`/`paramV` or similar in code.
- Vue SFC block order is `<template>` → `<script>` → `<style>` (ESLint-enforced).
- Factory functions (`createX()`) over `new X()` in consumer-facing code.
- **No em-dashes** in JSDoc, comments, or user-facing copy. Commit `976855d`
  swept them out of demo source and code samples on purpose; use a colon,
  semicolon or parenthesis instead. Nothing enforces this, so it is on the
  author.
- **American spelling** in identifiers and prose: `color`, `normalize`,
  `randomize`, `gray`. The library is `parseColor`/`ColorRGBA` throughout, and
  the same commit converted the last British spellings in the demos.

---

## Phase 0 — Environment (blocking, do first, single agent)

Nothing else can be verified until the workspace installs. On a fresh container
`node_modules` is absent and the ambient Node may predate the `.nvmrc` pin of
24.18.1, which `engines` requires.

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
nvm install && nvm use          # reads .nvmrc → 24.18.1
yarn install
yarn workspace @ripl/website add mathjs
```

Then capture a **baseline** before any feature work:

```bash
yarn lint && yarn typecheck && yarn test
```

Record the coverage summary from that run (`.reports/coverage/coverage-summary.json`).
The thresholds in `vitest.config.ts` are a ratchet (`lines 70`, `statements 70`,
`functions 62`, `branches 57`) — the final `yarn test` must still clear them.

**Success criteria**

- `yarn.lock` contains mathjs and is committed. CI runs `yarn install --immutable`;
  an unstaged lockfile fails the build.
- `apps/website/package.json` lists `mathjs` under `dependencies`.
- Baseline `yarn lint`, `yarn typecheck`, `yarn test` all pass and the coverage
  numbers are written down for later comparison.

---

## Phase 1 — Contracts (blocking, single agent, small diff)

Parallel workstreams will collide unless the interfaces land first. This phase
writes **types and stubs only** — no logic — so Phases 2–5 can start together.

Create `apps/website/src/demos/graphing-calculator/types.ts` with the fully
JSDoc'd shared contracts:

- `ExpressionKind` — `'explicit-y' | 'explicit-x' | 'polar' | 'parametric' | 'implicit' | 'surface' | 'invalid'`
- `GraphExpression` — `{ id, source, kind, color, visible, error?, params: string[] }`
- `Viewport2D` — `{ xMin, xMax, yMin, yMax, width, height }`
- `Viewport3D` — `{ xMin, xMax, yMin, yMax, resolution }`
- `SampledBranch` — `{ points: Point[] }`; a curve is `SampledBranch[]` so
  discontinuities are representable
- `CompiledExpression` — `{ kind, evaluate(scope), params, error? }`
- `ParameterState` — `{ name, value, min, max, step, animating }`
- `GraphPreset` — `{ label, mode: '2d' | '3d', expressions: string[], params?, viewport? }`
- `GraphTheme` — resolved color tokens read from CSS custom properties

Also stub the module boundaries each workstream owns, exporting correctly-typed
no-op implementations so `tsc` and the Vue shell compile from day one.

**Success criteria**

- Every exported member carries JSDoc; every interface property carries its own
  `/** */`.
- `yarn lint` and `yarn typecheck` pass on the stubs.
- No workstream in Phases 2–5 needs to edit `types.ts` afterwards. If one does,
  it must be a coordinated amendment, not a silent local change.

---

## Phase 2 — Playground examples (parallel, independent of Phases 1/3–5)

Five new files in
`apps/website/src/.vitepress/components/playground/examples/`, each plain
**JavaScript** (not TS), authored against the ambient `context`, `scene`,
`renderer` globals (and `camera` in 3D mode) that `sandbox.ts` injects. Register
each in `examples/index.ts` — a `?raw` import plus an `EXAMPLES` entry.

> **Append, never prepend.** `ripl-playground.vue` derives the playground's
> default code from `EXAMPLES.find(e => e.mode === m)` — the *first* entry per
> mode. Inserting at the head silently changes what the playground opens with.

Sub-split across two agents; the files never overlap.

### 2a — `pong.js` (2D) · `boids.js` (2D)

**Pong.** The headline example, so it has to feel good, not just run.
- Player paddle follows the pointer via `context.on('mousemove', …)` **and**
  `ArrowUp`/`ArrowDown`/`W`/`S` via `window.addEventListener('keydown'/'keyup')`
  — Ripl has no keyboard API, this is raw DOM by design. `preventDefault()` the
  arrow keys so the parent page does not scroll.
- The example runs inside the playground's `<iframe sandbox="allow-scripts
  allow-same-origin">`; keyboard only reaches it once the user clicks inside.
  Pointer control must therefore work with zero focus ceremony, and the canvas
  should draw a "click to use keyboard" hint that disappears on first keydown.
- Fixed-timestep accumulator (`1/120 s`) driven from `renderer.on('tick')` so
  physics is frame-rate independent; clamp `deltaTime` to avoid a tab-restore
  tunneling the ball through a paddle.
- Swept collision (segment-vs-AABB), not point-in-rect — a fast ball must not
  pass through a paddle. Deflection angle derived from the impact offset along
  the paddle ("english"), speed increasing per rally with a cap.
- Beatable AI opponent: tracks the ball's predicted intercept with a reaction
  delay and a capped max speed, plus a small error term.
- Score via `createText`, center dashed net via `createLine` with `lineDash`,
  brief particle flash on paddle hits.
- `createRenderer(scene, { autoStart: true, autoStop: false })` — the default
  `autoStop: true` kills the loop when the pointer leaves the canvas.
- Re-layout on `context.on('resize')`.

**Boids.** 250–400 `Polygon`/`Path` agents steering by separation, alignment and
cohesion with a spatial hash so it is O(n·k) not O(n²); pointer acts as a
predator via `context.on('mousemove')`. Wrap at edges. Target 60fps.

### 2b — `bezier-editor.js` (2D) · `particle-fountain.js` (2D) · `wave-grid.js` (3D)

**Bézier editor.** The only example teaching `drag`. Four draggable control
points (`createCircle` with `.on('dragstart'|'drag'|'dragend')`), a cubic curve
drawn with `createPath` + `pathRenderer` calling `path.bezierCurveTo(...)`, and
the control hull as a dashed `createPolyline`. Note two hard requirements:
`cachePath: false` on the curve (its renderer reads point state held outside the
element), and elements only become hit-testable after their first render.

**Particle fountain.** Per-frame spawn/despawn with a recycled pool, gravity,
per-particle lifetime driving opacity, pointer attraction/repulsion. Cap the
live count and reuse elements rather than `scene.add`/`remove` churn; call
`element.destroy()` on genuine removal (see `ripple-background.vue` for the
lifecycle idiom).

**Wave grid (3D).** Subclass `Shape3D` in plain JS and return computed faces:

```
class WaveGrid extends Shape3D {
    constructor(options) { super('wave-grid', { segments: 40, time: 0, ...options }); }
    set time(value) { this.setStateValue('time', value); }
    computeFaces() { /* grid of quads, y = sin(r - t) / (1 + r) */ }
}
```

`setStateValue` invalidates the cached geometry, so animating `time` from
`renderer.on('tick')` rebuilds the mesh each frame. Keep it at **≤ 1,600 quads**
(40×40) so the CPU painter's algorithm holds 60fps. Slowly orbit the injected
`camera` so it reads as 3D on load.

### Also in Phase 2

`eslint.config.js` — the `ripl/playground-examples` block declares `context`,
`scene` and `renderer` as read-only globals but **not `camera`**, which
`sandbox.ts` also injects in 3D mode. Add it:

```
globals: {
    camera: 'readonly',
    context: 'readonly',
    renderer: 'readonly',
    scene: 'readonly',
},
```

**Success criteria**

- `yarn lint` passes on all five files with no disables.
- Each example is self-contained, under ~120 lines, and readable as a teaching
  artifact — a visitor should be able to change one number and see something.
- Loaded from the Examples dropdown in `yarn workspace @ripl/website start`,
  each runs with **no console errors** and no `playground-error` strip.
- Pong is playable with the mouse alone; keyboard works after a click inside the
  preview. The ball never escapes the field or tunnels a paddle across a
  60-second run.
- Boids, fountain and wave grid hold 60fps with the playground's FPS overlay on
  (Settings → debug FPS).
- `EXAMPLES` order unchanged at the head for both `2d` and `3d`.

---

## Phase 3 — Math engine (parallel; depends only on Phase 1)

`apps/website/src/demos/graphing-calculator/math/` — pure TypeScript, no Vue, no
Ripl. This is the most testable part of the demo and must be covered.

- `engine.ts` — lazy loader around `mathjs/number` (the number-only build; the
  full entry drags in `decimal.js`, `complex.js` and `fraction.js` for no
  benefit here). Verified against mathjs 15.2.0: that entry exports `parse`,
  `compile`, `evaluate`, `simplify`, `derivative`, `Parser`, and the AST node
  classes (`SymbolNode`, `OperatorNode`, `FunctionNode`, …) — everything below
  needs, plus `derivative` if a "show the derivative" toggle is added later.
- `classify.ts` — turn a raw input line into an `ExpressionKind` plus a
  normalized body: `y = …`, `x = …`, `r = …` (polar, accepting `theta`/`θ`), `(f(t), g(t))`
  (parametric), `… = …` with both `x` and `y` (implicit), `z = …` (surface), and
  a bare expression in `x` treated as implied `y =`.
- `compile.ts` — `math.parse()` → `.compile()` once per expression, evaluated
  with a **single reused scope object** (allocating a scope per sample is the
  main throughput trap). Wrap evaluation so a throw yields `NaN` rather than
  killing the frame.
- `params.ts` — walk the parsed AST for `SymbolNode`s that are not the
  expression's own variables and not mathjs builtins, and return them as the
  parameter list that drives the sliders.
- `sample.ts` — adaptive sampling of `y = f(x)` producing `SampledBranch[]`:
  subdivide where curvature is high, and **split the branch** on NaN/±∞ and on
  asymptote signatures so `tan(x)`, `1/x`, `floor(x)` and `sqrt(x)`'s domain edge
  render correctly instead of drawing vertical spikes. Also sample polar and
  parametric forms.
- `implicit.ts` — marching squares over a scalar field for `f(x,y) = g(x,y)`,
  with linear interpolation on cell edges and a defined resolution for the
  ambiguous saddle case.
- `surface.ts` — evaluate `z = f(x,y)` over a grid into a typed array, returning
  the height extent alongside so the colormap can band it.

**Testing** — colocated `*.test.ts` (precedent: `demos/piston-mechanism/elements/elements.test.ts`,
which `yarn test` already picks up). Cover at minimum:

- classification of every supported input form, including malformed input
- `sin(x)` yields one branch; `tan(x)` over `[-2π, 2π]` yields ≥ 4; `1/x` over a
  domain spanning 0 yields exactly 2; `sqrt(x)` starts at 0 and never emits NaN
- adaptive sampling of a straight line stays near the minimum sample count
  (proves the subdivision is curvature-driven, not blanket oversampling)
- marching squares on `x² + y² = 1` closes a loop whose sampled radius is within
  tolerance of 1
- free-variable detection: `a*sin(b*x)` → `['a', 'b']`, and `sin(x)` → `[]`
- a hostile input (`x^x^x^x`, unbalanced parens, `while`) neither throws out of
  the module nor hangs

**Success criteria**

- Every exported function/type carries JSDoc.
- All tests pass under `yarn test`; the new modules are the coverage floor for
  this feature, not an exception to it.
- No `any` in the public surface of these modules.

---

## Phase 4 — 2D graph renderer (parallel; depends only on Phase 1)

`apps/website/src/demos/graphing-calculator/graph/graph-2d.ts` — owns a scene,
knows nothing about Vue.

- **Axes/grid** built from `scaleContinuous(domain, range)` for the pixel
  mapping, plus a small bespoke tick generator. Do **not** use
  `scaleContinuous(...).ticks()` here: it routes through `padDomain`
  (`packages/core/src/scales/_base/index.ts:47`), which *expands* the domain to
  nice boundaries — fine for a chart axis, wrong for a calculator where the
  visible window is the user's. Instead reuse the existing 1–2–5 decade helper
  `numberNice` (`packages/utilities/src/number.ts:100`) to pick the step, then
  emit `ceil(min/step)*step … floor(max/step)*step` inside the exact domain.
  Major and minor gridlines; labels that stay readable across ~10 orders of zoom;
  an optional multiples-of-π mode for trig-friendly views. Axis lines pin to the
  origin and **clamp to the viewport edge** when the origin scrolls off (Desmos
  behavior), with the labels moving with them.
- **Curves** — one `createPath` per expression with `cachePath: false`, its
  `pathRenderer` walking `SampledBranch[]` and issuing `moveTo` per branch.
  Everything lives in a group whose first child is a `createRect({ clip: true })`
  covering the plot area, so curves cannot bleed over the axis gutter.
- **Pan/zoom** via `createNavigator(context, { interactions: { pan: true, zoom: true } })`.
  On `change`, derive the new domain, **re-sample**, and redraw — do not merely
  scale a stale polyline; re-sampling on zoom is the whole point. Keep units-per-pixel
  equal on both axes so circles stay circular. Re-derive on `context.on('resize')`.
- **Trace readout** — on `context.on('mousemove')`, invert the pointer to data
  space, evaluate each visible expression, and draw a marker plus a coordinate
  label; snap to the nearest sampled point for parametric/polar.
- **Theme** — resolve canvas colors from the `--vp-c-*` custom properties on
  `document.documentElement`, and re-resolve when the site theme flips. Use
  `const { isDark } = useData()` from `vitepress` and `watch` it — that is the
  house pattern (`ripl-playground.vue:80`), not a `MutationObserver`. No
  hard-coded light-mode grays.

**Success criteria**

- `sin(x)`, `tan(x)`, `1/x`, `floor(x)`, `sqrt(x)`, `x^2`, `e^x`, `ln(x)` all
  render correctly with no spurious vertical connectors at discontinuities.
- Zooming from a `[-10, 10]` window to `[-0.001, 0.001]` and back keeps curves
  smooth and tick labels legible at both ends, with no visible re-sampling
  staircase.
- Panning holds an interactive frame rate; the plot re-samples rather than
  stretching.
- Light and dark themes both legible; switching theme live updates colors
  without a reload.

---

## Phase 5 — 3D surface renderer (parallel; depends only on Phase 1)

`apps/website/src/demos/graphing-calculator/graph/surface-3d.ts` +
`graph-3d.ts`.

- A `Shape3D` subclass whose `computeFaces()` returns the quads of a `z = f(x,y)`
  grid, and a builder that splits the surface into **height-banded elements** —
  one `Shape3D` per color band, each with its own `fill` — to get a colormap
  out of a base class that only supports a single fill per element. This is
  correct because `Context3D.flushFaces()` sorts *all* buffered faces globally
  back-to-front (`packages/3d/src/core/context.ts:404-412`), so banded elements
  interleave properly by depth. Take the band colors from the existing
  `scaleSequential(COLOR_SCHEME_VIRIDIS, [zMin, zMax])`
  (`packages/core/src/color/{scales,schemes}.ts`) rather than hand-rolling a
  gradient; the CPU renderer then lambert-shades each band's fill per face
  (`shadeFaceColor` in `packages/3d/src/core/shading.ts`), so color and lighting
  compose for free.
- **Adaptive resolution.** The CPU painter's algorithm projects, depth-sorts and
  fills every face each frame, and also traces a hit `Path2D` over every face
  unconditionally. Budget accordingly: a coarse grid while orbiting or while a
  parameter slider is animating, refined when idle. Phase 5 must **measure**
  rather than guess — pick the two resolutions from the FPS overlay on the
  target machine and document the numbers in the module.
- Axes/bounding box, tick marks along each axis, and a `createCamera(context,
  { interactions: { pivot: true, zoom: true, pan: true } })` orbit rig.
- Rebuild the mesh only when the expression, domain, resolution or a parameter
  changes — never per frame for a static surface.

**Success criteria**

- The bundled 3D presets (ripple, monkey saddle, Gaussian, sinc, hyperbolic
  paraboloid, at minimum) all render and orbit smoothly.
- Orbiting holds ≥ 30fps on the coarse grid; the idle refine completes without a
  visible stall.
- The colormap reads as a continuous gradient, and no banding artifact shows
  through as z-order tearing.
- Switching between 2D and 3D mode tears down the previous scene, renderer and
  camera cleanly — no leaked listeners, no orphaned `requestAnimationFrame`
  loop. Verify by toggling 20 times and checking the FPS and element count
  overlays.

---

## Phase 6 — Vue shell and UI (starts after Phase 1; integrates 3–5)

```
apps/website/src/demos/graphing-calculator/
    index.md                       # layout: page + <ClientOnly><GraphingCalculator /></ClientOnly>
    graphing-calculator.vue        # shell: expression panel | viewport, mode toggle
    components/
        expression-list.vue        # add/remove/reorder rows
        expression-row.vue         # color swatch, input, visibility toggle, delete, inline error
        parameter-sliders.vue      # auto-detected params, with play/pause animation
        preset-gallery.vue         # curated 2D/3D equations
    styles/graphing-calculator.scss
```

- Use the existing UI kit — `RiplButton`, `RiplButtonGroup`, `RiplSwitch`,
  `RiplSelect`, `RiplInputRange`, `RiplDropdown`, `RiplControlGroup`,
  `RiplField`, `RiplColorInput` — before writing anything new. Icons from
  `lucide-vue-next` as slot content.
- `shallowRef` for every Ripl object (context, scene, renderer, camera). Deep
  reactivity walking a scene graph is a performance bug.
- Color all chrome through `--vp-c-*` custom properties so dark mode is free.
- Call `createDevtools(context, scene, renderer, { label: 'Graphing calculator' })`
  — every scene-based demo in the repo does, and it is how the devtools extension
  finds the demo.
- Import the SCSS from `<script setup>` (`import './styles/graphing-calculator.scss'`,
  as `piston-mechanism.vue:76` does) rather than adding a global import to
  `theme/index.ts` — it keeps the change local.
- **mathjs must not reach the SSR graph.** `vitepress build` server-renders every
  page; `<ClientOnly>` stops the *render*, not the *import*. Load the engine with
  a dynamic `import()` inside `onMounted`, and if SSR still trips, add `mathjs`
  to `vite.ssr.noExternal` in `.vitepress/config.mts`. This must be proven by an
  actual `yarn workspace @ripl/website build`, not assumed — CI does not build
  the website, so nothing else will catch it.
- Persist state (expressions, params, viewport, mode) to the URL hash so a graph
  is shareable, mirroring the playground's `encodeState`/`decodeState`.
- Responsive: the expression panel collapses to a drawer under ~768px; the
  viewport keeps a usable aspect ratio on mobile.
- Accessibility: every input carries a real label, the color swatch is not the
  only carrier of an expression's identity, focus rings follow the UI kit's
  `outline: 2px solid var(--vp-c-brand-1)` convention, and the viewport host
  element gets an `aria-label` summarizing what is plotted. (Raw contexts have no
  ARIA option of their own — put it on the host `<div>`, not the canvas API.)

**Preset gallery content** — this is what sells the demo, so pick for visual
punch, not coverage of syntax:

- *2D*: butterfly curve (parametric), rose curves `r = cos(k·θ)`, Lissajous,
  the implicit heart, lemniscate of Bernoulli, epicycloid/spirograph, a damped
  oscillation, and a Fourier square-wave partial sum with a slider on the term
  count.
- *3D*: ripple `sin(√(x²+y²))/√(x²+y²)`, monkey saddle `x³ − 3xy²`, Gaussian,
  sinc, hyperbolic paraboloid, and a `sin(ax)·cos(by)` egg-carton wired to two
  sliders.

Every preset must be verified to render — a preset that errors is worse than no
preset.

**Success criteria**

- Typing `y = a*sin(b*x)` produces two sliders that update the curve live at
  interactive frame rate.
- Every preset loads and renders without an error badge.
- Reloading a hash-encoded URL restores the exact graph.
- `yarn workspace @ripl/website build` succeeds (this is the SSR gate).

---

## Phase 7 — Registration, verification and review (sequential, after 2–6)

1. Add the `DemoMeta` entry to
   `apps/website/src/.vitepress/data/demos.ts`. That single entry drives both the
   `/demos/` sidebar and the gallery card — `config.mts` needs no change. Match
   the existing entries' voice: one sentence, present tense, naming the concrete
   capabilities. e.g.

   ```
   {
       text: 'Graphing Calculator',
       link: '/demos/graphing-calculator/',
       description: 'A Desmos-style graphing calculator with an editable equation list, auto-detected parameter sliders, pan/zoom over adaptively re-sampled curves, implicit plots via marching squares, and orbitable 3D surfaces rendered with @ripl/3d.',
   },
   ```
2. `AGENTS.md` § Playground is stale: it describes a flat `examples.ts` and a
   `defaults.ts` that no longer exist. Correct it to the `examples/` directory
   with `index.ts`, and note that defaults come from the first `EXAMPLES` entry
   per mode. Small, in-scope, and it stops the next agent being misled.
3. Run the full gate:
   ```bash
   yarn lint
   yarn typecheck
   yarn test
   yarn workspace @ripl/website build
   ```
   **`yarn typecheck` does not cover `apps/website`** — `tsconfig.typecheck.json`
   includes only `packages/*/src/**/*.ts`, and CI never builds the website, so a
   type error in the demo would ship silently. Close that hole for the new code
   by writing a throwaway config in the scratchpad that extends the root
   `tsconfig.json` (so the `@ripl/*` path aliases resolve) with
   `include: ["apps/website/src/demos/graphing-calculator/**/*.ts"]`, and running
   `yarn tsc -p <that> --noEmit`. Do not run `tsc -p apps/website/tsconfig.json`
   — existing `.vitepress` files import `.vue` modules and it fails on
   pre-existing code. Do not add a config file to the repo for this.
4. Manual pass in `yarn workspace @ripl/website start`: every new playground
   example, every calculator preset, both themes, a mobile viewport, and the
   2D↔3D toggle.
5. Self-review the diff against the checklist below before committing.

**Final success criteria**

- `yarn lint`, `yarn typecheck`, `yarn test` and the website build all pass.
- Coverage still clears the `vitest.config.ts` ratchet. If new demo code drags
  the global numbers, **add tests** — do not lower the thresholds, and do not
  blanket-exclude the demo directory.
- No new runtime dependency beyond the approved `mathjs`.
- No multi-line `//` comment block anywhere in the diff.
- Every exported symbol and public member in the new TypeScript modules carries
  JSDoc; verify the calculator's modules with TypeDoc's `notDocumented`
  validation (command in `CLAUDE.md`).
- Zero console errors or warnings across every new example and demo page.
- Commits use conventional-commit subjects; work lands on
  `claude/ripl-demos-plan-jl8ept` and is pushed with
  `git push -u origin claude/ripl-demos-plan-jl8ept`.

---

## Coordination notes for the orchestrator

- **Serialize Phase 0 and Phase 1.** Everything after them is parallel-safe
  because the file ownership is disjoint:

  | Workstream | Owns |
  |---|---|
  | 2a / 2b | `playground/examples/*`, `examples/index.ts`, `eslint.config.js` |
  | 3 | `graphing-calculator/math/**` |
  | 4 | `graphing-calculator/graph/graph-2d.ts` |
  | 5 | `graphing-calculator/graph/surface-3d.ts`, `graph-3d.ts` |
  | 6 | `graphing-calculator/*.vue`, `components/**`, `styles/**`, `index.md` |
  | 7 | `data/demos.ts`, `AGENTS.md` |

  Only `examples/index.ts` is shared, and only between 2a and 2b — have one of
  them own the file and the other hand over its two entries.
- Give every implementation agent the two paste-in templates it needs rather than
  making it rediscover them: `demos/piston-mechanism/piston-mechanism.vue` is the
  canonical mount/tick/teardown shape for a Ripl demo, and
  `demos/jet-engine/index.md` is the canonical `layout: page` + `<ClientOnly>`
  wrapper.
- Ripl API traps worth restating in every prompt: `autoStop: false` for
  continuous loops; `cachePath: false` for `pathRenderer`s reading outside
  state; `on()` returns a `Disposable` — call `.dispose()`, not the return value
  (the events doc is wrong); in-place array mutation does not mark an element
  dirty, so reassign or call `scene.invalidate()`; elements are hit-testable only
  after their first render, and only if they registered that listener themselves.
