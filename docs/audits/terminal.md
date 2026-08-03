# Audit — `@ripl/terminal` rendering context

Scope: `packages/terminal/src/{context,path,rasterizer,algorithms,color,output}.ts`, read against the
base contract in `packages/core/src/context/context.ts` and the pipeline in
`packages/core/src/core/{element,group,scene,renderer,shape}.ts`, with `packages/canvas` as the
parity reference.

Read-only investigation. Every CONFIRMED item below was reproduced by executing the real code
(vitest, jsdom env, `@ripl/core` + `@ripl/terminal` sources) in a scratch harness; the observed
output is quoted inline. Scratch files were deleted afterwards.

---

## 1. save/restore symmetry and state-stack integrity — VERIFIED CLEAN

`TerminalContext` does **not** override `save()`/`restore()`; there is no occurrence of either in
`packages/terminal/src/context.ts`. It therefore uses the base `Context` stack verbatim
(`packages/core/src/context/context.ts:79-84,436-450`): `states[]`, `currentState`, `saveDepth`,
with `restore()` guarded at `saveDepth === 0`.

Consequences verified:

- The paint cascade works. A `Group` with `fill: '#00ff00'` and an unpainted `Rect` child produced
  pixels coloured `\x1b[38;2;0;255;0m` — the group's paint reached the descendant through
  `pushGroup` → `save()` → copied `currentState`.
- `this.fill` / `this.stroke` in `applyFill`/`applyStroke` (`context.ts:393,404`) read
  `currentState`, so nested scopes resolve correctly.
- After a full `Scene.render()` containing a group and a `clip: true` shape (which renders with
  `skipRestore`), `saveDepth === 0` and `states.length === 0`. Balance holds.

No finding.

## 2. markRenderStart / markRenderEnd depth handling — ONE LOW FINDING

`markRenderStart` is not overridden. `markRenderEnd` (`context.ts:371-377`) calls `super` then
flushes at depth 0. Under `Scene.render()` → `Context.batch()` (`core/.../context.ts:502-513`) the
depth reaches 0 exactly once per frame, and exactly **two** writes are emitted per frame
(`"\x1b[H"` from `clear()`, then the serialized grid). Correct.

See **F17** for the missing floor on `renderDepth`.

## 3. pushGroup / popGroup balance, group opacity, clip scoping — MIXED

Balance verified (see §1). Group **opacity** is composited into `currentState.opacity` by the base
`pushGroup` but is then read by nobody — see **F4**. Group-scoped **clip** is a documented no-op;
`popGroup`'s depth unwind still correctly absorbs the dangling `save()` a clip shape leaves.

## 4. Transform composition and ordering — NOT HONOURED AT ALL

`rotate`/`scale`/`translate`/`setTransform`/`transform` are inherited as no-ops from `Context`
(`core/.../context.ts:574-614`). `applyElementTransform` (`core/core/transform.ts:54-104`) drives
exactly those five methods, so **every element and group transform is discarded**. See **F11**.

## 5. Paint resolution — BROKEN FOR SEVERAL VALID CSS PAINTS

`colorToAnsiFg` → `parseColor` only, with no `isGradientString`/`isPatternString` branch and no alpha
handling. Compare `packages/canvas/src/utilities.ts:177-197` (`setCanvasFill`), which tries pattern,
then gradient, then falls back to assigning the raw string to `fillStyle` (so the browser resolves
named colours, `#rgb`, `color-mix()`, `currentColor`, …). See **F2**, **F3**.

Gradients/patterns are **not** painted as literal text — they resolve to the empty string and the
geometry is drawn uncoloured (which is a different, quieter failure).

## 6. Text metrics and text rendering — see F5, F12, F22

## 7. Hit testing — dead by design, with one latent inconsistency

`isPointInPath`/`isPointInStroke` inherited → always `false` (verified). `hitTestHonorsTransform`
is the base default `false` (verified). Because `Shape2D.hitPaths` is non-empty, `Shape2D.intersectsWith`
(`core/core/shape.ts:96-137`) never falls back to the bounding-box test, so **no** hit testing works.
Documented in the class JSDoc (`context.ts:286-287`) and the README. See **F21** for the latent
`hitTestHonorsTransform` inconsistency.

## 8. export() — one real defect

Shape matches `ContextExport` (`core/context/types.ts:166-177`) and correctly snapshots eagerly
(verified: mutating the grid after `export()` does not change `toString()`). Defect: **F9**.

## 9. destroy() cleanup and leak surface — MOSTLY CLEAN

