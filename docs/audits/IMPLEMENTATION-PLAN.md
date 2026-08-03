# Implementing the rendering-context audit

## Context

`docs/audits/` holds five investigation reports — one per rendering backend — auditing every
`Context` implementation against the base contract in `packages/core/src/context/context.ts`
(save/restore symmetry · render depth · `pushGroup`/`popGroup` balance and clip scoping · transform
composition · paint resolution and def lifecycle · text metrics · hit testing · `export()` ·
`destroy()` · parity with canvas). They record **~122 findings**: ~24 HIGH, ~40 MEDIUM, the rest
LOW/perf/informational.

They are findings, not fixes — nothing has been implemented. The reports themselves warn that only
three findings were independently re-verified and that *"everything else should be re-confirmed
before a fix is written against it."*

This plan turns that backlog into shipped work: **seven branches, seven PRs** — one core PR, one per
rendering context, one closing verification PR. Every fix carries a regression test that fails
before it. Every breaking change is recorded in three places. The audit files are deleted at the
end; their content survives as tests and as a migration document.

**Agreed scope:** every **HIGH and MEDIUM** finding is fixed or explicitly deferred with a written
reason. **LOW** findings get a ledger row and are fixed opportunistically when the agent is already
in that file — never at the cost of PR reviewability.

---

## Starting position — read this before anything else

### 1. This branch is 12 commits behind `main`, and `main` already fixed part of the audit

`claude/context-audit-implementation-ojbwem` forks at `8121b9d`; `origin/main` is `ecaf902`.

| Commit on `main` | Effect on the audit |
|---|---|
| `8fdec5d` `fix(canvas,3d)` — size the surface from the host, not the backing store | **canvas #7 fully fixed.** `rescaleCanvas` now always returns scales; callers gate on logical size. Also changes the exported signature `RescaleResult \| undefined` → `RescaleResult` |
| `4018d8e` `fix(dom)` — reconcile a group that empties | **svg S-1 / dom F3 fully fixed.** Guard is now `childVNode.children.length > 0 \|\| domChild.children.length > 0` |
| `3d356a0` `refactor(core,svg,dom)!` — synchronous SVG commit + detached-node sweep | **svg S-10 half fixed** (post-destroy commit gone; cache retention untouched). Removed the public `Context.buffer`. Added `_resolveHitNode`, which does *not* address S-19's coordinate space |
| `9b89fa3` `fix(dom)` — pointer origin kept current | Adds `packages/dom/test/context.test.ts` (199 lines) — `DOMContext` is no longer untested |
| `95031ea` `perf(core,utilities)` — shared bounded gradient/pattern parse memo | Touches canvas #16/#17 but **fixes neither** — still parse-only, still a global unpruned cache |
| `a1027a0` `docs` | Adds `CONTRIBUTING.md` PR rules and the **`ripl-pull-requests` skill**, both absent from this worktree |

### 2. The audit README's "Already fixed" table is wrong — do not trust it

`docs/audits/README.md:47-57` credits four findings to `claude/paint-materialization` and
`claude/svg-commit-model`. Verified directly: **`claude/paint-materialization` is not merged.** The
global `patternCache` is still at `packages/canvas/src/utilities.ts:85`, and group gradients still
resolve per-paint. So **canvas #11, #12, #17 and svg S-4 are all still open**, contrary to the index.
`dom-node.md:133-135` itself contradicts the README. Trust the reports and the source, not the index.

### 3. `main` does not delete this branch's test infrastructure

`d0d0d82` added `packages/canvas/test/audit.test.ts`, `mockCanvasState`/`mockTextMetrics` in
`packages/test-utils/src/canvas.ts`, and a `docs/audits/**` eslint ignore. `main` never touched those
paths, so a plain `git merge origin/main` keeps all of them. They must survive — `audit.test.ts` is
the regression-pin pattern the whole plan reuses.

### 4. Four existing, currently-passing tests encode the bugs

This is the single most dangerous trap in the work. An agent instructed to keep the suite green will
"fix" the code to match a test that asserts the defect.

