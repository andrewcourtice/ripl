# Migrating to one public coordinate space

Ripl works in two coordinate spaces. Before this change, the boundary between them ran through the
public API: pointer events reported one space, hit testing took the other, and a consumer had to
know which method wanted which. Now the boundary sits inside the backends, and **every coordinate
crossing the public API is in logical space**.

- **Logical space** — CSS pixels, unaffected by the device pixel ratio, with `0,0` at the top-left
  of the context's own element. Elements are authored here, pointer events report here, and every
  public method takes and returns coordinates here.
- **Surface space** — the backend's own drawing coordinates: device pixels on canvas and WebGPU,
  identity on SVG, a scaled and letterboxed raster grid on the terminal. Backend-internal.

`Context.toLogicalPoint`/`toSurfacePoint` still exist and are unchanged, but they are now a seam for
authors of custom contexts. **A consumer never needs to call either.**

Entries marked **behaviour** change what gets computed without changing any type — code keeps
compiling, results move. Entries marked **API** change a type or signature and will surface as a
compile error.

## @ripl/core

**`Element.intersectsWith`** — **behaviour**. The `x`/`y` arguments are in logical space. The method
no longer maps the point through `Context.toLogicalPoint` before testing it against the bounding
box. Callers passing the coordinates from a pointer event payload were already holding logical
coordinates and were previously required to convert; **drop the `toSurfacePoint` call**, because it
now doubles the point on a retina canvas. On SVG and at a device pixel ratio of 1 nothing moves.

**`Shape2D.intersectsWith`** — **behaviour**. Same argument change. Internally the
surface → logical → surface round-trip is gone: the inverted world transform now applies directly to
the incoming logical point, and the local point is handed to `isPointInPath`/`isPointInStroke`
unscaled. A subclass overriding `intersectsWith` and calling `super` needs no change; one that
converted the point itself must stop.

**`Context.isPointInPath`** and **`Context.isPointInStroke`** — **behaviour**. Both take a logical
point. A backend whose native test wants its own drawing coordinates converts internally (see
`@ripl/canvas` and `@ripl/webgpu` below). A **custom `Context` implementation that forwards these to
a native canvas test must now convert the point itself**, with `this.toSurfacePoint(x, y)` — it is
the one place the helpers are still needed.

**`Context.hitTest`** — **behaviour**. Takes a logical point, so `protected` callers forwarding a
pointer coordinate no longer convert.

**`RenderElement.intersectsWith`** — **API**, documentation only. The declared space in the
interface's doc comment changes from surface to logical; the signature is unchanged. Any structural
implementation of `RenderElement` (a test double, say) that did its own conversion is now off by the
device pixel ratio.

**`Context.toLogicalPoint`** and **`Context.toSurfacePoint`** — unchanged in behaviour and still
public. Reframed as the backend seam. Overriding them in a custom context (as the terminal does for
its letterbox offset) is still correct and still required for a non-pure-scale mapping.

## @ripl/canvas

**`CanvasContext.isPointInPath`** and **`CanvasContext.isPointInStroke`** — **behaviour**. Map the
incoming logical point onto device pixels before the native call. Native `isPointInPath` reads its
point in untransformed canvas space while the path is transformed by the current matrix, so the
device-pixel-ratio matrix installed by `rescaleCanvas` has to be applied to the point by hand.

**`CanvasContext.setTransform`** — **behaviour**. The matrix is composed onto the surface's own
device-pixel base rather than replacing the current one outright. Previously
`context.setTransform(1, 0, 0, 1, 0, 0)` wiped the ratio matrix `rescaleCanvas` installs, so on a
retina display it meant "identity in device pixels" — everything drawn afterwards rendered at half
size, and the translation components were device pixels rather than CSS ones. **Code that
compensated by passing the device pixel ratio itself (`setTransform(dpr, 0, 0, dpr, 0, 0)`) now
applies it twice and must drop it.** `transform`, `rotate`, `scale` and `translate` are relative and
were always correct; they are unchanged.

## @ripl/3d and @ripl/webgpu

**`Context3D.rescale`** and **`WebGPUContext.rescale`** — **behaviour**. `resize` is emitted after
the device-scaled `scaleX`/`scaleY` and the rebuilt projection matrix are in place, rather than from
`super.rescale` before either. A bound scene repaints synchronously on `resize`, so the first frame
after a size change was drawn with identity scales and the previous frame's projection. A `resize`
handler that read `Context.scaleX` to compensate for the old behaviour should stop.

## @ripl/webgpu

**`WebGPUContext.isPointInPath`** and **`WebGPUContext.isPointInStroke`** — **behaviour**, and a bug
fix. Same conversion as canvas; the offscreen hit canvas carries the same device-pixel matrix as the
surface. Previously `Shape3D` traced its hit path from `Context3D.project`, which emits logical
coordinates, and compared it against a point the pointer pipeline had already scaled to device
pixels — so **on a display with a device pixel ratio above 1, hit testing missed by exactly that
ratio**. No action required; hit testing starts working.

**`Shape3D.intersectsWith`** — **behaviour**. Takes a logical point. The hit path is traced from
`Context3D.project`, which already emits logical coordinates, so no conversion happens here — the
fix is that the point now arrives in the space the path was built in. Same retina bug as WebGPU
above, and the same non-action.

## @ripl/dom

**`DOMContext`** — **behaviour**, internal. The single `toSurfacePoint` call that sat between the
pointer handlers and `hitTest` is gone; handlers pass the coordinates they emit. Nothing public
changes, but this is the line that made the whole seam necessary, and it is worth knowing it no
longer exists when reading the interaction code.

## Migration checklist

1. Search for `toSurfacePoint` in your own code. Every call that existed to feed `intersectsWith`,
   `isPointInPath`, or `isPointInStroke` should be deleted.
2. If you implement a custom `Context` that forwards `isPointInPath`/`isPointInStroke` to a native
   canvas test, add the conversion inside those methods.
3. If you override `Element.intersectsWith` and converted the point, stop.
4. Search for `setTransform`. If you passed the device pixel ratio to compensate for the old
   replace-outright behaviour, drop it — the backend now supplies it.
5. Nothing else. Element coordinates, event payloads, bounding boxes, `Context.width`/`height` and
   the navigator were already logical and are untouched.