`destroy()` is not overridden; the base calls `dispose()` then `EventBus.destroy()`. The
`output.onResize` disposer is retained at `context.ts:330-332` and **was verified to be invoked**
on `destroy()`. Remaining surface: **F20** (terminal state not restored), **F23** (Blob URL never
revoked — same as `packages/dom/src/export.ts:51`, so a codebase convention rather than a terminal
defect).

## 10. Parity with canvas for an identical scene

What works well: even-odd scanline fills are genuinely good. A full donut
(`createArc({ innerRadius })`, 0→2π) rendered as a correct ring, and a half donut as a correct
half ring — the annular hole is preserved. Uniform logical→raster letterboxing is correct
(circle r=100 logical in a 400×300 space over an 80×48 grid → exact 16-px radius, centred).

Silently dropped, categorised:

| Feature | Status | Where |
|---|---|---|
| transforms (translate/rotate/scale) | not implemented, **documented** (`context.ts:288-290`, README) | F11 |
| clipping (`applyClip`) | not implemented, documented (`context.ts:291`) | — |
| images (`drawImage`) | not implemented, documented (`context.ts:291`) | — |
| hit testing | not implemented, documented (`context.ts:286-287`) | §7 |
| gradients / patterns | not implemented, README-documented | F2 |
| **opacity / globalAlpha** | not implemented, **undocumented** | **F4** |
| **alpha channel of `rgba()`/`#rrggbbaa`** | **implemented wrongly** (parsed then discarded) | **F3** |
| **`transparent` / `none` fills** | **implemented wrongly** (geometry still painted) | **F3** |
| **named CSS colours, `#rgb`** | **implemented wrongly** (drop to no-colour + bleed) | **F2** |
| **stroked text** | **implemented wrongly** (renders nothing) | **F5** |
| **partial / rotated ellipse** | **implemented wrongly** (full unrotated ellipse) | **F6** |
| **text on a path (`pathData`)** | not implemented, undocumented | F12 |
| lineWidth / lineDash / lineCap / lineJoin / miterLimit | not implemented, undocumented | F14 |
| shadow* / filter / globalCompositeOperation | not implemented, undocumented | F15 |
| `reset()` | not implemented, undocumented | F16 |

---

# Findings

## CONFIRMED — implemented wrongly

### F1 — ANSI colour bleeds indefinitely when a glyph has no resolved colour — HIGH

`packages/terminal/src/rasterizer.ts:201-208` (and the guard at `:233`)

**Defect.** In `_serializeRow`, a `_chars` entry whose colour is `''` sets `lastColor = ''` without
emitting `ANSI_RESET`, so the glyph is painted in the previously active colour and the row's
end-of-row reset (`return lastColor ? ... : output`, `:233`) is skipped — the stale SGR leaks to the
rest of the row, the rest of the frame, and every following frame.

The blank-cell branch (`:213-221`) *does* emit `ANSI_RESET`, which is exactly the missing behaviour
in the char branch.

**Failure scenario (reproduced).** 6-column grid. Fill `#ff0000`, `rect(0,0,2,3)`; then fill `#888`
(the literal value used at `apps/website/src/.vitepress/components/example-terminal-interactive.vue:147,175`),
`createText({ x: 4, y: 0, content: 'ab' })`, baseline `top`. Emitted frame:

```
"\x1b[1;1H\x1b[38;2;255;0;0m⣿⡇ab  "
```

The `ab` glyphs render **red**, and no reset is ever emitted, so every subsequent cell the terminal
draws stays red until some other element happens to set a colour. Minimal form (test A): red pixel
at (0,0) plus `setChar(1, 0, 'X', '')` → `"\x1b[1;1H\x1b[38;2;255;0;0m⠁X  "`.

**Severity:** high — corrupts the whole screen, is trivially reachable from the shipped demo, and is
self-perpetuating across frames.

**Test sketch.**
```ts
const r = new BrailleRasterizer(4, 1);
r.setPixel(0, 0, '\x1b[38;2;255;0;0m');
r.setChar(1, 0, 'X', '');
expect(r.serialize()).toBe('\x1b[1;1H\x1b[38;2;255;0;0m⠁\x1b[0mX  ');
// and, invariant form: a serialized row must never leave an SGR open
expect(r.serialize().endsWith(ANSI_RESET)).toBe(true);
```

### F2 — Valid CSS paints (named colours, `#rgb`, gradients, patterns) silently lose all colour — HIGH

`packages/terminal/src/color.ts:9-23`, consumed at `packages/terminal/src/context.ts:393,404`

