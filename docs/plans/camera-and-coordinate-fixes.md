# Camera, coordinate and interaction fixes — implementation plan

Six PRs across four tracks, each with scope, success criteria and verification, for an
orchestrator to execute with a team of subagents. Every `file:line` reference was verified
against `main` at `9f3e284`; re-verify before editing, because line numbers drift.

## Context

Four defects and one UX problem, all of which make Ripl behave differently from
what a consumer would reasonably predict:

1. **3D camera scroll zoom is inverted.** `packages/3d/src/core/camera.ts:330` feeds
   `event.deltaY` into `Camera.zoom()` unnegated, and positive delta dollies *toward*
   the target — so scrolling down zooms in. `DOMNavigator` does the opposite at
   `packages/dom/src/navigator.ts:179` (`Math.exp(-event.deltaY * …)`), so the two
   halves of the library disagree on the same physical gesture. The camera's pinch
   handler is inverted too: spreading two fingers zooms *out*.

2. **The public API does not speak one coordinate space.** Pointer event payloads
   already report logical space (CSS pixels, origin at the context's top-left) — that
   part is right. But the hit-testing entry points (`Element.intersectsWith`,
   `RenderElement.intersectsWith`, `Context.isPointInPath`, `Context.isPointInStroke`)
   take *surface* space — device pixels on canvas, the letterboxed braille raster on
   terminal. A user has to know which of two spaces each method wants. Related leaks:
   `CanvasContext.setTransform` passes straight through to the native context and wipes
   the device-pixel-ratio matrix, silently reinterpreting the caller's logical
   coordinates as device ones; and `Context3D`/`WebGPUContext` emit `resize` from
   `super.rescale` *before* installing their DPR-aware scales, so a scene that repaints
   synchronously on resize places points with identity scales for one frame.

3. **Drag deltas are the per-move step, not the total.** `_handleDrag` advances
   `dragPrevX/Y` on every move (`packages/dom/src/context.ts:236-237`), so `deltaX`/`deltaY`
   report movement since the previous event. The JSDoc on both event maps says the
   opposite ("since the drag started", "Total … over the drag"), and open PR
   [#84](https://github.com/andrewcourtice/ripl/pull/84) proposes resolving that by
   changing the docs to match the code. That is the wrong way round: the runtime should
   emit the total, because a total is frame-rate independent, survives a dropped move,
   and is what `startX`/`startY` in the same payload imply.

4. **The graphing calculator's 14 presets eat the side panel.** They sit below
   Expressions and Parameters in a 21rem sidebar (`graphing-calculator.vue:63-70`),
   pushing the equations the demo is actually about off-screen.

Intended outcome: one predictable coordinate space at every public boundary, zoom that
goes the way you push it, drag deltas that mean what they say, and a calculator whose
sidebar is about equations.

## Decisions already taken

| Question | Decision |
|---|---|
| Coordinate terminology | **Keep the existing names.** "Logical space" stays the CSS-pixel, user-facing space; "surface space" stays the backend's own drawing space. Only behaviour and doc *clarity* change. |
| Hit-test entry points | **One space everywhere.** Every public method takes and returns logical coordinates; the surface conversion moves inside the backends. |
| Drag delta | **Cumulative only.** `deltaX`/`deltaY` become the total since `dragstart` on both `drag` and `dragend`. No per-move field is added. |
| Preset UI | **Catalogue overlay** opened from a header button, keeping the two-line description cards. |

The rule this work establishes, to be stated once and linked from everywhere else:

> Every coordinate crossing Ripl's public boundary — in or out — is in **logical space**:
> CSS pixels, unaffected by the device pixel ratio, with `0,0` at the top-left of the
> context's own element. Never the page, never the viewport, never the backing store.
> **Surface space is backend-internal.** `Context.toLogicalPoint`/`toSurfacePoint` exist
> for authors of custom contexts; a consumer never needs to call either.

## Branches and pull requests

Six PRs in four tracks. **A, B, D and C1 are independent and can be built in parallel.**
C2 stacks on C1; C3 stacks on C2.

| # | Branch | Title | Base | Size |
|---|---|---|---|---|
| A | `claude/camera-coordinates-fixes-x8wq24` | Zoom the 3D camera the way the wheel is pushed | `main` | S |
| B | `claude/drag-delta-total` | Report drag deltas as the total since the drag started | `main` | S |
| C1 | `claude/logical-hit-testing` | Take hit-test points in logical space, not surface space | `main` | M |
| C2 | `claude/canvas-dpr-transform` | Keep the device-pixel matrix under a caller's transform | C1 | S |
| C3 | `claude/coordinate-space-docs` | Document one coordinate space at the public boundary | C2 | M (docs only) |
| D | `claude/calculator-preset-catalogue` | Move the calculator presets into a header catalogue | `main` | M |

Track A reuses the session's designated branch (`claude/camera-coordinates-fixes-x8wq24`);
the rest are new branches cut from `main`, per the explicit request to split the work.

PR titles follow the repo convention (sentence-style, no `type(scope):` prefix); commit
messages use conventional commits. Use the `ripl-pull-requests` skill for PR bodies.

---

### A — Zoom the 3D camera the way the wheel is pushed

**Branch** `claude/camera-coordinates-fixes-x8wq24` · **File** `packages/3d/src/core/camera.ts`

Adopt the navigator's exponential curve rather than just flipping a sign: it is
scale-free and symmetric (scroll down then up returns to the same distance), which the
current `deltaY * dist` linear step is not, and it makes the 2D and 3D gestures feel the
same rather than merely agree on direction.

- **Wheel** (`:326-335`). `zoom(delta)` moves the eye toward the target by `delta`, so a
  multiplicative factor `f` (matching `Navigator.zoomBy`) becomes `dist - dist / f`:

  ```ts
  const factor = Math.exp(-event.deltaY * ZOOM_SENSITIVITY * zoomConfig.sensitivity);
  this.zoom(dist - dist / factor);
  ```

  `deltaY > 0` (scroll down) → `factor < 1` → negative delta → eye retreats → zooms out.

- **Pinch** (`:456-464`). Replace `lastPinchDist - pinchDist` with the same ratio form
  `DOMNavigator._handlePinch` uses (`packages/dom/src/navigator.ts:309-317`), so spreading
  zooms in. Guard both distances as non-zero before dividing. Raise the ratio to the
  power of `zoomConfig.sensitivity` so the option keeps meaning, and drop the now-unused
  `PINCH_ZOOM_SENSITIVITY` constant (`:78`).

- **JSDoc.** `Camera.zoom` (`:275-278`) must state the sign convention explicitly:
  positive `delta` moves toward the target (zooms in), negative retreats.

Non-goals: the one-sided clamp in `Camera.zoom` (zoom-out is unbounded) is left as-is —
it is a separate design gap, not a direction bug.

**Tests** — `packages/3d/test/camera.test.ts`. The wheel path is currently uncovered; the
existing interaction tests only assert listener attachment.

- Wheel `deltaY: 100` increases `vec3Distance(camera.position, camera.target)`.
- Wheel `deltaY: -100` decreases it.
- Equal-and-opposite scrolls return the distance to its starting value (pins the
  exponential curve, and would fail on the linear form).
- A two-finger `touchmove` that increases the pinch distance decreases the camera
  distance.
- `zoom: false` still attaches no wheel listener (existing test must stay green).

**Docs** — `apps/website/src/docs/3d/essentials/camera.md`: the Controls list (`:160-163`)
gains the direction ("scroll up to zoom in, down to zoom out; pinch out to zoom in"), and
the `zoom(delta)` section (`:95-101`) gains the sign convention.

**Success criteria**

- [ ] Scrolling down on any 3D canvas moves the camera away from its target.
- [ ] The same `deltaY` sign produces the same visual direction on `Camera` and `DOMNavigator`.
- [ ] Spreading two fingers zooms in.
- [ ] Scroll-down-then-scroll-up is a no-op on camera distance (within float tolerance).
- [ ] `yarn test`, `yarn lint`, `yarn typecheck` pass; the graphing calculator's 3D mode and
      the 3D playground examples zoom correctly by hand.

---

### B — Report drag deltas as the total since the drag started

**Branch** `claude/drag-delta-total` · **Files** `packages/dom/src/context.ts`, docs, demos

The existing JSDoc on `ContextEventMap`/`ElementEventMap` is already the *desired*
contract — the runtime is what is wrong. Keep the doc wording, change the code.

- `InteractionState` (`:32-37`): delete `dragPrevX` and `dragPrevY`.
- `_handleDrag` (`:210-250`): `dx`/`dy` are already computed at the top for the threshold
  test — reuse them as the payload's `deltaX`/`deltaY`. Delete the `dragPrev` seeding
  (`:218-219`) and advance (`:236-237`).
- `_handleMouseUp` (`:313-321`): `deltaX: x - state.dragStartX`, `deltaY: y - state.dragStartY`.
- Re-read the JSDoc in `packages/core/src/context/types.ts:116-146` and
  `packages/core/src/core/element.ts:146-176` and make `drag`'s summary say the same thing
  as `dragend`'s ("the total movement since the drag started"). No wider wording churn.

**Tests** — `packages/dom/test/context.test.ts`, alongside the existing pointer state
machine block (`:209`).

- Press 10,10 → move 100,100 → 140,140 → 160,160 emits deltas `90/90`, `130/130`, `150/150`.
- `dragend` after that sequence carries `{ startX: 10, startY: 10, deltaX: 150, deltaY: 150 }`.
- The user's worked example, including the negative leg: press 10,50 → move 30,80 gives
  `20,30`; move on to 5,30 gives `-5,-20`.
- The DPR-2 payload-space regression test (`:670`) must stay green.

**Docs and demos** — every `+=` idiom becomes "capture the origin on `dragstart`, then
assign `origin + delta`", which is what actually preserves the grab offset now:

- `apps/website/src/docs/core/advanced/events.md` — prose at `:170` and `:172`, examples at
  `:46`, `:159`, `:289`, `:296`.
- `apps/website/src/docs/core/essentials/scene.md:209`, `:214`.
- `apps/website/src/.vitepress/components/playground/examples/bezier-editor.js:83-97` —
  record `cx`/`cy` in the `dragstart` handler; delete the now-false one-line comment at `:89`.

**PR #84** — the new PR body must state that it supersedes #84 (which documents the old
per-move semantics). Leave a short comment on #84 pointing at the replacement rather than
closing it; closing is the maintainer's call.

**Success criteria**

- [ ] `drag`/`dragend` `deltaX`/`deltaY` equal `x - startX` / `y - startY` exactly, on every event.
- [ ] Dragging an element with the documented `origin + delta` idiom keeps the grab offset,
      including when a move event is dropped.
- [ ] No consumer in the repo still relies on `+=` with a drag delta (`grep -rn "deltaX" apps packages`).
- [ ] The Bézier editor playground example drags correctly in the running docs site.
- [ ] `yarn test`, `yarn lint`, `yarn typecheck` pass.

---

### C1 — Take hit-test points in logical space, not surface space

**Branch** `claude/logical-hit-testing` (from `main`) · **Breaking**

Move the single surface conversion from the caller into the backends. After this change
`packages/dom/src/context.ts` contains no coordinate conversion at all, and every
`intersectsWith`/`isPointIn*` argument is in the same space as the event payload it came from.

Core:
- `packages/core/src/context/context.ts` — `hitTest` (`:784`) takes logical; rewrite its
  JSDoc (drop "must map them through `toSurfacePoint` first"). `isPointInPath`/
  `isPointInStroke` (`:759-766`) document a logical point that backends convert.
  `toLogicalPoint`/`toSurfacePoint` (`:676-703`) keep their behaviour but are reframed in
  JSDoc as the backend seam, not something a consumer calls.
- `packages/core/src/context/types.ts:65-66` — `RenderElement.intersectsWith` doc.
- `packages/core/src/core/element.ts:829-836` — drop the `toLogicalPoint` call; test the
  point against `getBoundingBox()` directly.
- `packages/core/src/core/shape.ts:123-162` — delete the surface→logical→surface
  round-trip; apply the inverted world transform to the logical point and pass the local
  logical point straight to `isPointInPath`/`isPointInStroke`.

Backends (each converts at its own boundary, via `this.toSurfacePoint`, never a raw ratio):
- `packages/canvas/src/mixins.ts:438-452` — convert before `canvasIsPointInPath`/
  `canvasIsPointInStroke`. Native `isPointInPath` reads its point in untransformed canvas
  space, which is why the conversion is needed here and nowhere else.
- `packages/webgpu/src/context.ts:289-307` — same; its `_hitContext` carries the DPR
  matrix (`:150`). **This currently mis-hits by the DPR** — `Shape3D` builds hit paths from
  `Context3D.project()`, which is already CSS pixels, so the fix closes a live bug.
- `packages/svg/src/context.ts` — no change (logical ≡ surface); confirm `_isPointIn`
  (`:375-386`) still maps through the live CTM.
- `packages/terminal/src/context.ts` — no change (`isPointIn*` always return `false`; the
  letterbox overrides stay, they still drive drawing and `scaleX`/`scaleY`).
- `packages/3d/src/core/shape.ts:505-531` — no conversion needed; correct any comment
  claiming the point is in surface space.

DOM:
- `packages/dom/src/context.ts:162-164` — `_hitTestLogical` becomes a passthrough; inline
  `this.hitTest(events, x, y)` at its five call sites and delete the helper.

**Tests**

- `packages/core/test/core/element.test.ts` / `shape` equivalent: at DPR 2,
  `element.intersectsWith(cssX, cssY)` is `true` inside the element and `false` at
  `cssX * 2, cssY * 2` — the exact inversion of today's contract.
- Cover both `hitTestHonorsTransform` branches: a transformed element on canvas (inverse
  applied) and on SVG (not applied).
- `packages/dom/test/context.test.ts`: an end-to-end hover at DPR 2 hits the element whose
  logical box contains the CSS-pixel point.
- `packages/3d`: a DPR-2 hit test against a projected shape (guards the WebGPU/3D bug above).
- The existing `toLogicalPoint`/`toSurfacePoint` round-trip tests
  (`packages/core/test/context/context.test.ts:1399-1431`,
  `packages/terminal/test/context.test.ts:372-402`) must stay green unchanged — the helpers
  themselves do not change.

**Migration note** — create `docs/migrations/coordinate-spaces.md` following the format of
`docs/migrations/context-audit.md` (per-symbol, **API** vs **behaviour** tags). Entries: the
four hit-test entry points, and what a custom `intersectsWith` override must now do.

**Success criteria**

- [ ] Grepping `packages/*/src` for `toSurfacePoint`/`toLogicalPoint` returns only the base
      definitions, the terminal overrides, and the canvas/WebGPU `isPointIn*` conversions.
- [ ] `Element.intersectsWith(x, y)` accepts exactly the coordinates a `mousemove` payload
      carries, at any DPR, on canvas, SVG, WebGPU and 3D.
- [ ] Hover, click and drag hit correctly at DPR 1 and DPR 2 on canvas and SVG.
- [ ] Every changed public member carries JSDoc naming logical space; TypeDoc
      `notDocumented` clean for `core`, `canvas`, `svg`, `dom`, `3d`, `webgpu`, `terminal`.
- [ ] `yarn test`, `yarn lint`, `yarn typecheck` pass; `packages/charts/test/visual` hit specs pass.

---

### C2 — Keep the device-pixel matrix under a caller's transform

**Branch** `claude/canvas-dpr-transform` (from C1) · **Breaking (behaviour)**

Two remaining places where a logical coordinate is silently reinterpreted.

- `packages/canvas/src/mixins.ts:405-407`. `setTransform` replaces the CTM, taking the DPR
  matrix `rescaleCanvas` installed with it — so `context.setTransform(1,0,0,1,0,0)` means
  "identity in device pixels", not "identity in logical pixels". Compose onto the DPR base
  instead, expressed as two native calls rather than hand-multiplied matrix entries:

  ```ts
  const dpr = factory.devicePixelRatio ?? 1;
  this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
  this.context.transform(a, b, c, d, e, f);
  ```

  `transform`, `rotate`, `scale` and `translate` are relative and already correct.
  `applyElementTransform` (`packages/core/src/core/transform.ts:91-102`) uses only the
  relative operations, so element transforms are unaffected — verify this holds before
  merging.

- `packages/3d/src/core/context.ts:360-374` and `packages/webgpu/src/context.ts:129-155`
  call `super.rescale(...)`, which installs identity scales **and emits `resize`**, before
  assigning the DPR-aware scales. Mirror `CanvasContext.rescale`
  (`packages/canvas/src/context.ts:52-70`): assign `width`/`height`/`scaleX`/`scaleY`, then
  emit. The one-line rationale already written in the canvas context should not be copied —
  link to it or state it once.

**Tests**

- At DPR 2, `context.setTransform(1,0,0,1,0,0)` leaves a native CTM of `(2,0,0,2,0,0)`, and
  `setTransform(1,0,0,1,10,20)` leaves `(2,0,0,2,20,40)`.
- A rect drawn after `setTransform(1,0,0,1,0,0)` occupies the same device pixels as one
  drawn with no transform at all.
- A `resize` handler on `Context3D` and `WebGPUContext` observes DPR-aware `scaleX`/`scaleY`,
  not identity.

Append both entries to `docs/migrations/coordinate-spaces.md`.

**Success criteria**

- [ ] `context.setTransform(1,0,0,1,0,0)` is a logical-space identity at any DPR.
- [ ] No rendering regression on retina: `packages/charts/test/visual` parity specs pass.
- [ ] A scene bound to `resize` never paints a frame with identity scales on 3D or WebGPU.
- [ ] `yarn test`, `yarn lint`, `yarn typecheck` pass.

---

### C3 — Document one coordinate space at the public boundary

**Branch** `claude/coordinate-space-docs` (from C2) · **Docs and JSDoc only, no behaviour**

State the rule (see [Decisions](#decisions-already-taken)) **once**, in
`AGENTS.md § Coordinate Spaces`, and have everything else link to it — the repo's own
"do not repeat a rationale across files" convention.

JSDoc sweep — the ambiguous or now-stale declarations found in the audit:
- `Context.width`/`height` (`packages/core/src/context/context.ts:121-124`) — "in pixels"
  → logical (CSS) pixels. Mirror onto `Scene.width`/`height`
  (`packages/core/src/core/scene.ts:112-120`).
- `InteractionPoint` (`packages/charts/src/core/interaction.ts:29-35`) — "chart pixels" →
  logical pixels relative to the context's top-left. Same for the `anchor` return
  (`:54-60`) and `HoverTooltip.show`.
- `Navigator` (`packages/core/src/core/navigator.ts`) — `NavigatorTransform.x/y`,
  `NavigatorBrush`, `NavigatorViewport`, `applyPoint`/`invertPoint`, `fitBounds` padding:
  "screen pixels" / "pixels" → logical pixels relative to the context's top-left.
- `Context3D.project` (`packages/3d/src/core/context.ts:251`) — "2D screen coordinates" →
  logical.
- `Context.scaleX`/`scaleY` — say plainly that these are the drawing scales and are not a
  conversion seam for callers.

Website pages (`apps/website/src/`):
- `docs/core/advanced/custom-contexts.md:241-268` — the canonical *backend author's*
  explanation; keep the override template, drop any implication that consumers convert.
- `docs/core/essentials/context.md:120` — remove "map it with `context.toSurfacePoint(x, y)`
  first"; hit testing now takes what events report.
- `docs/core/essentials/element.md:141`, `docs/core/advanced/events.md:172`,
  `docs/core/advanced/navigator.md`, `docs/core/contexts/svg.md`,
  `docs/core/contexts/terminal.md`, `docs/core/troubleshooting/faq.md`,
  `charts/advanced/rendering-targets.md` — sweep with
  `grep -rn "logical\|surface\|device pixel" apps/website/src --include=*.md`.
- Add a short "Coordinate spaces" note to `docs/core/essentials/context.md` stating the
  one rule, with the DPI worked example (a 300×150 context at DPI 2 still reports 300×150
  and still reports pointer events in that space).

**Success criteria**

- [ ] `AGENTS.md` states the rule once; no page contradicts it and none restates the rationale.
- [ ] No public JSDoc says "pixels" without naming a space.
- [ ] TypeDoc `notDocumented` clean across every package (ignoring `SetSignature`).
- [ ] `yarn workspace @ripl/website build` succeeds (dead links and the chart-options/config
      coverage checks all run in that build).
- [ ] `yarn lint` passes (it lints markdown too).

---

### D — Move the calculator presets into a header catalogue

**Branch** `claude/calculator-preset-catalogue` (from `main`) · Website only

- Delete the Presets `<section>` from the sidebar
  (`apps/website/src/demos/graphing-calculator/graphing-calculator.vue:63-70`), leaving
  Expressions and Parameters.
- Add a Presets `RiplButton` (lucide icon, e.g. `LayoutGrid`) to the header's
  `RiplControlGroup` (`:13-36`), before the 2D/3D `RiplButtonGroup`. It needs
  `aria-haspopup="dialog"` and `:aria-expanded`.
- Build the overlay on the existing `RiplConfigDrawer`
  (`apps/website/src/.vitepress/components/ripl-config-drawer.vue`) — it already has
  `v-model`, a `title` prop, a click-to-dismiss overlay and `role="dialog"`. Two small kit
  fixes belong here: bind `:aria-label="title"` instead of the hardcoded
  `aria-label="Chart options"` (`:13`), and close on `Escape`. Verify
  `ripl-chart-config.vue` is unaffected.
- Reuse `components/preset-gallery.vue` unchanged as the drawer body — its
  mode-first grouping (`:53-61`) and two-line description cards are exactly what the
  catalogue wants. Widen its `minmax(12rem, 1fr)` grid (`:92-99`) for the roomier overlay.
- Selecting a preset calls the existing `onPresetSelect` (`:710+`) and closes the drawer.
- Check the catalogue and the mobile equations drawer (`__scrim`, `--open`, the
  `max-width: 768px` block in `styles/graphing-calculator.scss:108-121`) cannot both be
  open, or that they stack sanely if they are.
- `data/presets.ts` and `data/presets.test.ts` are untouched.

**Success criteria**

- [ ] The sidebar contains only Expressions and Parameters; no preset list remains in it.
- [ ] A header button opens a catalogue showing all 14 presets grouped into "2D curves" and
      "3D surfaces", current mode first, with descriptions intact.
- [ ] Picking a preset applies it, switches mode when needed, and closes the catalogue.
- [ ] The dialog is reachable and dismissable by keyboard (focus enters it, `Escape` closes,
      focus returns to the trigger).
- [ ] Usable at 375px wide; the equations drawer still works.
- [ ] `yarn lint`, `yarn typecheck` and `yarn workspace @ripl/website build` pass.

---

## Verification

**Environment.** `node_modules` is empty in a fresh session and Node is v22 against a
`>=24.18.1` engine requirement — the first agent on any branch must run
`corepack enable && yarn install` and resolve the engine gap (`.nvmrc` pins 24.18.1)
before anything below works. The npm registry is reachable through the proxy.

**Per PR, in order:**

1. `yarn test` — full vitest run with V8 coverage thresholds (lines 70 / statements 70 /
   functions 62 / branches 57). A drop below any threshold fails CI.
2. `yarn lint` and `yarn typecheck` (`tsconfig.typecheck.json` is the type gate; the tsdown
   build does not typecheck).
3. TypeDoc `notDocumented` for every package touched, per the command in `CLAUDE.md`,
   ignoring `SetSignature` warnings.
4. `npx playwright test -c packages/charts/test/visual/playwright.config.ts` for C1, C2 and
   anything touching hit testing or rendering — these specs are excluded from vitest and
   run separately.

**By hand in the docs site** (`yarn workspace @ripl/website start`, port 5173):

- **A** — `/demos/graphing-calculator/` in 3D mode and a 3D playground example: scroll down
  retreats, scroll up approaches, pinch out zooms in.
- **B** — the Bézier editor in `/playground`, and the drag demos on
  `/docs/core/advanced/events` and `/docs/core/essentials/scene`: elements track the cursor
  with the grab offset preserved.
- **C1/C2** — at browser zoom 200% (DPR 2), hover and click still land on the element under
  the cursor on both a canvas and an SVG demo; `/demos/jet-engine-webgpu/` hit testing works.
- **D** — the calculator at desktop and 375px.

**End-to-end regression sweep** before the last merge: run the full suite plus the visual
specs on the merged result of all six branches, since C1 changes a contract that the charts
hit specs exercise and B changes one the demos exercise.

## Non-goals

- Renaming `logical`/`surface`, or `toLogicalPoint`/`toSurfacePoint`.
- Adding a max-distance clamp to `Camera.zoom`, or any new camera option.
- Adding a per-move drag delta field.
- `ChartNavigator._localPoint`'s per-event `getBoundingClientRect`
  (`packages/charts/src/components/navigator.ts:529`) — a real cost, already tracked in
  `docs/plans/frontend-graphics-audit.md:256-257`, and unrelated to correctness here.
- Any runtime dependency.
