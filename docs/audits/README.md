# Rendering context audit

Every `Context` implementation audited against the base contract in
`packages/core/src/context/context.ts`, one investigation per backend, using a uniform checklist:
save/restore symmetry · render-depth handling · `pushGroup`/`popGroup` balance and clip scoping ·
transform composition · paint resolution and def lifecycle · text metrics · hit testing · `export()` ·
`destroy()` · **parity with canvas for an identical scene**.

| Report | Scope | Confirmed | Highest severity |
|---|---|---|---|
| [canvas.md](./canvas.md) | `CanvasContext`, `canvas2DStateMixin`, `CanvasPath` | 18 of 21 | 4 high |
| [svg.md](./svg.md) | `SVGContext`, definitions, diff, path, text | 17 of 21 | 7 high |
| [dom-node.md](./dom-node.md) | `DOMContext`, reconciler, navigator, `@ripl/node` | 27 of 28 | 4 high |
| [terminal.md](./terminal.md) | `TerminalContext`, rasterizer, path | 24 | 5 high |
| [3d-webgpu.md](./3d-webgpu.md) | `Context3D`, `CanvasContext3D`, `WebGPUContext3D` | 28 | 4 high |

## How to read these

Each finding carries a `file:line`, a concrete failure scenario, a severity, and a test sketch.
Findings are split into **CONFIRMED** (a code path was traced *and* executed) and **SUSPECTED**
(reasoning only — typically needing a real browser). Each report also lists what was checked and
found **correct**, so the negative results are auditable too.

One seed lead was **refuted**: `createFrameBuffer` was suspected of starving the hover hit test
during a fast drag. It doesn't — `requestAnimationFrame` has an absolute deadline, so cancel and
reschedule still leaves exactly one callback registered per frame. Measured at 20× a browser's
delivery rate it produced exactly one hover emission per frame. See `dom-node.md`.

## Verification status

These reports are investigation output. Findings marked CONFIRMED were reproduced by executing the
real sources, but **only the following were independently re-verified while writing this index**,
and those are the ones encoded as regression tests in `packages/canvas/test/audit.test.ts`:

- `rescaleCanvas` no-ops on a 300×150 host — `context.width`/`height` stay `0` and `scaleX(150)`
  returns `0`, so `clear()` becomes `clearRect(0, 0, 0, 0)` and the surface never clears
- a scene-root `clip: true` shape leaks one `save()` per frame — measured depth `1, 2, 3, 4, 5`
- `context.fill` reports the inner scope's paint after a `restore()`

Everything else should be re-confirmed before a fix is written against it.

`mockCanvasContext` uses no-op `save`/`restore`, which structurally hides every state-stack defect
in the canvas package — a test cannot distinguish a context that correctly restores its paint from
one that never restores anything. `mockCanvasState` (added with this audit) upgrades the stub with a
real state stack, and is what made the third finding above testable.

## Already fixed

Several findings were fixed in the branches this audit ran alongside, and are marked here rather
than re-reported:

| Finding | Fixed by |
|---|---|
| Group gradient resolves against the previously rendered leaf (`canvas.md` 3, `svg.md` S-4) | `claude/paint-materialization` |
| A fresh `CanvasGradient` per element per frame (`canvas.md` 12) | `claude/paint-materialization` |
| Cross-context `CanvasPattern` sharing (`canvas.md` 11) | `claude/paint-materialization` |
| A group that empties keeps its DOM children (`svg.md` S-1, `dom-node.md` F3) | `claude/svg-commit-model` |

The canvas/SVG group-gradient **parity** gap is characterized in `svg.md` S-4 but deliberately not
fixed: canvas resolves once at the group boundary against the group's box, SVG emits a `url(#…)` per
leaf against each leaf's own box, so a group gradient still renders differently between backends.
S-4 scopes what a fix would have to change.

## Suggested triage

Grouped so each branch is one reviewable PR, with the riskiest changes bundled together.

1. **`fix/canvas-surface-sizing`** — `rescaleCanvas` early return (`canvas.md` 1). Self-contained,
   high impact: a 300×150 chart never renders at all.
2. **`fix/root-clip-save-leak`** — the scene-root clip leak (`canvas.md` 2, `terminal.md` F24,
   `svg.md` S-9). One core defect, three backends observe it; fix in `Context`/`Scene`, verify in each.
3. **`fix/interaction-lifecycle`** — the pointer-state cluster: drag stranded by an off-surface
   `mouseup` (`dom-node.md` F2), no element `mouseleave` on surface leave (F4, which leaves chart
   tooltips painted), `click` after drag (F6), stale `dragElement` (F7), teardown races (F8, F9).
   These interact; fixing them apart would mean re-reasoning about the same state machine repeatedly.
4. **`fix/hit-test-ordering`** — `hitTest` sorts by additive z-index rather than paint order
   (`dom-node.md` F1), plus the memo staleness (F10, F11). `renderedElements` is already exact paint
   order, so the z-sort discards correct information.
5. **`fix/svg-clip-and-dpr`** — `applyClip` replaces instead of intersects (`svg.md` S-2), clip
   user-space displacement under group transforms (S-3), and box hit testing off by DPR (S-6).
6. **`fix/3d-paint-and-state`** — the deferred-draw cluster: a non-hex fill crashing the render loop
   (`3d-webgpu.md` 3D-1), discarded state and transforms (3D-2), local-normal shading (3D-3), and
   geometry not animating (3D-4). Same root cause — a deferred renderer inside an immediate one.
7. **`fix/terminal-paint`** — ANSI colour bleed (`terminal.md` F1), named colours and `#rgb`
   resolving to nothing (F2), zero-alpha still drawing (F3), `opacity` ignored (F4), stroked text
   drawing nothing (F5).
8. **`fix/webgpu-depth-range`** — the `[-1, 1]` vs `[0, 1]` NDC convention (`3d-webgpu.md` WGPU-1).

Lower-severity findings are listed in each report and are best folded into whichever branch above
touches the same file.

## Still outstanding from the audit plan

A canvas↔SVG parity harness — the same gallery rendered through both backends and diffed against
each other rather than a stored baseline — was scoped but not built. `packages/charts/test/visual/`
is the place for it, and `svg.md` S-4/S-5 (group gradient, group opacity) are the two divergences it
would catch first.
