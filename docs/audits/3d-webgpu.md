# Audit — `@ripl/3d` and `@ripl/webgpu` rendering contexts

Read-only investigation. No file in `/home/user/ripl` was modified. All findings below were
traced through the source; those marked **CONFIRMED** were additionally reproduced with throwaway
probes run against the real packages (vitest + jsdom + `@ripl/test-utils` canvas stub, and the
`packages/webgpu/test/mock-gpu.ts` harness). Probe files lived in the scratchpad and have been
deleted; each finding carries a sketch of the test that pins it.

Base contract read first: `packages/core/src/context/context.ts` (`Context`),
`packages/dom/src/context.ts` (`DOMContext`), `packages/canvas/src/mixins.ts`
(`canvas2DStateMixin`), `packages/canvas/src/context.ts` (`CanvasContext`, the 2D reference
implementation), and the driving pipeline in `packages/core/src/core/{element,group,scene,renderer,shape}.ts`.

---

## 0. How the two contexts actually work (needed to read the findings)

`CanvasContext3D` = `canvas2DStateMixin(Context3D)`, i.e. a *deferred* renderer bolted onto an
*immediate* one:

* `Element.render` (element.ts:877) → `markRenderStart` → `save` → `applyElementTransform` →
  apply `CONTEXT_OPERATIONS` → callback → `restore` → `markRenderEnd`.
* `Shape3D.render` (shape.ts:253) runs inside that callback but **draws nothing**. It projects
  each face and pushes a `ProjectedFace3D` record (screen points + fill string + stroke string +
  lineWidth + depth) onto `context.faceBuffer`.
* Only when `renderDepth` returns to 0 — i.e. inside `Context.batch`'s `finally`, *after* every
  element `restore()` and every `popGroup()` has already unwound — does
  `CanvasContext3D.markRenderEnd` (context.ts:279) sort the buffer back-to-front and paint it.

Everything in §1 flows from that single structural fact: **the drawing state and transform in
effect when a 3D face is painted are the ones at `batch()`'s save point, not the ones the element
was rendered with.**

`WebGPUContext3D` extends `Context3D` directly (no canvas mixin). `Shape3D.submitMesh`s an
interleaved mesh; `markRenderEnd` at depth 0 writes uniforms, flushes pooled buffers and encodes
one render pass. Hardware depth testing replaces the painter's sort.

---

## 1. `@ripl/3d` — CONFIRMED findings

### 3D-1 (HIGH) A `Shape3D` whose `fill` is not hex/rgb/hsl crashes the whole render pass

`packages/3d/src/core/shape.ts:258` + `:265` + `:392`

```ts
const baseRGBA = parseColor(baseFillStyle) as ColorRGBA;   // :258  cast hides `undefined`
ctx.submitMesh({ vertices: triangulateFacesFlat(faces, baseRGBA), ... });  // :265  UNGUARDED
...
const cr = color[0] / 255;                                  // :392  throws
```

`parseColor` (packages/core/src/color/index.ts:82) only matches hex / rgb / rgba / hsl / hsla /
hsv / hsva. **Named CSS colours are not supported** — `parseColor('red')` returns `undefined`.
`_renderCPU` guards this at :289 (`baseRGBA ? … : baseFillStyle`), but the `submitMesh` call at
:265 runs *first* and is unguarded, so the guard is dead code.

Failure scenario: `new Cube({ size: 1, fill: 'red' })` in a scene →
`TypeError: Cannot read properties of undefined (reading '0')` thrown out of `Scene.render`. Same
for `'steelblue'`, `'currentColor'`, `'transparent'`, any `linear-gradient(...)`, any
`pattern(...)`, any CSS variable. Affects the GPU path identically (the call is on the shared path).

Amplifier: `Renderer._tick` (renderer.ts:281-287) re-arms `requestAnimationFrame` *after* the
`batch` call, so the exception escapes before the loop is rescheduled while `_running` stays
`true` — `start()` then no-ops. **One bad fill colour permanently kills the animation loop.**
(Verified: after the throw `renderDepth` and `saveDepth` are correctly unwound by `batch`'s
`finally`, so the damage is purely the dead loop.)

Test: `expect(() => { scene.add(new Cube({ size: 1, fill: 'red' })); scene.render(); }).not.toThrow()`
and assert `context.faceBuffer[0].fillColor === 'red'` (the documented degrade path).

---

### 3D-2 (HIGH) The deferred face draw discards every piece of context state, including all 2D transforms

`packages/3d/src/core/context.ts:279-304` (`markRenderEnd`) and `:306-343` (`_drawFace`)

`_drawFace` writes directly to the raw `CanvasRenderingContext2D` using only
`face.fillColor` / `face.strokeStyle` / `face.lineWidth`. Everything else the element and its
ancestor groups pushed onto the context has been restored away by the time it runs.

Reproduced op sequence for `group{translateX:100,translateY:50} > Cube{translateX:7}` (real
save/restore semantics installed on the stub):

```
save                      // batch()
save  translate(100,50)   // pushGroup(group)
save  translate(7,0)      // Cube render
restore                   // Cube render end
restore                   // popGroup
save                      // markRenderEnd -> layer()
moveTo(223.6,173.6) FILL  x6   <-- faces painted here, all transforms gone
restore
restore
```

Concretely dropped for every 3D face:

| state | evidence |
|---|---|
| element `opacity` and group `opacity` | `globalAlpha` measured as `1` at all six fills for `group{opacity:0.25} > Cube{opacity:0.5}` |
| `globalCompositeOperation` | measured `'source-over'` for `Cube{globalCompositeOperation:'multiply'}` |
| `filter`, `shadow*`, `lineDash*`, `lineJoin`, `lineCap`, `miterLimit` | never carried in `ProjectedFace3D` |
| element `translateX/Y`, `rotation`, `transformScaleX/Y`, `transformOrigin*` | applied then unwound before the draw |
| every ancestor group transform | same |
| any group-scoped clip | `popGroup` unwinds it before `markRenderEnd` (see 3D-13) |