**Defect.** `colorToAnsiFg` resolves colour exclusively through `parseColor`
(`packages/core/src/color/index.ts:82`), whose `PATTERNS` (`packages/core/src/color/constants.ts:6-14`)
are anchored and cover only `#rrggbb[aa]`, `rgb()`, `rgba()`, `hsl()`, `hsla()`, `hsv()`, `hsva()`.
Anything else returns `undefined` → `''` → the geometry is rasterized with **no** colour, and
`BrailleRasterizer.setPixel`'s `if (color)` guard (`rasterizer.ts:169-171`) means the cell keeps
whatever colour a *previous, unrelated* element left there. The canvas backend, by contrast, falls
through to `ctx.fillStyle = value` (`packages/canvas/src/utilities.ts:196`) and handles
gradients/patterns explicitly at `:178-194`.

**Failure scenario (reproduced).** Same rect filled with each value; the set of ANSI codes handed to
`setPixel`:

| value | terminal | canvas |
|---|---|---|
| `red` | `[""]` | red |
| `#f00` | `[""]` | red |
| `#888` | `[""]` | grey |
| `currentColor` | `[""]` | inherited |
| `linear-gradient(...)` | `[""]` | gradient |
| `#ff0000` | `["\x1b[38;2;255;0;0m"]` | red |

Every one of these also triggers **F1** when it lands on a text glyph.

**Severity:** high — `fill: 'white'` / `#888` / `#f00` are idiomatic and appear in this repo's own
terminal demo; the failure is silent.

**Test sketch.** Table-driven over `['red', '#f00', '#888', 'white', 'currentColor']`: assert the
colour passed to a spy rasterizer's `setPixel` is a truecolor escape, not `''`. (Fix direction:
expand `parseColor` coverage, or have `colorToAnsiFg` fall back to a DOM/`CSS.supports` resolution,
or at minimum a named-colour table + `#rgb` expansion.)

### F3 — `transparent` / `none` / zero-alpha paints still draw geometry at full strength — HIGH

`packages/terminal/src/context.ts:392-400`; `packages/terminal/src/color.ts:11,20`

**Defect (two parts).**
1. `colorToAnsiFg` early-returns `''` for `'none'`/`'transparent'` (`color.ts:11`), but `applyFill`
   proceeds to `_rasterizePath(element, '', true)` regardless — the shape is still rasterized, just
   uncoloured. Nothing anywhere treats "no colour" as "do not paint".
2. `parseColor` returns a 4-tuple, but `colorToAnsiFg` destructures `const [r, g, b] = parsed`
   (`color.ts:20`) and throws the alpha away. `rgba(255,0,0,0)` becomes fully opaque red.

**Failure scenario (reproduced).** `ctx.fill = 'transparent'; path.rect(0,0,6,6); ctx.applyFill(path)`
→ **70 pixels plotted**. Same for `'none'` and `'rgba(0,0,0,0)'`. `rgba(255,0,0,0.25)` →
70 pixels at full `\x1b[38;2;255;0;0m`. Canvas paints nothing for the first three and a
25 %-alpha red for the fourth.

Real-world: a chart element parked at `fill: 'transparent'` (or a legend swatch faded via
`rgba(...,0)`) appears as a solid block of braille.

**Severity:** high — draws things canvas would not draw at all.

**Test sketch.**
```ts
ctx.fill = 'transparent';
ctx.applyFill(rectPath);
expect(spy.pixels).toHaveLength(0);

ctx.fill = 'rgba(255,0,0,0)';
ctx.applyFill(rectPath);
expect(spy.pixels).toHaveLength(0);
```

### F4 — `opacity` is composited into the state and then ignored — HIGH

`packages/terminal/src/context.ts` (no reader of `this.opacity` anywhere in the package);
producers: `core/context/context.ts:526-538` (`pushGroup`), `core/core/element.ts:889-895`
(`CONTEXT_OPERATIONS.opacity`)

**Defect.** The base pipeline faithfully maintains `currentState.opacity` (element opacity via
`CONTEXT_OPERATIONS`, group opacity multiplied at the boundary). `TerminalContext` never reads it,
so **`opacity: 0` renders identically to `opacity: 1`**. This is *not* in the documented constraint
list (`context.ts:279-291`) nor in the README.

**Failure scenario (reproduced).**
- `createRect({ x:0, y:0, width:8, height:8, fill:'#ff0000', opacity: 0 })` in a scene → **108
  pixels plotted**, full red.
- `createGroup({ opacity: 0, children: rect })` → **108 pixels plotted**.

Concrete downstream breakage: `packages/charts/src/components/crosshair.ts:126,142` parks both
crosshair lines at `opacity: 0` until hover — in the terminal they are **permanently visible**.
`packages/charts/src/components/axis.ts:696-756` and `legend.ts:337-349` fade elements in from
`opacity: 0`; in the terminal every "hidden" enter/exit element is drawn at full strength for the
whole animation.