| Test | Asserts | Finding it encodes |
|---|---|---|
| `packages/core/test/context/context.test.ts:1161` | `hitTest` returns elements sorted by zIndex, highest first | **dom F1.** Must be deleted or inverted; `:1176` (render order as tiebreaker) becomes the whole contract |
| `packages/svg/test/gradient-units.test.ts:155` | gradient falls back to the surface when there is no render element | **svg S-4.** Pins the behaviour the finding calls wrong |
| `packages/terminal/test/color.test.ts:43-49` | `colorToAnsiFg('none'\|'transparent') === ''` | **terminal F3.1** |
| `packages/node/test/index.test.ts:60` | `measureText` width scales with character count | **dom-node F16** — encodes the 4×-off char-count model |

Plus `packages/canvas/test/context.test.ts:132` `'save and restore delegate without throwing'` — the
vacuous test canvas #21 exists to call out.

Changing one of these is **expected and correct**, and the PR body must say so explicitly.

### 5. The audit's own line references drift

`canvas.md` and `3d-webgpu.md` references into `packages/core/src/core/element.ts` are **stale by
20–26 lines** (`:834`→`:817`, `:878-881`→`:858-861`, interpolate tick `:864`→`:845`). `svg.md`'s
`element.ts:859` is correct. Every `packages/{canvas,svg,terminal,dom,node,3d,webgpu}/src` and
`packages/core/src/context/context.ts` reference in all five reports is exact. Locate by symbol, not
by line.

---

## Structure: seven PRs, core first, the rest stacked

```
Phase 0   re-baseline (merge main, toolchain, record green gates)   ── orchestrator, serial
Phase 1   triage × 5 (read-only, one per report)                    ── 5 agents, parallel
Phase 2   PR #1  claude/context-audit-core         ← the gate       ── 1 agent
Phase 3   PR #2  claude/context-audit-canvas       ┐
          PR #3  claude/context-audit-svg          │ cut from core head,
          PR #4  claude/context-audit-dom-node     ├ all targeting main,   ── 5 agents, parallel
          PR #5  claude/context-audit-terminal     │ "Stacked on #1"
          PR #6  claude/context-audit-3d-webgpu    ┘
Phase 4   PR #7  claude/context-audit-verification                  ── 1–2 agents
```

**Every PR targets `main`.** `.github/workflows/test.yml` fires only on
`pull_request: branches: [main]` — a PR targeting the core branch gets **no CI at all**. Context
branches are therefore *cut from* the core branch but *target* `main`, opening with the repo's
stacked-PR line. Once PR #1 merges, each context branch merges `main` and its diff cleans up.

---

## Why a core PR must land first

Roughly **15 findings live in `packages/core`**, each observed by two to five backends. Five branches
fixing them independently means a five-way conflict *and* five divergent semantic choices.