Failure scenario: `scene > group{opacity: 0.2} > Cube` renders the cube fully opaque. Putting a
3D chart inside a `group{translateX: 40}` axis-inset group leaves the 3D content unmoved while the
2D axes shift — and `cube.getBoundingBox()` *does* include the translate, so the model's idea of
where the shape is diverges from what is painted and from what `hitPath` covers.

This is the root cause behind 3D-3, 3D-8 and 3D-9 as well.

Test: install a save/restore-honouring canvas stub, render
`group{opacity:0.25} > Cube{opacity:0.5}`, and assert `globalAlpha === 0.125` at each `fill()`;
separately assert that a group `translateX: 100` shifts the recorded `moveTo` x by 100.

---

### 3D-3 (HIGH) Faces that declare a `normal` are shaded with the **local**, untransformed normal

`packages/3d/src/core/shape.ts:287`

```ts
const transformed = this.transformVertices(face.vertices, matrix);  // world space
const normal = face.normal ?? computeFaceNormal(transformed);       // LOCAL when declared
```

The `??` branch is world-space and correct; the declared branch is model-space and is never
multiplied by the model matrix. Every element that hard-codes normals is affected:
`Cube` (all 6 faces, elements/cube.ts:53-78), `Plane` (elements/plane.ts:56),
`Cylinder` caps (elements/cylinder.ts:101,110), `Cone` base (elements/cone.ts:86).

Failure scenario: `cube.rotationY = 0.6435; cube.rotationX = 0.3` — the six projected polygons
move correctly but the six fill colours are **byte-identical** to the unrotated cube
(`["rgba(77,0,0,1)","rgba(180,0,0,1)", …]` before and after). A rotating cube looks like a moving
flat sticker. A `Sphere` (no declared normals) re-shades correctly under the same rotation,
confirming the mechanism.

Note the GPU path is *right*: the WGSL vertex shader does
`normalize((model.normalMatrix * vec4f(input.normal, 0.0)).xyz)` (shaders.ts:35), and
`triangulateFacesFlat` correctly emits the local normal for the shader to transform
(shape.ts:401). So **CPU and GPU rendering of the same scene disagree** — CPU shading is the
broken one.

Test: render a `Cube` at `rotationY = 0`, snapshot `faceBuffer.map(f => f.fillColor)`, set
`rotationY = Math.PI / 4`, re-render, and assert the colour multiset changed.

---

### 3D-4 (HIGH) Geometry properties do not animate — transitions bypass the face cache

`packages/3d/src/core/shape.ts:184` + `:187-190`, against `packages/core/src/core/element.ts:864-874`

`Shape3D` caches `computeFaces()` and only invalidates it from its `setStateValue` override:

```ts
protected override setStateValue<TKey extends keyof TState>(key, value) {
    super.setStateValue(key, value);
    this._getCachedFaces.invalidate();      // :189
}
```

But `Element.interpolate`'s per-frame tick writes straight to the state bag:

```ts
objectForEach(mappedIntpls, (key, value) => {
    this.state[key] = value(time) as TState[keyof TState];   // element.ts:871 — no setter
});
```

so the cache is never invalidated during a transition.

Failure scenario: `renderer.transition(cube, { duration: 500, state: { size: 3 } })` finishes with
`cube.size === 3` while the rendered geometry is still the size-1 mesh. Measured screen span:
57.735 px before, **57.735 px after** the interpolation to `size: 3` (the direct setter
`cube.size = 3` correctly yields 222.692 px). Affects `Cube.size`, `Sphere.radius/segments/rings`,
`Cylinder.radiusTop/radiusBottom/height/segments`, `Cone.radius/height/segments`,
`Plane.width/height`, `Torus.radius/tube/radialSegments/tubularSegments`.

Confusingly *partial*: `x/y/z/rotationX/Y/Z` still animate, because `getModelMatrix()` (shape.ts:196)
reads the live accessors rather than the cache. So a transition on `{ x, size }` moves but does
not grow. It also poisons `_getLocalBoundingBox` (shape.ts:225) for the same reason.

Test: `const tick = cube.interpolate({ size: 3 }); tick(1); scene.render();` then assert the
projected x-span grew.

---

### 3D-5 (MEDIUM) `lightMode: 'world'` and `'camera'` are swapped

`packages/3d/src/core/context.ts:192-198`

```ts
public getLightDirectionForRender(): Vector3 {
    if (this.lightMode === 'world') {
        return mat4TransformDirection(this.viewMatrix, this.lightDirection);  // -> VIEW space
    }
    return this.lightDirection;                                               // stays WORLD space
}
```

Both consumers dot this against a **world-space** normal — CPU: `computeFaceBrightness(normal,
normalizedLight, true)` where `normal` came from world-space vertices (shape.ts:287-288); GPU:
`dot(worldNormal, normalize(-uniforms.lightDirection))` (shaders.ts:57-59). Transforming the light
into view space and dotting it with a world normal makes the result camera-dependent, which is the
exact opposite of "fixed in world space".

Measured with `lightDirection: [0, 0, -1]`:

| camera | `world` mode | `camera` mode |
|---|---|---|
| `[0,0,5]` | `[0, 0, -1]` | `[0, 0, -1]` |
| `[5,0,0]` | `[1, 0, 0]` ← rotated with the camera | `[0, 0, -1]` ← fixed |

Failure scenario: with the documented default `lightMode: 'world'`, orbiting the camera around a
static cube re-lights every face as though the lamp were bolted to the camera; selecting
`'camera'` freezes the lighting in world space. The two branches are simply exchanged (or,
equivalently, the normals should be transformed to view space too).

Test: `context.lightMode = 'world'`; render, snapshot face colours, `setCamera` to an orbited
position, re-render, assert colours unchanged. Then the inverse for `'camera'`.

---

### 3D-6 (MEDIUM) `Shape3D`'s bounding box is camera-dependent but cached against element state