**Severity:** high — it is the mechanism the charts package uses for show/hide, so charts render
with permanently-visible chrome.

**Test sketch.**
```ts
scene.add(createRect({ ..., fill: '#ff0000', opacity: 0 }));
scene.render();
expect(spy.pixels).toHaveLength(0);           // or: dithered/attenuated, but not full strength
```
(A character grid cannot do real alpha; the minimum correct behaviour is to skip drawing at
`opacity === 0` and to blend the emitted colour toward the background otherwise.)

### F5 — Text with a `stroke` renders nothing — HIGH

`packages/terminal/src/context.ts:402-409` vs `packages/core/src/elements/text.ts:124-131`

**Defect.** `applyStroke` handles only `TerminalPath`; the `ContextText` branch present in
`applyFill` (`context.ts:397-399`) has no counterpart. `Text.render` prefers stroke over fill:

```ts
if (this.stroke) { return context.applyStroke(text); }
if (this.fill)   { return context.applyFill(text); }
```

so any text with a stroke set takes the stroke branch and produces **no output at all** — the fill is
never reached. The canvas backend handles both (`packages/canvas/src/utilities.ts:301-311`).

**Failure scenario (reproduced).** A scene with two texts —
`createText({ content: 'label', fill: '#ffffff', stroke: '#ff0000' })` and
`createText({ content: 'plain', fill: '#ffffff' })` — produced glyphs `"plain"` only. The
outlined label vanished entirely.

**Severity:** high — an outlined label (fill + stroke, a common readability treatment over dense
plots) disappears rather than degrading.

**Test sketch.**
```ts
scene.add(createText({ x: 4, y: 20, content: 'label', fill: '#fff', stroke: '#f00' }));
scene.render();
expect(spy.chars.map(c => c[2]).join('')).toBe('label');
```

### F6 — `ellipse` drops rotation, start/end angle and direction; always draws a full unrotated ellipse — MEDIUM

`packages/terminal/src/context.ts:214-222` (handler) — args recorded at
`packages/terminal/src/path.ts:91-99`

**Defect.** `TerminalPath.ellipse` records
`[x, y, radiusX, radiusY, rotation, startAngle, endAngle, ccw]`, but both handler passes read only
`args[0..3]`:

```ts
contours.push(flattenEllipse(sx(args[0]), sy(args[1]), args[2] * s, args[3] * s));
// and
rasterizeEllipse(sx(args[0]), sy(args[1]), args[2] * s, args[3] * s, plot);
```

`flattenEllipse`/`rasterizeEllipse` (`algorithms.ts:93,327`) have no angle or rotation parameters at
all. Contrast the sibling `arc` handler (`context.ts:202-213`), which *does* forward
`startAngle`/`endAngle`/`ccw`. This is not listed among the documented limitations.

**Failure scenario (reproduced).** `createEllipse({ cx:40, cy:24, radiusX:20, radiusY:10,
startAngle: 0, endAngle: Math.PI/2, stroke:'#ff0000' })` (the core element forwards the angles at
`packages/core/src/elements/ellipse.ts:133-141`) plotted `x[20..60] y[14..34]` — the **complete**
ellipse — where the quarter arc should occupy `x[40..60] y[24..34]`. A direct
`path.ellipse(20,20,15,5, Math.PI/2, 0, Math.PI)` likewise drew a full, unrotated ellipse.

**Severity:** medium — a whole documented element type (`Ellipse` with `startAngle`/`endAngle`, and
`Polyline.ellipse`) renders wrong geometry, silently.

**Test sketch.**
```ts
const path = ctx.createPath();
path.ellipse(20, 20, 15, 5, 0, 0, Math.PI);   // lower half only
ctx.applyStroke(path);
expect(Math.min(...spy.pixels.map(p => p[1]))).toBeGreaterThanOrEqual(20);
```

### F7 — On resize, the repaint fires with a half-updated coordinate mapping — MEDIUM

`packages/terminal/src/context.ts:352-361` (specifically `:356` then `:359`)

**Defect.** `_applyScaling` sets `this._rasterScale = scale` (`:356`) and *then* calls
`this.rescale(...)` (`:359`), which resets `scaleX`/`scaleY` to identity **and synchronously emits
`resize`** (`core/context/context.ts:417-425`). `Scene`'s resize handler repaints immediately
(`core/core/scene.ts:162-169`). Only after that emit returns do `:360-361` install the letterbox
scales. So the repaint runs with the *new* `_rasterScale` but the *identity* `scaleX`/`scaleY` — the
two halves of the mapping (`_buildContours`/`_executeCommands` use `sx`/`sy` for points and `s` for
extents, `context.ts:511-518,531-536`) disagree.