| Core defect | Reported as | Symbol to fix |
|---|---|---|
| Scene-root `clip: true` leaks one `save()` per frame | canvas #2, svg S-9, terminal F24, 3D-13 | `Context.batch`/`popGroup`, `Scene._collectInstructions` (emits push/pop only for child groups), `Shape.render`'s `skipRestore` |
| Clip shape's transform **and** paint leak to later siblings | canvas #3 | `Element.render`'s `if (!skipRestore)` + `shape.ts:170` |
| Group gradient bounds resolve against the previous leaf / each leaf | canvas #4, svg S-4 | `Context.pushGroup` never assigns `currentRenderElement` |
| Child opacity **replaces** group alpha (canvas) vs multiplies (SVG) — 0.5 vs 0.125 | canvas #11, svg S-5 | `core/constants.ts:40` `basicContextSetter('opacity')` vs `pushGroup`'s `*=` |
| `hitTest` sorts by additive z-index, not paint order | dom F1 | `Context.hitTest` — `renderedElements` is *already* exact paint order, so the sort discards correct information |
| Tracked-element memo survives `off()`, `once()` self-removal, `EventBus.destroy()`; destroyed element stays hit-testable | dom F10, F11 | `Context._getTrackedElements`, `EventBus.destroy`, `Scene`'s deferred rebuild |
| Nested synchronous render pass duplicates `renderedElements` (and the SVG vtree) | dom F13 | `Context.markRenderStart` depth-0 reset |
| `Element.render` registers the element, then `markRenderStart()` wipes it at depth 0 | canvas #18 | `element.ts:858-861` |
| No `try/finally` anywhere in the render bookkeeping — one throw freezes the surface **permanently** | canvas #19, svg S-13, terminal F17, 3D-19 | `Group.render`, `Scene`, `Renderer._tick` (re-arms rAF only on the success path) |
| Scene root never inherits the host font | svg S-8 | `scene.ts:140` `instanceof globalThis.HTMLElement` — an `SVGSVGElement` is not one |
| `Text` bounding boxes use factory metrics, not context metrics | dom F16 (part 1), terminal F22 | `Text._getLocalBoundingBox` calls the free `measureText` → `factory.measureText`, never `context.measureText`. **One fix kills both findings** |
| `ContextExport` has no revoke hook → every `toURL()` leaks | dom F21, terminal F23 | `core/src/context/types.ts:166-176`, then dom/terminal/svg implementations |
| `createFrameBuffer` returns no cancel handle → hit tests fire after teardown | dom F8 (core half) | `core/src/animation/utilities.ts:10-21` — **public API break**; a callable with a `.cancel` property is the additive alternative |
| `factory.devicePixelRatio` frozen by the `{ ...this._state, ...options }` spread | canvas #10 | `core/src/core/factory.ts:90-95` — `web`'s getter is live; the spread is what freezes it |
| `measureText` drops `textAlign`/`textBaseline`; the `context` option is dead | canvas #14 | `MeasureTextOptions`; `domMeasureText` already honours them, so backends just need to forward |

---

## Phase 0 — Re-baseline and toolchain (orchestrator, serial)

1. `git merge origin/main` into `claude/context-audit-implementation-ojbwem`. Expect no conflicts —
   `main` never touched this branch's four added paths. Verify `audit.test.ts`, `mockCanvasState`,
   `mockTextMetrics` and the eslint ignore all survive.
2. **Get the toolchain running.** `engines.node` is `>=24.18.1` and `.nvmrc` pins `24.18.1`, but this
   sandbox has only Node 20/21/22 and no `node_modules`. `nvm install 24`, then `yarn install`. If
   Node 24 cannot be obtained, fall back to Node 22 with `YARN_ENABLE_STRICT_ENGINES=false` and
   **record the deviation** — it must appear in every PR's verification section.
3. **Record the green baseline** — the numbers every later phase is measured against: `yarn lint`,
   `yarn typecheck`, `yarn build`, `yarn typecheck:dist`, `yarn test` (file count, test count, and
   all four coverage numbers: thresholds are lines 70 / statements 70 / functions 62 / branches 57,
   and they fail CI).