`packages/3d/src/core/shape.ts:218-251` against `packages/core/src/core/element.ts:776` / `:801`

`Shape3D._getLocalBoundingBox()` is not a local box at all — it projects every transformed vertex
through `context.project(...)` and returns a **screen-space** box. `Element.getBoundingBox` caches
that against `this._stateVersion` (and, for the world box, against the world matrix identity).
Neither key includes the camera or the context, and `Shape3D` invalidates only its face cache
(:189), never the box caches.

Failure scenario (reproduced): render a `Cube` with the camera at `[0,0,5]` →
`getBoundingBox()` = 57.74 × 57.74 at (171.13, 121.13). Move the camera to `[0,0,40]`, re-render →
`getBoundingBox()` **still returns 57.74 × 57.74 at (171.13, 121.13)**. Touching any state
property (`cube.fill = '#00ff00'`) makes the next read jump to the correct 6.58 × 6.58.

This is the "paint cached in a way that confuses the two" hazard the audit brief asked about. It
poisons three consumers: `CanvasContext3D.gradientBounds()` (context.ts:248), so a 3D shape's
gradient bounds freeze at the first camera; `Renderer._renderBoundingBoxes` (renderer.ts:300), which
outlines stale rectangles; and `Element.intersectsWith`'s fallback box test (element.ts:832) when
`hitPath` is absent. It would also mis-answer for one element rendered into two contexts.

Test: render, read `getBoundingBox()`, `context.setCamera` further away, render again, assert the
box shrank.

---

### 3D-7 (MEDIUM) The `gradientBounds()` override double-applies the transform for 2D elements, and is dead for 3D shapes

`packages/3d/src/core/context.ts:247-250`

```ts
// 3D faces project into screen space, so gradients resolve against the world box, not the local box.
protected gradientBounds(): Box | undefined {
    return this.currentRenderElement?.getBoundingBox?.();      // world box
}
```
vs. the 2D backend's `packages/canvas/src/mixins.ts:332-334`, which uses `getBoundingBox(true)`
(local box).

The override is **incoherent on both sides**:

*For 3D shapes it is dead.* `Shape3D._getLocalBoundingBox()` already returns projected screen
coordinates, so `getBoundingBox(true)` and `getBoundingBox(false)` differ only by the (ignored, see
3D-2) 2D transform. And `_drawFace` (context.ts:324-328) assigns `ctx.fillStyle = face.fillColor`
per face, so the `CanvasGradient` the mixin's `fill` setter built is overwritten before any face is
drawn. Nothing in the 3D path consumes it. (And as of 3D-1 a gradient fill on a `Shape3D` throws
before reaching it at all.)

*For plain 2D elements hosted in a 3D scene it is actively wrong.* Canvas gradients are resolved in
user space at paint time, so the CTM already carries the element's and its groups' transforms;
feeding it the world box applies them a second time. Reproduced with an identical graph —
`group{translateX:100,translateY:50} > circle{cx:20,cy:20,r:10, fill:'linear-gradient(...)'}`:

```
CanvasContext3D : translate(100,50) -> createLinearGradient(120,80,120,60) -> FILL
CanvasContext   : translate(100,50) -> createLinearGradient( 20,30, 20,10) -> FILL
```

The 2D backend paints the gradient exactly over the circle at (120,70). The 3D backend paints it at
(220,120) — a 100 × 50 px offset, i.e. the transform counted twice. With a rotated or scaled group
the gradient also skews.

Test: as above — assert `createLinearGradient` receives the same arguments for the same graph on
both contexts.

---

### 3D-8 (MEDIUM) `_drawFace`'s style cache records a `lineWidth` it never applied

`packages/3d/src/core/context.ts:294-341`

```ts
this._drawFace(face, lastFill, lastStroke, lastLineWidth);
lastFill      = face.fillColor;
lastStroke    = face.strokeStyle ?? '';
lastLineWidth = face.lineWidth ?? -1;      // :301 — recorded unconditionally
```
```ts
ctx.fill();
if (!face.strokeStyle) { return; }                                        // :330 — early exit
if (face.lineWidth !== undefined && face.lineWidth !== lastLineWidth) {   // :338
    ctx.lineWidth = face.lineWidth;
}
```

A face with a `lineWidth` but no `strokeStyle` returns at :330 without touching `ctx.lineWidth`,
yet the loop still records that width as "last applied". The next stroked face with the same width
sees a cache hit and never assigns it.