The in-code comment at `:358` anticipates the ordering but not the synchronous emit.

**Failure scenario (reproduced).** Context with `logicalWidth: 400, logicalHeight: 300` over a 40×12
grid; a `rect(0,0,400,300)` stroke. Grid resized to 80×24 (160×96 raster):

```
repaint fired during resize : x[0..128] y[0..96]     <- wrong origin, letterbox offset missing
next explicit render        : x[16..144] y[0..96]    <- correct
```

Under a running `Renderer` the next tick corrects it (one bad frame). For a **static** scene rendered
via `scene.render()` with no `Renderer`, the mis-placed frame is what stays on screen.

**Severity:** medium.

**Test sketch.** Install a spy rasterizer, trigger `onResize`, and assert the pixels captured *during*
the resize match the pixels of an explicit `scene.render()` immediately afterwards.

### F8 — Explicit `width`/`height` options are discarded on the first resize — MEDIUM

`packages/terminal/src/context.ts:317-320` vs `:324-333`

**Defect.** The constructor honours the caller's fixed grid (`width ?? output.columns`), but the
resize handler unconditionally forwards the terminal's new dimensions:
`this._rasterizer.resize(cols, rows)`. There is no memory of the explicit size.

**Failure scenario (reproduced).** `createContext(output, { width: 20, height: 10 })` on a 100×40
terminal → `ctx.width === 40` (20 cols × 2). After a `SIGWINCH` reporting 100×41 → `ctx.width === 200`.
A deliberately fixed-size viewport silently becomes full-screen.

**Severity:** medium (documented option does not hold).

**Test sketch.**
```ts
const ctx = createContext(output, { width: 20, height: 10 });
notifyResize(100, 41);
expect(ctx.width).toBe(20 * BRAILLE_CELL_WIDTH);
```

### F9 — `toImageData()` drops every text glyph, so `export().toImage()` / `.toURL()` lose all text — MEDIUM

`packages/terminal/src/rasterizer.ts:280-300` (loop at `:286-297`)

**Defect.** The loop reads `this._dots` only; the `_chars` map — the sole home of every glyph placed
by `setChar` — is never consulted. `serialize()` handles both (`:199-209`, `:241-246`); `toImageData`
does not.

**Failure scenario (reproduced).** `new BrailleRasterizer(4,1); r.setChar(0,0,'X','\x1b[38;2;255;0;0m');
r.toImageData()` → **no pixel has non-zero alpha**. Every axis label, legend label and title is
missing from `context.export().toImage()` and from the PNG produced by
`terminalSnapshotToURL` (`context.ts:83-104`), while `export().toString()` shows them.

**Severity:** medium — the PNG/ImageData export is a documented feature (README "Exporting") and is
silently lossy.

**Test sketch.**
```ts
r.setChar(0, 0, 'X', '\x1b[38;2;255;0;0m');
const img = r.toImageData();
expect(Array.from(img.data).some((v, i) => i % 4 === 3 && v > 0)).toBe(true);
```
(A minimal fix is a 5×7-ish glyph bitmap; even rendering the cell as a solid block would be closer
than nothing.)

### F10 — Shrinking the terminal leaves stale rows on screen — MEDIUM/LOW

`packages/terminal/src/context.ts:365-368` (`clear`), `rasterizer.ts:257-278` (`serialize`)

**Defect.** `clear()` writes only `\x1b[H` (cursor home) and clears the in-memory grid. `serialize()`
emits exactly `_rows` rows of exactly `_cols` cells. Nothing ever erases the display, so rows that
existed before a shrink are never overwritten.

**Failure scenario (reproduced).** 6×3 grid, red rect → frame carries rows `1;1H`, `2;1H`, `3;1H`.
Resize to 6×1 and re-render → frame carries only `\x1b[1;1H…`. Rows 2 and 3 of the physical terminal
still show the previous braille. No `\x1b[2J`/`\x1b[J` is emitted anywhere in the package.

**Severity:** medium/low — cosmetic but permanent until something else scrolls the terminal.

**Test sketch.** Capture writes across a shrink and assert the frame contains an erase-below
(`\x1b[J`) or that the grid is padded to the previous row count.

### F11 — Element and group transforms are dropped entirely — MEDIUM (documented, but the largest parity gap)

`packages/terminal/src/context.ts:288-290` (the documentation of the gap); mechanism:
`core/context/context.ts:574-614` no-ops + `core/core/transform.ts:54-104`