4. **Un-skip `packages/canvas/test/audit.test.ts:62`** (canvas #7) — `main` fixed it, so the pin
   should now pass. If it doesn't, `8fdec5d` is incomplete and that becomes a canvas-PR finding.
5. Push. This commit is the base every other branch is cut from.

**Success criteria** — five gates green with recorded counts; `audit.test.ts:62` un-skipped and
passing; two `test.skip`s remain (`:83` root clip, `:143` fill/stroke getters).

---

## Phase 1 — Triage (five read-only agents, parallel)

One agent per report. **No code changes.** The prior digests were produced against the *pre-merge*
tree, so every disposition must be re-derived against the phase-0 commit.

Each agent emits one row per finding:

| Column | Values |
|---|---|
| `id` | `canvas-4`, `S-6`, `F17`, `3D-1`, `WGPU-1` … |
| `disposition` | `STILL-BROKEN` · `ALREADY-FIXED` · `REFUTED` · `NOT-EXECUTABLE` |
| `evidence` | `STILL-BROKEN` → the current source, quoted. `ALREADY-FIXED` → the commit. `REFUTED` → why the reasoning fails |
| `owner` | `core` · `canvas` · `svg` · `dom` · `node` · `terminal` · `3d` · `webgpu` |
| `severity` | as reported |
| `breaking` | does the fix change observable rendering or public API? |
| `test-plan` | target file + what it asserts + **whether an existing test must change** |

`NOT-EXECUTABLE` is for what jsdom cannot reach — real layout, real paint, real GPU (svg S-18/S-19,
canvas #6, most `WGPU-*`, 3D CPU↔GPU divergence). These are **not** silently dropped: each is routed
to a Playwright test in phase 4 or explicitly deferred with a written reason in the final ledger.

**Success criteria**
- Every finding ID appears exactly once; counts reconcile against each report's ranked summary
  (canvas 21 + `1a`/`1b`, svg 21, dom-node 27 — **there is no F26**, terminal 24, 3d-webgpu 28).
- Every `ALREADY-FIXED` row names a commit, and the claim is proved by running the relevant test.
- The four bug-encoding tests in §4 above are each flagged in the owning finding's `test-plan`.
- Orchestrator merges the five ledgers into `docs/audits/LEDGER.md` on the base branch and routes
  all `owner: core` rows to phase 2.

---

## Phase 2 — PR #1 · `claude/context-audit-core` (one agent, the gate)

Cut from the phase-0 commit. Scope: every `owner: core` row at HIGH or MEDIUM, plus shared infra.

Attack order:

1. **Exception safety first** — `try/finally` around `pushGroup`/`popGroup` and
   `markRenderStart`/`markRenderEnd`, a floor on `renderDepth`, and re-arm `requestAnimationFrame` in
   `Renderer._tick`'s `finally`. Today one throw inside `batch` permanently freezes every surface.
   Cheap, and it unblocks debugging for all five phase-3 agents.
2. **Root clip leak** — un-skip `audit.test.ts:83`, which already pins it exactly. Fix at the
   scene/context boundary, never per-backend.
3. **Hit-test ordering (F1)** — subtractive: drop the z-index sort. **Requires rewriting
   `core/test/context/context.test.ts:1161`.** Land this before phase 3, because every `DOMContext`
   entry point takes `hitElements[0]`; fixing the interaction state machine on top of a wrong
   comparator just makes it reliably act on the wrong element.
4. **Parity semantics — decide once, here.** Group opacity (canvas #11 / svg S-5) and group gradient
   bounds (canvas #4 / svg S-4). Both are behaviour changes for existing consumers, and S-4 was
   *deliberately left open* by earlier work because the backends disagree by design — closing it is a
   real semantic commitment. Land the decision and the core-side mechanism here; write the chosen
   semantics into the `Context.pushGroup` / `applyGroupPaint` JSDoc so the canvas and svg agents
   cannot diverge. Say so explicitly in the PR body.
5. **`createFrameBuffer` cancellation** — gates dom F8/F9. Prefer the additive shape (a callable
   carrying `.cancel`) over changing the return type; if the return type must change, it is a
   `BREAKING CHANGE:` on `@ripl/core`.
6. **Shared-contract fixes** — `ContextExport` revoke hook (dom F21 + terminal F23),
   `Text._getLocalBoundingBox` routed through `context.measureText` (dom F16 + terminal F22),
   `MeasureTextOptions` forwarding, `factory.devicePixelRatio` spread.
7. **Extend `mockCanvasState`.** It tracks the 19 stateful paint properties but **no CTM and no
   save-depth counter**, so canvas #2/#3/#8's transform assertions are currently unwritable. Add
   matrix tracking here so phase 3 can use it.
8. **Create `docs/migrations/context-audit.md`** with one `## @ripl/<pkg>` heading per context, each
   stubbed. Phase-3 branches fill in **only their own heading**, so the six branches never conflict.

**Success criteria**
- Every `owner: core` HIGH/MEDIUM row fixed, or deferred with a reason in the PR body.
- Each fix has a test in `packages/core/test/` demonstrated to **fail at the branch point and pass on
  the branch** — run it both ways, don't assert it.
- `context.test.ts:1161` rewritten, with the PR body explaining that the old test encoded F1.
- Both parity semantics documented in `Context` JSDoc **and** in the migration doc.
- `audit.test.ts:83` un-skipped and passing; `:143` un-skipped if core-side, else routed to canvas.
- `mockCanvasState` tracks the CTM.
- Five gates green; coverage ≥ the phase-0 baseline.

---

## Phase 3 — Five context PRs (five agents, parallel)

Each cut from the **core branch head**, targeting `main`, opening with `Stacked on #1 — review that
first; this PR's diff is only the <context> commits.`

| PR | Branch | Packages | HIGH / MEDIUM headline work |
|---|---|---|---|
| **#2 canvas** | `claude/context-audit-canvas` | `canvas` | **#5** `isPointInStroke` runs with the residual `lineWidth` of 1, never the element's → every Sankey link (`pointerEvents: 'stroke'` + `lineWidth: link.width`) is unhoverable. **#8** `reset()` is a bare delegate that discards the DPR transform and desyncs `saveDepth`. **#16** no `destroy()` — element graph, backing store, `patternCache`, `gradientCache` and object URLs all retained. **#13** text-along-path offset by half a glyph under the default `textAlign: 'start'`. **#10** DPR frozen. **#3/#4/#11** backend halves of the core decisions |
| **#3 svg** | `claude/context-audit-svg` | `svg` | **S-2** `applyClip` **replaces** the active clip (`_currentClipId` is one scalar) instead of intersecting. **S-3** the clip is stamped on the leaf, so it resolves in the leaf's user space and is displaced by every intervening `<g>` transform. **S-6** box hit testing divides a CSS-px point by DPR → 2× mis-hit on Retina for `Text`/`Image`/`Group`. **S-7** `drawImage` re-encodes a PNG data URL **every frame**. **S-10** retention half (10 caches, no `destroy()`). **S-11** `maxWidth` silently dropped. **S-12** no `mix-blend-mode`. **S-4/S-5** backend halves. Note `svg/src/context.ts:655-659` has canvas #14's defect too — unlisted in the report |
| **#4 dom+node** | `claude/context-audit-dom-node` | `dom`, `node` | The pointer state machine as **one unit** — see the mandatory ordering below. Then **F5** duplicate sibling id deletes an element and reorders the rest; **F12** `mousemove` payloads are CSS px while `click`/`drag` are device px; **F13** nested render duplication; and the `@ripl/node` cluster — **F16** `measureText` 4×/2.5× off and ignoring `MeasureTextOptions`, **F18** `createElement` returning `{}` and defeating core's degradation guards, **F27** `rAF` pinning the event loop so a static chart never lets the process exit |
| **#5 terminal** | `claude/context-audit-terminal` | `terminal` | Paint resolution is the whole story: **F1** ANSI colour bleeds forever when a glyph resolves to `''`; **F2** named colours, `#rgb`, gradients and patterns silently lose all colour; **F3** `transparent`/`none`/zero-alpha still paint at full strength; **F4** `opacity` is composited by core and read by nobody, so `opacity: 0` renders solid; **F5** stroked text renders nothing. Then **F6** `ellipse` drops rotation/start/end/ccw, **F7/F8** resize ordering and clobbered explicit dimensions, **F9** `toImageData()` drops every glyph, **F10** shrink leaves stale rows, **F12** text-on-path ignored. **F11** (transforms dropped) is a documented design gap — decide and record, don't silently implement |
| **#6 3d+webgpu** | `claude/context-audit-3d-webgpu` | `3d`, `webgpu` | The deferred-draw cluster, one root cause — a deferred renderer inside an immediate one: **3D-1** a non-hex `fill` (`'red'`, a gradient) throws in `triangulateFacesFlat` and kills the rAF loop permanently; **3D-2** the face flush discards opacity, composite, filter, shadow, clip **and all 2D transforms**; **3D-3** declared normals are never multiplied by the model matrix, so CPU shading is frozen under rotation while the GPU path is correct; **3D-4** geometry never animates because the interpolate tick bypasses the face-cache invalidation. Then **3D-5** `lightMode` world/camera swapped, **3D-6** camera-dependent bbox cached against element state, **3D-9** paint order, **3D-10** resize reverts ortho→perspective, **3D-11** picking vs paint depth, **3D-12** camera hijacks touch; **WGPU-1** GL `[-1,1]` vs WebGPU `[0,1]` NDC, **WGPU-2** `window.devicePixelRatio` instead of `factory`, **WGPU-3/4** |

`3d`+`webgpu` stay together because WGPU-1 lives in `packages/3d/src/math/matrix.ts`. `dom`+`node`
stay together because they are one report and one state machine.

### PR #4's fix ordering is load-bearing — not negotiable

`packages/dom/src/context.ts` (`DOMContext`, 310 lines) is the sole owner of pointer state, and it is
split across two lifetimes: `_activeElements` is an instance field surviving the whole object, while
everything else lives in `InteractionState` and is nulled by `disableInteraction()`. That asymmetry
causes half the cluster.

```
F1 (core, PR #1)  →  F8  →  F2 + F6 + F7  →  F4 + F9  →  F12  →  F10 / F11 (core)
```

- **F8 must precede F9.** `_handleHoverHitTest` reads `_activeElements` (instance-scoped) and never
  touches `_interactionState` (nulled at `:298`), so a pending frame callback runs happily after
  teardown and **re-populates the set it was just flushed from**. Flush before cancel and you get
  `disableInteraction()` → `mouseleave` → next frame → `mouseenter` on a dead context.
- **F2 and F7 are one chain.** F2 leaves `dragElement` set; F7 is why it is *permanent* —
  `_handleMouseDown` assigns only inside `if (hitElements.length > 0)` with no `else`. The stale
  `dragStartX/Y` also make the next gesture's delta baseline the previous gesture's origin.
- **F2 and F6 are the same edit in opposite directions.** F6 exists because `_handleMouseUp` clears
  `dragStarted` before the synthesised `click` reaches `_handleClick`. Any centralised `_endDrag()`
  must set a consume-once "this gesture was a drag" flag, or a window-level `mouseup` handler makes
  F6 strictly harder.
- **F4 and F9 are one defect with two entry points** — both want a shared `_flushActiveElements()`
  called from `_handleMouseLeave` and `disableInteraction`.
- Fold in while the file is open: the stale `left`/`top` origin cache (only written by
  `_handleMouseEnter`, so any scroll between enter and mousedown skews every coordinate) and F24's
  identical `getBoundingClientRect()` thrash in `navigator.ts:127-137`.

### Per-agent contract (identical for all five)

- Fix every `STILL-BROKEN` **HIGH and MEDIUM** row your report owns, highest severity first. LOW rows
  only if you are already in that file. Anything not fixed gets a one-paragraph deferral in the PR
  body — silence is not an option.
- Every fix carries a test that **fails at the branch point**. Demonstrate it — run the new test
  against the base commit, capture the failure, then fix. A test that passes either way proves
  nothing.
- **If an existing test encodes the bug, change it and say so in the PR body.** See §4 above for the
  four known cases; the triage ledger flags any others.
- Use `mockCanvasState` wherever a test asserts state after a scope closes. `mockCanvasContext`'s
  `save`/`restore` are no-ops and **structurally hide this entire defect class** (canvas #21) — a test
  on the bare stub cannot tell a correct context from one that never restores anything.
- Coverage holes to fill while you are there: `packages/3d/test/shape.test.ts` **does not exist**
  (`Shape3D.render`, `_renderCPU`/`_renderGPU`, the face cache, `_getLocalBoundingBox` are entirely
  untested); `WebGPUContext3D` **has no test file**; `terminal/test/rasterizer.test.ts` never hits the
  `charEntry.color === ''` branch that is F1.
- Fill in **only your own heading** in `docs/migrations/context-audit.md`.
- **Do not touch `packages/core`.** Found a new core defect? Report it to the orchestrator.

### Success criteria (each branch)

- Every HIGH and MEDIUM row you own is `fixed` or `deferred-with-reason`. No HIGH may be silently open.
- Each fix's test demonstrably fails at the branch point.
- Five gates green; coverage ≥ the phase-0 baseline.
- Public API touched → JSDoc per `CLAUDE.md`, verified with the TypeDoc `notDocumented` command.
- No multi-line `//` blocks. No `switch` (banned by `no-restricted-syntax` — use keyed object
  dispatch, e.g. the existing `POINTER_EVENT_HIT_TESTS` map). No runtime dependencies.
- PR body: problem (quoting the offending lines) → the fix and *why this shape* → verification with
  real numbers → `## Breaking` → follow-ups. Attribution footer.

---

## Phase 4 — PR #7 · `claude/context-audit-verification`

Cut once phases 2–3 have merged.

1. **Build the canvas↔SVG parity harness** — the audit's one explicitly outstanding deliverable.
   Render the same scene through both backends and diff them **against each other**, not against a
   stored baseline. `packages/charts/test/visual/` already has the machinery: `gallery.ts`,
   `chart-ids.ts` (shared so gallery and spec cannot drift), `vite.config.ts` aliasing `@ripl/*` to
   source, `playwright.config.ts` honouring `CHROMIUM_PATH`. Seed it with the two divergences the
   audit named — group gradient (S-4) and group opacity (S-5) — plus a CPU↔GPU 3D case for 3D-3,
   which has no scaffolding today.
2. **Cross-context conformance suite** in `packages/core/test/` — one scene driven through every
   available context, asserting the invariants the audit checked by hand: `saveDepth` returns to 0
   after each frame, `pushGroup`/`popGroup` balance, `renderedElements` is paint order, `destroy()` is
   idempotent and releases the graph, `export()` round-trips, a throw mid-render does not wedge the
   surface. This is what stops the next backend re-introducing all of it.
3. **Full-gate verification** across every merged branch, plus the branch-vs-`main` gallery render
   diff. Do **not** compare against the committed visual baselines — they are rendered on a specific
   Linux Chromium, currently fail on `main` in this sandbox, and a match would prove nothing. Render
   `main` and the branch in the same environment and diff those.
4. **Close the ledger.** All ~122 findings resolve to `fixed` (with the PR), `already-fixed` (with the
   commit), `refuted` (with reasoning), or `deferred` (with a reason, and a tracking issue for
   anything HIGH). Publish it in the PR body.
5. **Delete `docs/audits/`** — all six files plus `LEDGER.md` — and remove the now-dangling
   `docs/audits/**` ignore block from `eslint.config.js`. Keep `docs/migrations/context-audit.md`.

**Success criteria** — parity harness runs and its seeded divergences are green (or documented as
intentional, matching PR #1's decision); conformance suite passes against canvas, SVG, terminal and
node; full ledger published with zero findings unaccounted for; `docs/audits/` gone; eslint ignore
removed; `yarn lint` still green.

---

## Conventions every agent must follow

Read `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, and — after the phase-0 merge —
`.claude/skills/ripl-pull-requests/SKILL.md` before opening any PR.

| Thing | Rule |
|---|---|
| **Branch** | `claude/context-audit-<context>`, cut from the phase-0 (core: ) or core-branch head |
| **PR base** | `main` — CI fires only on PRs to `main` |
| **PR title** | A sentence, imperative, capitalised, no `type(scope):`, no trailing period, no breaking marker. `Intersect the active SVG clip instead of replacing it`, not `fix(svg): intersect clips` |
| **Commits** | Conventional — `fix(svg): …`, `!` for breaking. Subject lowercase, no period. Body extremely concise per the house voice, but substantive: mechanism, evidence, what was verified |
| **Breaking changes — all three, every time** | `!` in the commit subject **and** a `BREAKING CHANGE:` footer paragraph; a `## Breaking` section at the end of the PR body naming the exact symbol and the migration; your package's heading in `docs/migrations/context-audit.md` |
| **Tests** | Vitest + jsdom, `test/` mirrors `src/`, `describe` blocks, `"Should …"` names, one assertion per line |
| **Regression pins** | `packages/canvas/test/audit.test.ts` pins a confirmed-but-unfixed defect with `test.skip` and a one-line `// CANVAS-N:` comment — un-skip with the fix. Mirror it as `packages/<pkg>/test/audit.test.ts` |
| **JSDoc** | Mandatory on every public member incl. each options-interface property. Getter-only for accessor pairs. Verify with TypeDoc `notDocumented` |
| **Comments** | Never a multi-line `//` block. One line or delete it. Why, never what. Do not narrate tests |
| **Style** | 4 spaces, single quotes, semicolons, trailing commas except in function params, `1tbs`. No `switch`, no nested ternary, `max-depth: 4`. Explicit member accessibility; `private` members prefixed `_` |
| **Deps** | Zero new runtime dependencies |

---

## Verification

Per branch, before the PR opens:

```bash
yarn lint
yarn typecheck                       # the build does not typecheck — this is the type gate
yarn build && yarn typecheck:dist    # gates the published .d.ts
yarn test                            # coverage: lines 70 / statements 70 / functions 62 / branches 57

cd apps/website && yarn typedoc --entryPointStrategy resolve \
  --entryPoints ../../packages/<pkg>/src/index.ts --tsconfig ../../packages/<pkg>/tsconfig.json \
  --validation.notDocumented --excludePrivate --excludeProtected --excludeInternal --emit none \
  | grep 'does not have any documentation' | grep -v SetSignature
```

Fix-level proof — the step that is easy to skip and must not be:

```bash
git stash                          # or check out the branch point
yarn test <new test file>          # MUST fail
git stash pop
yarn test <new test file>          # MUST pass
```

Cross-context, phase 4:

```bash
CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome \
  yarn workspace @ripl/charts test:visual     # branch-vs-main diff, NOT vs committed baselines
```

Report real numbers — file and test counts, coverage deltas. Never "tests pass". If a check could not
run in this environment, say so plainly and say what you substituted.

---

## Risks and how the plan absorbs them

| Risk | Mitigation |
|---|---|
| Agents re-fix what `main` already fixed | Phase 0 merge + phase 1 re-triage against the merged tree; no fix starts without a `STILL-BROKEN` row |
| An agent "fixes" code to satisfy a test that encodes the bug | The four known cases are named up front; triage flags any others in `test-plan`; changing such a test is required and must be explained in the PR body |
| Five-way `packages/core` conflict | PR #1 is a hard gate; phase-3 agents are forbidden from touching `core` |
| canvas and svg pick different group-opacity / gradient semantics | Decided once in PR #1, written into `Context` JSDoc, enforced by the phase-4 parity harness |
| Interaction fixes land in the wrong order and mask each other | PR #4's ordering is specified and justified above; F1 lands in PR #1 first |
| Node 24 unavailable in the sandbox | Phase 0 resolves it; a Node 22 fallback is recorded in every PR |
| jsdom cannot execute layout/paint/GPU findings | `NOT-EXECUTABLE` routes them to the Playwright harness or to an explicit written deferral — never a silent drop |
| Visual baselines fail on `main` in this sandbox | Always diff branch-vs-`main` rendered in the same environment; never claim a baseline match |
| Seven PRs, ~122 findings, silent scope shrink | The ledger is the contract: every ID resolves to fixed / already-fixed / refuted / deferred-with-reason, published in phase 4 |
| Audit line refs are stale by 20–26 lines in `core/element.ts` | Locate by symbol, not line number |
| `docs/audits/**` eslint ignore outlives the directory | Removed in phase 4 with the files |