Failure scenario (reproduced): `Cube{z:-2, lineWidth:8}` (no stroke) and
`Cube{z:2, lineWidth:8, stroke:'#000'}`. Back-to-front sorting draws the un-stroked cube first; all
six strokes on the near cube then execute at **`lineWidth = 1`** (the value restored by
`markRenderEnd`'s `layer()`), not 8. Measured: `[1,1,1,1,1,1]`.

`strokeStyle` avoids the same trap only by luck (`lastStroke` is reset to `''` on the early exit).

Test: the two-cube setup above with a `lineWidth` accessor spy; assert every `stroke()` sees 8.

---

### 3D-9 (MEDIUM) 2D elements always paint *beneath* 3D geometry, regardless of scene order

`packages/3d/src/core/context.ts:279`

2D shapes draw immediately during their `render`; 3D faces are flushed once at depth 0, after every
element has drawn. Reproduced: `scene.add(cube); scene.add(circle)` (circle later in paint order)
gives `["2D-path", "3D-face" × 6]` — the circle is painted first and then covered.

Failure scenario: a `Text` label or legend added after a 3D chart is hidden behind the geometry
with no way to bring it forward (`Shape3D.zIndex` is derived from depth and its setter only warns,
shape.ts:165-171).

Same class, debug-only: `Renderer._renderBoundingBoxes` and `_renderDebugOverlay` run inside the
`batch` body, so `markRenderEnd`'s face flush paints over them. Measured order:
`["stroke(bbox)", "fill(fps-bg)", "fillText(fps)", "fill(3d-face)" × 6]`.

Test: `scene.add(cube); scene.add(circle);` assert the circle's `fill(path)` is recorded after the
last bare `fill()`.

---

### 3D-10 (MEDIUM) A resize silently reverts an orthographic projection to perspective

`packages/3d/src/core/context.ts:149-159` and `:265` (mirrored at `packages/webgpu/src/context.ts:144`)

`updateProjectionMatrix()` unconditionally builds `mat4Perspective`, and `rescale` calls it on every
size change. `setOrthographic` (context.ts:178-189) writes the matrix directly and records no mode,
and `Camera` only flushes when its own state is dirtied — a resize does not dirty it.

Failure scenario (reproduced): `context.setOrthographic(-4,4,-3,3,0.1,100)` → `m[11]=0, m[15]=1`.
Resize the container → `m[11]=-1, m[15]=0`, i.e. a perspective matrix; the chart silently gains
perspective distortion on the first window resize. `camera.projection` still reports
`'orthographic'`.

Test: `createCamera(context, { projection: 'orthographic' }); rescale(800,600);` and assert
`projectionMatrix[15] === 1`.

---

### 3D-11 (MEDIUM) Picking order (per-shape mean depth) disagrees with paint order (per-face depth)

`packages/3d/src/core/shape.ts:307-309` and `:165-167`, against `packages/core/src/context/context.ts:676-696`

The CPU renderer sorts **faces** globally by their own depth, but `Shape3D._depth` is the *mean*
of that shape's face depths and `zIndex` is `-_depth`, which is what `Context.hitTest` sorts by.
For a shape that spans depth, its nearest face can be in front of another shape while its mean is
behind.

Measured with a rotated 4-unit `Cube` (`rotationX: 1.2`) and a small cube in front of its near
edge: slab `zIndex = -0.96243`, chip `zIndex = -0.95465` (chip wins the hit test), while the
globally nearest face has depth `0.95031` and belongs to the **slab**. Wherever that face covers
the chip, the pixel shows the slab but a click reports the chip.

Note the GPU path uses `_depth = context.project([x,y,z])[2]` (shape.ts:323) — the shape origin —
which is a different metric again, so picking is not consistent between the two strategies either.

Test: build the overlap above, assert `hitTest` at a pixel where the slab is painted on top
returns the slab.

---

### 3D-12 (MEDIUM) `Camera` hijacks touch even when every interaction is disabled

`packages/3d/src/core/camera.ts:392-489`

The mouse/wheel blocks are guarded (`if (zoomConfig.enabled)`, `if (pivotConfig.enabled ||
panConfig.enabled)`), but the touch block at :392-489 is unconditional, as is
`element.style.touchAction = 'none'` at :330. Every handler calls `event.preventDefault()` before
consulting the per-interaction flags.

Failure scenario (reproduced): `createCamera(context, { interactions: { zoom: false, pivot: false,
pan: false } })` attaches `touchstart`, `touchmove`, `touchend` and sets `touch-action: none`.
On a phone the user cannot scroll the page past the chart, and no camera motion happens either.

Test: attach with all three disabled and assert no touch listeners were added and
`element.style.touchAction === ''`.

---

### 3D-13 (LOW) Clip scoping for 3D faces is inconsistent between group and root clips

`packages/3d/src/core/context.ts:279` with `packages/core/src/context/context.ts:565-571`

A `Shape2D { clip: true }` renders with `skipRestore`, deliberately leaving a dangling `save()`.
`popGroup` (context.ts:565) unwinds to the recorded depth, so a **group-scoped** clip is gone
before `markRenderEnd` flushes the faces. A **root-level** clip is only unwound by `batch`'s final
`restore()`, which runs *after* `markRenderEnd` — so it *does* mask the 3D geometry. Identical
markup therefore clips or doesn't depending on whether the clip shape sits in a group.

Related (shared with the 2D backend, not 3D-specific): a root-level clip shape leaks one native
save per frame. Reproduced on a plain `CanvasContext`: `saveDepth` after four `scene.render()`
calls is `[1, 2, 3, 4]` — unbounded growth of the canvas state stack. Worth fixing in
`Context.batch`/`Scene.render` rather than here.

Test: render `group > clipCircle + cube` and `clipCircle + cube` at root, assert the same clip
call count is in effect at face-draw time.

---

### 3D-14 (LOW) The CPU path builds and throws away a full GPU mesh every frame

`packages/3d/src/core/shape.ts:263-269`

```ts
// This is noop for CPU render strategies. Safe to call on all paths.
ctx.submitMesh({ vertices: triangulateFacesFlat(faces, baseRGBA), indices: triangulateFacesIndices(faces), … });
```

Safe, but not free. Measured on `CanvasContext3D` (`renderStrategy === 'cpu'`, `submitMesh` is a
no-op): one 16 × 12 `Sphere` allocates **7 360 floats (29 KB) + 1 056 indices (4 KB) per frame**,
immediately garbage. At 60 fps with 20 spheres that is ~40 MB/s of pure churn, plus the O(vertices)
copy loop. Gate it on `ctx.renderStrategy === 'gpu'`.

Test: `vi.spyOn(context, 'submitMesh')`; assert 0 calls when `renderStrategy === 'cpu'`.

---

### 3D-15 (LOW) `CanvasContext3D` loses path caching for the 2D elements it hosts

`packages/3d/src/core/context.ts:228`

`CanvasContext.supportsPathCaching` is overridden to `true` (canvas/src/context.ts:29-31) because
`createPath` is a side-effect-free `new CanvasPath()`. `CanvasContext3D` composes the same mixin
but never overrides it, so it inherits the base `false` (context.ts:627). Measured: `false` on
`CanvasContext3D`, `true` on `CanvasContext`. Every `Shape2D` in a 3D scene re-traces its path every
frame even when unchanged (`Shape2D.render`, core/shape.ts:143-147).

Test: `expect(createContext3D(target).supportsPathCaching).toBe(true)`.

---

### 3D-16 (LOW) No back-face culling on the CPU path

`packages/3d/src/core/shape.ts:285-304`

Every face is transformed, shaded, projected, buffered, sorted and filled. Measured: 192 faces
buffered for a single 16 × 12 sphere, roughly half of which face away and are overdrawn. Doubles
fill cost and sort cost, and with any `fill` alpha < 1 the hidden back faces visibly bleed through
(the painter's algorithm blends each of them separately). A `dot(normal, viewDir) <= 0` reject
before the `faceBuffer.push` would halve the work. (Marked "by design gap", not "implemented
wrongly": the GPU pipeline deliberately sets `cullMode: 'none'`, pipeline.ts:141.)

---

### 3D-17 (LOW) Degenerate camera/lookAt inputs produce silent NaN or a collapsed view

* `packages/3d/src/core/camera.ts:254-272` — `orbit` divides by `dist`; with `position === target`
  the result is `[NaN, NaN, NaN]` and the view matrix becomes all-NaN (reproduced), permanently
  blanking the scene with no error.
* `packages/3d/src/math/matrix.ts:117-121` — `mat4LookAt` with `up` parallel to the view direction
  yields `xAxis = [0,0,0]` (via `vec3Normalize`'s zero-length early return, vector.ts:47) and a
  rank-deficient view matrix. Reproduced: `setCamera([0,5,0],[0,0,0],[0,1,0])` makes *every* point
  project to the viewport centre `(200, 150)`. `Camera.orbit` clamps `phi` to avoid this, but
  `setCamera` / `camera.position = …` do not.
* `packages/3d/src/core/camera.ts:299-307` — `zoom` clamps to `dist - 0.01`, letting the eye reach
  0.01 units from the target while `near` defaults to 0.1, so a full zoom-in empties the frustum
  (and on WebGPU also trips 3D-18/WGPU-1).

---

### 3D-18 (LOW, by design but undefended) No near-plane clipping in the CPU projection

`packages/3d/src/math/matrix.ts:200-212`

`mat4TransformPoint` performs the perspective divide with no `w` sign test and forces `invW = 1`
when `w === 0`. Reproduced with the default 60°/0.1/1000 frustum:

| world point | projected |
|---|---|
| in front `(1, 0, -5)` | `x = 0.2598` |
| behind `(1, 0, +5)` | `x = -0.2598` ← mirrored through the origin |
| at the eye plane `(1, 0, 0)` | `x = 1.2990`, no divide |

So geometry that straddles the camera renders inside-out on the CPU path. The GPU path clips
correctly, so this is another CPU/GPU divergence. Reasonable to document as a limitation of the
painter's renderer, but `mat4TransformPoint` silently swallowing `w <= 0` makes it invisible.

---

### 3D-19 (LOW) Depth bookkeeping is undefended

* `packages/core/src/context/context.ts:497-499` — `markRenderEnd` decrements without a floor.
  Reproduced: a stray `markRenderEnd()` drives `renderDepth` to `-1`; the following
  `markRenderStart()` reaches `0`, so `CanvasContext3D`'s `renderDepth === 1` guard
  (context.ts:273) never fires and the face buffer is not cleared for that frame. All in-tree call
  sites are `try/finally`-balanced, so this is **SUSPECTED-unreachable** through the public
  pipeline — a robustness gap, not a live bug.
* `packages/3d/src/core/context.ts:100` — the base `Context3D` owns `faceBuffer` but only
  `CanvasContext3D` ever clears it. Reproduced: a `Context3D` running the default
  `renderStrategy: 'cpu'` accumulates faces across frames without bound and paints none.
* `packages/3d/src/core/context.ts:121-127` and `packages/webgpu/src/context.ts:75-81` — the meta
  spread puts `...options?.meta` **after** the hard-coded strategy, so
  `new WebGPUContext3D(…, { meta: { renderStrategy: 'cpu' } })` downgrades a GPU context into CPU
  mode: blank canvas plus the unbounded `faceBuffer` above. Put the invariant last.

---

### 3D-20 (item 10) Driving a 3D element from a plain 2D context is a hard crash

`packages/3d/src/core/shape.ts:264`

Reproduced: a `Cube` in a `CanvasContext` scene throws
`TypeError: ctx.submitMesh is not a function` — the very first thing `Shape3D.render` does is cast
`context as Context3D` (:255) and call `submitMesh`, which exists only on `Context3D`. It would
subsequently also need `renderStrategy`, `faceBuffer`, `getLightDirectionForRender` and `project`.
Not graceful. A `typeIsContext3D` guard falling back to `super.render` (or a clear
`"Shape3D requires a Context3D"` error) would be.

The reverse direction is graceful on `CanvasContext3D` (2D elements draw normally, modulo 3D-9 and
3D-15) and **silent** on `WebGPUContext3D` — see WGPU-3.

---

## 2. `@ripl/webgpu` — findings

### WGPU-1 (MEDIUM) The projection uses the OpenGL `[-1, 1]` depth convention; WebGPU NDC z is `[0, 1]`

`packages/3d/src/math/matrix.ts:148-162` (`mat4Perspective`) and `:165-188` (`mat4Orthographic`),
consumed by `packages/webgpu/src/context.ts:266` and `packages/webgpu/src/pipeline.ts:144-148`.

`out[10] = (near + far) / (near - far)`, `out[14] = 2·near·far / (near - far)` is the GL mapping:
near → `-1`, far → `+1`. WebGPU clips to `0 ≤ z ≤ w`. Measured for `fov 60°, near 0.1, far 1000`:

| view-space distance | `z_ndc` |
|---|---|
| 0.1 (near plane) | **-1.0000** |
| 0.15 | **-0.3333** |
| 0.2 | 0.0001 |
| 1 | 0.8002 |
| 5 | 0.9602 |
| 1000 (far plane) | 1.0000 |

Two consequences on the GPU path only (the CPU painter uses `z` purely as a monotonic sort key, so
it is unaffected):

1. **Everything between `near` and ≈`2·near·far/(near+far)` (≈0.2 units here) is clipped away.**
   Concrete: `camera.zoom` until the target is 0.15 units from the eye — the mesh vanishes on
   `WebGPUContext3D` while it still renders on `CanvasContext3D`. `Camera.zoom` allows the eye to
   reach 0.01 units, so this is easy to hit.
2. Only the `[0, 1]` half of the depth buffer is usable, and the scene is compressed into its top
   end (`[0.80, 1.00]` for the 1–5 unit range) — roughly a 2× loss of depth resolution on top of the
   usual `1/z` non-linearity, which makes z-fighting between coplanar faces more likely than it
   should be.

Fix shape: a WebGPU/D3D-style matrix (`out[10] = far / (near - far)`, `out[14] = far·near /
(near - far)`, and `out[10] = 1/(near-far)`, `out[14] = near/(near-far)` for ortho), which also
keeps `depthClearValue: 1.0` + `depthCompare: 'less'` correct.

Test: `expect(mat4TransformPoint(mat4Perspective(fov, aspect, 0.1, 1000), [0,0,-0.1])[2]).toBe(0)`
and `…[0,0,-1000])[2]).toBe(1)`.

---

### WGPU-2 (MEDIUM) `rescale` reads `window.devicePixelRatio` instead of `factory.devicePixelRatio`

`packages/webgpu/src/context.ts:119`

```ts
const dpr = window.devicePixelRatio;
```

Every other backend goes through the injectable factory —
`packages/canvas/src/utilities.ts:237` (`rescaleCanvas`) and
`packages/core/src/context/context.ts:412` (`scaleDPR`). Because `scaleX`/`scaleY`/`scaleDPR` are
derived from the factory value while the canvas backing store and the hit canvas transform
(context.ts:127-133) are derived from `window`, any consumer that overrides
`factory.devicePixelRatio` (tests, offscreen/server rendering, a DPR cap) desynchronises the two:
pointer coordinates are scaled by one ratio and the hit paths by another, so picking silently
misses by that factor. `window` may also be absent in a non-DOM environment, yielding
`element.width = NaN`.

Test: `factory.set({ devicePixelRatio: 2 })` with `window.devicePixelRatio === 1`; assert
`context.element.width === logicalWidth * 2`.

---

### WGPU-3 (MEDIUM, item 10) 2D elements silently render nothing but remain in the hit-test set

`packages/webgpu/src/context.ts:50` (no `applyFill` / `applyStroke` / `applyClip` / `drawImage` /
`createText` override)

`WebGPUContext3D` extends `Context3D` directly, so those five stay as the base no-ops
(context.ts:641-659). `createPath` (webgpu/context.ts:215) *does* return a real `CanvasPath`, so
`Shape2D.render` happily traces its path and then paints nothing.

Reproduced: a `Circle` and a `Text` added to a WebGPU scene produce **zero** encoded draws and
throw nothing. Because the path is still populated, `Shape2D.intersectsWith` (core/shape.ts:96)
still runs against it — the elements are invisible but clickable.

Failure scenario: a chart author mixes a 3D series with 2D axis labels; on canvas it works, on
WebGPU the labels disappear with no diagnostic while their tooltips still fire.

Either implement the 2D ops against the existing `_hitContext` compositing pass, or make the
no-ops loud (`console.warn` once, or throw on first use).

---

### WGPU-4 (MEDIUM) Inherits 3D-10 (orthographic → perspective on resize) and 3D-19 (meta override)

`packages/webgpu/src/context.ts:144` and `:75-81`. Same mechanism, same failure; see above. The
meta case is worse here because the class's whole contract depends on `renderStrategy === 'gpu'`:
a caller-supplied `meta` silently routes rendering into `Shape3D._renderCPU`, filling a
`faceBuffer` that `WebGPUContext3D` never clears and never draws → blank canvas plus an unbounded
array.

---

### WGPU-5 (LOW) `GeometryManager.flush()` has no destroyed guard

`packages/webgpu/src/geometry.ts:73-132` / `:135-149`

`destroy()` nulls the buffers and empties the pools; `flush()` then happily recreates GPU buffers
on the device. Reproduced: `destroy()` → `beginFrame()` → `submit()` → `flush()` creates three new
buffers with **no error** (on a real, destroyed device those calls raise validation errors).

Unreachable through `WebGPUContext3D` (`submitMesh` :182, `markRenderStart` :193 and
`_executeRenderPass` :253 are all `_destroyed`-guarded — verified: rendering a scene after
`context.destroy()` is a silent no-op that allocates nothing). But `GeometryManager` is a public
export (`packages/webgpu/src/index.ts:2`), so a direct consumer can hit it. A `_destroyed` flag
returning `null` from `flush` would close it.

---

### WGPU-6 (LOW) Per-frame texture-view churn and destroy-path loose ends

`packages/webgpu/src/context.ts:280`, `:310`, `:339-346`

* `this._depthTexture.createView()` and `this._msaaTexture.createView()` are called on **every
  frame**. Views are immutable and cheap to cache alongside the textures in
  `_recreateDepthTexture` / `_recreateMSAATexture`; allocating two per frame is avoidable garbage.
* `destroy()` does not `this._gpuContext.unconfigure()`, leaving the swap chain configured on a
  detached canvas (**SUSPECTED** minor GPU retention until GC — I could not verify browser behaviour
  from here).
* `destroy()` leaves `_depthTexture` / `_msaaTexture` non-null after destroying them, and
  `rescale` (:118) has no `_destroyed` guard — a resize delivered post-destroy would allocate
  textures that are never released. Not reachable in-tree (the `ResizeObserver` disposer runs during
  `super.destroy()`), so **SUSPECTED-unreachable**, but the guard is one line.
* `GeometryManager.destroy()` does not clear `_submissions`, so the last frame's vertex/index typed
  arrays stay reachable from a destroyed manager. Trivial.

---

### WGPU-7 (LOW) A container that is exactly the default canvas size never initialises

`packages/webgpu/src/context.ts:123-125` (and `packages/canvas/src/utilities.ts:241-243`)

```ts
if (scaledWidth === this.element.width && scaledHeight === this.element.height) { return; }
```

A freshly created `<canvas>` is 300 × 150. If the host element measures exactly 300 × 150 CSS px at
DPR 1, `rescale` returns before `super.rescale`, so `this.width/height` stay `0`,
`_recreateDepthTexture` is never called, and `_executeRenderPass` bails at :260 forever — a
permanently blank canvas. `CanvasContext3D` has the same hole via `rescaleCanvas` (the projection
matrix stays identity, verified: `project([0,0,0]) === [0,0,0]` with a zero-size container). Compare
against `this.width`/`this.height` rather than the canvas backing store, or force a first pass.

---

### WGPU-8 (LOW) `clearColor` is documented as straight RGBA but the surface is premultiplied

`packages/webgpu/src/context.ts:45-46` and `:380`

`gpuContext.configure({ alphaMode: 'premultiplied' })`, so `clearValue` must be premultiplied too.
`clearColor: [1, 0, 0, 0.5]` is out of gamut for a premultiplied surface (r > a) and is
implementation-defined. Either document it as premultiplied or premultiply it on the way in. The
default `[0,0,0,0]` is fine.

---

## 3. Explicitly verified as correct (no defect found)

Checked and clean — recording these so the negative results are visible:

**Matrix / shader math.** `mat4Multiply` implements `A·B` for the documented column-major layout;
`mat4TransformPoint` indexes columns correctly; `getModelMatrix` composes `T·Rx·Ry·Rz` (rotation
about the shape's own origin, then translation) which matches the WGSL
`modelMatrix * vec4f(position, 1.0)`; `mat4Orthographic` is the standard GL form. Passing the
model matrix as the normal matrix is valid here because the shader multiplies with `w = 0`, so the
translation column drops out, and `Shape3D` exposes no scale.

**WGSL uniform layout.** `SCENE_UNIFORM_SIZE = 80` matches `mat4x4f`(0..63) + `vec3f`(64..75,
align 16) + `f32`(76..79), and the JS writes float slots 16/17/18/19 accordingly.
`MODEL_UNIFORM_SIZE = 128` matches two `mat4x4f`. Bind-group visibility flags (`0x3` scene =
VERTEX|FRAGMENT, `0x1` model = VERTEX) match the shaders' actual usage. `Float32Array.set(Float64Array)`
does perform the element-wise narrowing conversion.

**Blend / MSAA.** `src-alpha / one-minus-src-alpha` colour with `one / one-minus-src-alpha` alpha
onto a zeroed target yields a correctly premultiplied framebuffer, matching
`alphaMode: 'premultiplied'`. The MSAA attachment correctly uses `resolveTarget` +
`storeOp: 'discard'`. `depthClearValue: 1.0` + `depthCompare: 'less'` is right (given WGPU-1 is fixed).

**Buffer pooling and lifecycle (checklist item 7).** Exercised across 20 simulated scene rebuilds
alternating 1 ↔ 30 meshes and 2 ↔ 25 spheres through a real `WebGPUContext3D`:
staging arrays and GPU buffers grow in powers of two and only when exceeded; the superseded buffer
is destroyed on growth; buffers are *not* recreated when a frame shrinks; `writeBuffer` uploads only
the used prefix; per-mesh indices are rebased into the shared buffer with `baseVertex = 0` passed to
`drawIndexed`, which is self-consistent; the model-uniform pool ratchets to the peak per-frame mesh
count (30 buffers / 30 bind groups for a peak of 30) and is then reused, never reallocated;
`GeometryManager.destroy()` + `WebGPUContext3D.destroy()` leave **0 live buffers and 0 live
textures**. Stale bytes beyond `indexCount` remain in the index buffer but are never read. No leak
found across repeated rebuilds.

**Coordinate spaces for hit testing (checklist item 6).** `project()` yields logical CSS pixels;
`_drawFace` paints them through a CTM carrying the DPR scale; `Context.hitTest` receives device
pixels from `DOMContext` via `scaleX`; `isPointInPath` compares a CTM-transformed path against a
canvas-space point — so `CanvasContext3D` is consistent. `WebGPUContext3D` matches it by setting
`_hitContext.setTransform(dpr,0,0,dpr,0,0)` while the GPU rasterises NDC across the device-pixel
viewport. `Shape3D` deliberately does **not** consult `hitTestHonorsTransform` (its hit path is
already screen-space, so the inverse-world-transform mapping `Shape2D` applies would be wrong here)
— correct in isolation, though it is the same divergence as 3D-2: `getWorldTransform`/`getBoundingBox`
account for 2D transforms that neither the render nor the hit path does.

**`export()` (checklist item 8).** Both contexts inherit `Context3D.export()` →
`createCanvasExport(this.element)` (dom/src/export.ts:30), which snapshots into an offscreen 2D
canvas immediately and returns `{ toString, toURL, toImage }` — the right shape for a WebGPU
surface whose presented texture is transient. Confirmed the returned object exposes exactly those
three keys. On `CanvasContext3D` the faces are already flushed by `markRenderEnd` before `batch`
returns, so a post-render export captures them.

**Paint caches (checklist item 5).** `gradientCache` (canvas/src/utilities.ts:85) stores only the
*parsed, bounds-independent* `Gradient`, and a fresh `CanvasGradient` is built per use — safe.
`patternCache` (:105) stores bounds-independent `CanvasPattern`s shared across every context
instance — safe in practice. `Shape2D`'s path cache is keyed on `_cachedContext === context`, so it
cannot leak between a 2D and a 3D context. The **one** cache that does confuse the two is
`Element._localBoxCache` / `_worldBoxCache` — see 3D-6.

**Save/restore and push/pop balance (checklist items 1–3).** `pushGroup`/`popGroup` depth unwinding
is sound; `Element.render` and `Context.batch` are `try/finally`-balanced (verified: after a thrown
render callback both `renderDepth` and `saveDepth` return to 0). `markRenderStart`/`markRenderEnd`
nest correctly at every in-tree call site including a bare `Group.render` outside a `batch`. The
only imbalance found is the `clip: true` root-level `save` leak, which is a shared core issue
(3D-13), not a 3D one.

---

## 4. Ranked summary

### `@ripl/3d`

| # | Sev | Finding | Location |
|---|---|---|---|
| 3D-1 | **HIGH** | Any non-hex/rgb/hsl `fill` (e.g. `'red'`, a gradient) crashes the render pass and kills the rAF loop | `core/shape.ts:258,265,392` |
| 3D-2 | **HIGH** | Deferred face draw drops element+group opacity, composite, filter, shadow, clip **and all 2D transforms** | `core/context.ts:279-343` |
| 3D-3 | **HIGH** | Declared face normals are never transformed by the model matrix — shading frozen under rotation (CPU only; GPU is correct) | `core/shape.ts:287` |
| 3D-4 | **HIGH** | Geometry-property transitions are visually inert: `Element.interpolate` bypasses the face-cache invalidation | `core/shape.ts:184-190` |
| 3D-5 | MED | `lightMode` `'world'` / `'camera'` semantics are swapped | `core/context.ts:192-198` |
| 3D-6 | MED | Camera-dependent bounding box cached against element state → stale gradient bounds, debug boxes, fallback hits | `core/shape.ts:218-251` |
| 3D-7 | MED | `gradientBounds()` world-box override double-applies the CTM for 2D elements; dead for 3D shapes | `core/context.ts:247-250` |
| 3D-8 | MED | `_drawFace` caches a `lineWidth` it never applied → strokes at the wrong width | `core/context.ts:294-341` |
| 3D-9 | MED | 2D elements (and debug overlays) always paint beneath 3D geometry regardless of order | `core/context.ts:279` |
| 3D-10 | MED | Resize silently reverts an orthographic projection to perspective | `core/context.ts:149-159,265` |
| 3D-11 | MED | Picking sorts by per-shape mean depth while painting sorts per-face → wrong element picked | `core/shape.ts:165,307` |
| 3D-12 | MED | `Camera` attaches touch handlers and `touch-action: none` even with all interactions disabled | `core/camera.ts:392-489` |
| 3D-13 | LOW | Group clips don't reach the face flush but root clips do (+ shared per-frame save leak) | `core/context.ts:279` |
| 3D-14 | LOW | CPU path builds and discards a full interleaved mesh every frame (~33 KB/sphere/frame) | `core/shape.ts:263-269` |
| 3D-15 | LOW | `supportsPathCaching` not overridden → hosted 2D shapes re-trace every frame | `core/context.ts:228` |
| 3D-16 | LOW | No back-face culling on the CPU path (2× fill, alpha bleed-through) | `core/shape.ts:285-304` |
| 3D-17 | LOW | Degenerate camera inputs give silent NaN / collapsed view matrices | `core/camera.ts:254`, `math/matrix.ts:117` |
| 3D-18 | LOW | No near-plane clipping: geometry behind the eye projects mirrored (CPU only) | `math/matrix.ts:200-212` |
| 3D-19 | LOW | `renderDepth` unclamped; base `Context3D` never clears `faceBuffer`; user `meta` overrides `renderStrategy` | `core/context.ts:100,121` |
| 3D-20 | LOW | `Shape3D` in a plain 2D context throws `ctx.submitMesh is not a function` | `core/shape.ts:264` |

### `@ripl/webgpu`

| # | Sev | Finding | Location |
|---|---|---|---|
| WGPU-1 | MED | GL `[-1,1]` depth convention against WebGPU's `[0,1]` NDC → near-band geometry clipped, ~2× depth precision lost | `3d/src/math/matrix.ts:148-188` (consumed at `context.ts:266`) |
| WGPU-2 | MED | `rescale` uses `window.devicePixelRatio` instead of `factory.devicePixelRatio` → DPR desync breaks picking | `context.ts:119` |
| WGPU-3 | MED | 2D elements render nothing (base no-op `applyFill`/`applyStroke`/…) yet stay hit-testable | `context.ts:50` |
| WGPU-4 | MED | Inherits 3D-10 (ortho→perspective on resize) and 3D-19 (`meta` can force `'cpu'` → blank canvas + unbounded `faceBuffer`) | `context.ts:75-81,144` |
| WGPU-5 | LOW | `GeometryManager.flush()` has no destroyed guard (unreachable via the context, reachable via the public export) | `geometry.ts:73-149` |
| WGPU-6 | LOW | `createView()` twice per frame; `destroy()` doesn't `unconfigure()`, doesn't null textures, doesn't clear `_submissions`; `rescale` unguarded | `context.ts:280,310,339` |
| WGPU-7 | LOW | A 300×150 CSS-px container at DPR 1 trips the `rescale` early return → permanently blank | `context.ts:123` |
| WGPU-8 | LOW | `clearColor` documented as straight RGBA on a premultiplied surface | `context.ts:45,380` |

**Highest-value fixes, in order:** 3D-1 (guard `parseColor` before `triangulateFacesFlat`), 3D-4
(invalidate the face cache from the interpolator tick, or drop the cache), 3D-3 (transform declared
normals by the model matrix), 3D-2 (carry the resolved opacity/composite into `ProjectedFace3D`, or
re-apply the element's state around each face draw), then WGPU-1 (WebGPU-convention projection
matrices).

**Cross-cutting note for the core package** (out of scope for these two packages but surfaced by
them): `Renderer._tick` re-arms `requestAnimationFrame` only on the success path, so any exception
inside `batch` permanently stops the loop; and a root-level `clip: true` shape leaks one native
canvas `save` per frame on every canvas-backed context.