**Defect.** Documented as "No affine transforms", so *by design* — but it is worth stating plainly
because the class JSDoc's claim that "elements are positioned through the context's own
`scaleX`/`scaleY`/`rasterScale` mapping instead" is not a substitute: that mapping is a single global
letterbox, it cannot express per-element placement.

**Failure scenarios (reproduced).**
- `createRect({ x:0, y:0, width:4, height:4, translateX:30, translateY:20 })` → drawn at
  `x[0..4] y[0..4]`, i.e. at the origin.
- `createGroup({ translateX: 20, children: rect })` → identical, `x[0..4]`.
- `rotation: π/2, transformScaleX: 2` on a 20×2 rect → `x[10..30] y[10..12]`, i.e. unrotated and
  unscaled.

Downstream: `packages/charts/src/components/axis.ts:1189` rotates the y-axis title by ±π/2 — in the
terminal it is drawn horizontally, overlapping the plot; `symbols.ts:116` rotates a diamond marker by
π/4 — it renders as an unrotated square.

**Severity:** medium as a *bug* (it is documented), high as a *parity* concern for charts.

**Test sketch.** A "transforms are honoured" suite that asserts a translated rect's raster bbox is
offset — currently expected to fail; if the intent is to keep it unimplemented, add an explicit
negative test plus a note in the README that charts using transforms are unsupported.

### F12 — Text on a path (`pathData` / `startOffset`) is silently ignored — MEDIUM/LOW

`packages/terminal/src/context.ts:452-468`

**Defect.** `_rasterizeText` reads only `content`, `maxWidth`, `x`, `y`. `ContextText.pathData` and
`startOffset` (`core/context/text.ts:24-27`) are dropped. Canvas dispatches to
`renderTextAlongPath` (`packages/canvas/src/utilities.ts:257-285`). Not in the documented limitation
list.

**Failure scenario (reproduced).** `createText({ x:0, y:20, content:'arc', pathData:'M 0 40 Q 40 0 80 40' })`
→ glyphs placed at `(0,4) (1,4) (2,4)`, i.e. a straight run at the anchor, ignoring the curve.

**Severity:** medium/low — degrades to straight text rather than vanishing.

**Test sketch.** Assert the emitted `setChar` rows are not all equal when `pathData` describes a
curve — or, if unimplementable, document it and keep the straight-line fallback deliberately.

---

## CONFIRMED — not implemented (undocumented silent drops)

### F13 — A fill always also paints the path outline in the fill colour — LOW

`packages/terminal/src/context.ts:477-482`

```ts
if (fill) { fillPolygon(this._buildContours(path), plot); }
// Always draw the outline
this._executeCommands(path, plot);
```

**Defect.** `applyFill` paints one extra pixel of outline beyond the even-odd interior, in the *fill*
colour, and paints something even for degenerate (zero-area) fills.

**Failure scenario (reproduced).** An **open** path `moveTo(0,0); lineTo(10,0)` with
`fill = '#ff0000'` and no stroke → 11 pixels plotted. Canvas fills the implicitly-closed zero-area
subpath, i.e. paints nothing.

**Severity:** low (adjacent filled shapes bleed into each other by one raster pixel; harmless at
braille resolution most of the time).

**Test sketch.** Fill an open two-point path and assert no pixels; or fill a rect and assert the
painted bbox does not exceed the geometric bbox.

### F14 — Stroke geometry state (lineWidth, lineDash, lineCap/Join, miterLimit) ignored, undocumented — LOW

`packages/terminal/src/context.ts:403-409`, `_executeCommands` `:529-541`

Reproduced: `lineWidth = 10` → 21 pixels (a 1-px line); `lineDash = [2,2]` → 21 pixels (solid).
Inherent to a 1-bit raster for `lineWidth`, but **dashes are implementable** (dashed grid lines and
zero-lines are common in `@ripl/charts`), and none of these appear in the documented limitation
list.

**Test sketch.** `ctx.lineDash = [2,2]` over a 20-px line and assert gaps exist in the plotted x set.

### F15 — Shadows, filters and composite operations ignored, undocumented — LOW

`packages/terminal/src/context.ts:392-409`

Reproduced: `shadowBlur:10, shadowOffsetX/Y:4, filter:'blur(4px)',
globalCompositeOperation:'destination-out'` all produced the same 70-pixel plain rect.
Unimplementable in a character grid (fine) but should be listed alongside the other documented
constraints — `globalCompositeOperation: 'destination-out'` in particular means canvas would *erase*
where the terminal *draws*.

### F16 — `reset()` is a no-op — LOW

Inherited from `core/context/context.ts:469-471`. Reproduced: after `ctx.reset()`, `export().toString()`
is byte-identical (`"⠿⠿⠇ "`). Canvas implements it (`packages/canvas/src/mixins.ts:354-356`). At
minimum it should clear the grid and reset `currentState`.

### F17 — `renderDepth` has no floor; a throw inside `Group.render` permanently freezes terminal output — LOW/MEDIUM

`packages/terminal/src/context.ts:370-377`; interacts with `core/core/group.ts:194-207`

**Defect.** `Context.markRenderEnd` decrements without a floor, and `TerminalContext` gates its only
flush on `renderDepth === 0`. `Group.render` is the one pipeline step with **no** `try/finally`
around its `markRenderStart`/`markRenderEnd` pair, so an exception in a child permanently unbalances
the depth — and on the terminal that means the display never updates again. On canvas the same
exception merely leaks a `save()`.

**Failure scenario (reproduced).** `group.render(ctx)` where one child's `render` throws →
`renderDepth === 1`, `saveDepth === 1` afterwards; a subsequent successful `element.render(ctx)`
produced **0 writes**. Symmetrically, a stray `ctx.markRenderEnd()` drives `renderDepth` to `-1`, after
which the flush fires mid-frame (per element) instead of per frame.

**Severity:** low/medium — needs an exception or misuse to trigger, but the failure mode (dead
display, no error) is bad.

**Test sketch.**
```ts
try { group.render(ctx); } catch {}
expect((ctx as any).renderDepth).toBe(0);
// then: a clean render still flushes
```

### F18 — `supportsPathCaching` is `false` although `TerminalPath` creation is side-effect free — LOW (perf)

`packages/terminal/src/context.ts:379-382` (inherits `false` from `core/context/context.ts:627-629`)

`createPath` is a plain `new TerminalPath(id)` with no per-frame registration (unlike SVG), so the
canvas rationale for `true` (`packages/canvas/src/context.ts:28-31`) applies. Every shape re-traces
its whole command list every frame. Not a correctness bug.

### F19 — Path approximations: `arcTo`, `roundRect`, `addPath`, and `arc`'s subpath start — LOW

- `packages/terminal/src/path.ts:60-66` — `arcTo` emits `lineTo(x1,y1); lineTo(x2,y2)`. Canvas
  `arcTo` never passes through the corner `(x1,y1)`; this is the `radius === 0` degenerate case.
  Documented as an approximation; visibly wrong for large radii.
- `packages/terminal/src/path.ts:149-154` — `roundRect` → plain `rect`. Documented.
- `packages/terminal/src/path.ts:156-161` — `addPath` silently drops a non-`TerminalPath`
  (mixed-backend composition yields a silently empty path).
- `packages/terminal/src/path.ts:45-53` — `arc`/`circle` update `_cursorX/_cursorY` but never
  `_startX/_startY`, so a `closePath()` after a bare `circle()` closes back to the *previous*
  subpath's start (or `(0,0)`) instead of the arc start.

### F20 — `destroy()` leaves the terminal in whatever SGR/cursor state the last frame left — LOW

`packages/terminal/src/context.ts` (no `destroy` override); `_flush` at `:447-450`

The resize disposer is released correctly (verified), but nothing writes a final `ANSI_RESET`, shows
the cursor, or clears the screen. Combined with **F1** this can leave the user's shell permanently
coloured after the process exits.

### F21 — `hitTestHonorsTransform = false` is semantically wrong for a transform-dropping backend — LOW (latent)

`packages/terminal/src/context.ts` (inherits `false` from `core/context/context.ts:100`)

`Shape2D.intersectsWith` (`core/core/shape.ts:104-117`) reads `false` as "I applied the transform at
draw time, so map the point into local space". The terminal applies no transform, so the correct
value for consistency is `true` ("the point is already in the space I drew in"). Currently latent —
`isPointInPath` always returns `false` — but it becomes a live bug the moment hit testing is
implemented.

**Test sketch.** Once hit testing exists: a `translateX: 30` rect must be hit at its *drawn*
(untranslated) position, not at the translated one.

### F22 — `Text` bounding boxes disagree with what the terminal actually draws — LOW

`packages/core/src/elements/text.ts:89-107` uses the **global** `measureText` (i.e.
`factory.measureText`, which for `@ripl/node` is `value.length * 8`, `packages/node/src/index.ts:54-69`),
whereas the terminal renders one glyph per braille cell and `TerminalContext.measureText`
(`context.ts:412-431`) reports `2 / rasterScale` per character. So `element.getBoundingBox()` for a
Text is ~4× too wide in the default (non-logical) mode. Charts are unaffected because they call
`context.measureText` (`charts/src/components/axis.ts:480`, `legend.ts:161`), but the renderer's
`boundingBoxes` debug overlay and any consumer of `Text.getBoundingBox()` will be wrong.

### F23 — `export().toURL()` never revokes its Blob URL — INFORMATIONAL

`packages/terminal/src/context.ts:98`. Identical to `packages/dom/src/export.ts:51`, so this is a
codebase-wide convention rather than a terminal defect. In headless environments it correctly falls
back to a `data:text/plain` URL (verified).

---

## Out of scope but found while tracing (core, affects every backend)

### F24 — A top-level `clip: true` shape leaks one `save()` per frame — MEDIUM (core)

`core/core/shape.ts:170` passes `skipRestore = this.clip`; the dangling `save()` is normally absorbed
by `Context.popGroup` (`core/context/context.ts:565-571`). But the **scene root** is not bracketed by
`push`/`pop` — `Scene._collectInstructions` (`core/core/scene.ts:209-234`) only emits them for child
groups — so a clip shape that is a direct child of the scene has no `popGroup` to absorb it.

**Reproduced.** Scene whose only child is `createRect({ clip: true })`; four consecutive
`scene.render()` calls → `saveDepth` = `[1, 2, 3, 4]` and `states.length === 4`. Unbounded growth of
the state stack (and, on canvas, of the native 2D state stack).

**Test sketch.** Render such a scene twice and assert `saveDepth === 0` after each frame.

---

# Ranked summary

| # | Finding | Severity | Kind |
|---|---|---|---|
| F1 | ANSI colour bleeds forever when a glyph resolves to no colour (`rasterizer.ts:201-208,233`) | **high** | implemented wrongly |
| F2 | Named colours / `#rgb` / gradients / patterns silently lose all colour (`color.ts:9-23`) | **high** | implemented wrongly |
| F3 | `transparent`/`none`/zero-alpha still painted at full strength; alpha discarded (`context.ts:392-400`, `color.ts:20`) | **high** | implemented wrongly |
| F4 | `opacity` maintained by the pipeline and ignored by the backend (breaks chart crosshairs & fades) | **high** | not implemented, undocumented |
| F5 | Text with a `stroke` renders nothing (`context.ts:402-409`) | **high** | implemented wrongly |
| F6 | `ellipse` sweep/rotation args dropped → full unrotated ellipse (`context.ts:214-222`) | medium | implemented wrongly |
| F7 | Resize repaint runs with a half-updated scale mapping (`context.ts:352-361`) | medium | implemented wrongly |
| F8 | Explicit `width`/`height` clobbered on resize (`context.ts:324-333`) | medium | implemented wrongly |
| F9 | `toImageData()` drops all text glyphs (`rasterizer.ts:280-300`) | medium | not implemented |
| F10 | Shrinking the grid leaves stale rows (`context.ts:365-368`) | medium/low | not implemented |
| F11 | Transforms dropped entirely (charts: rotated axis titles, rotated symbols) | medium | not implemented, **documented** |
| F12 | Text-on-a-path ignored (`context.ts:452-468`) | medium/low | not implemented, undocumented |
| F24 | (core) top-level `clip` shape leaks a `save()` per frame | medium | core defect |
| F13 | Fill also paints the outline in the fill colour (`context.ts:481-482`) | low | implemented loosely |
| F14 | lineWidth / lineDash / caps / joins ignored, undocumented | low | not implemented |
| F15 | Shadows / filters / composite ops ignored, undocumented | low | not implemented |
| F16 | `reset()` is a no-op | low | not implemented |
| F17 | No floor on `renderDepth`; a throw in `Group.render` freezes the display | low/medium | robustness |
| F18 | `supportsPathCaching` needlessly `false` | low | perf |
| F19 | `arcTo` / `roundRect` / `addPath` / `arc` subpath-start approximations | low | approximation |
| F20 | `destroy()` leaves the terminal SGR/cursor dirty | low | not implemented |
| F21 | `hitTestHonorsTransform = false` inconsistent for a transform-dropping backend | low | latent |
| F22 | `Text` bounding boxes use factory metrics, not cell metrics | low | inconsistency |
| F23 | Blob URL never revoked (matches `@ripl/dom`) | info | convention |

**Verified clean:** save/restore symmetry and state-stack integrity; `pushGroup`/`popGroup` balance
(including the clip-absorb path inside a group); the group paint cascade; `markRenderStart`/
`markRenderEnd` depth accounting under `Scene.render`/`Renderer` (exactly two writes per frame);
even-odd scanline fills including annular sectors (donuts render as correct rings); uniform logical
→ raster letterboxing; `textAlign`/`textBaseline` anchor shifting; `export()`'s eager-snapshot
semantics; `destroy()`'s disposal of the resize listener; zero-size grids (no crash).
