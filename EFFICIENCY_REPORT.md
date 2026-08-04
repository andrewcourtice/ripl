# Ripl Efficiency Report

This report documents several places in the codebase where performance could be improved.

## 1. ~~arrayMap uses undefined length~~ ✅ FIXED

**Status:** Resolved. `arrayMap` and the generic array wrappers (`arrayForEach`, `arrayMap`, `arrayFilter`, `arrayReduce`, `arrayFind`, `arrayFlatMap`) have been removed in favor of native array methods. All consumers refactored. `arrayDedupe` remains (`packages/utilities/src/collection.ts`) — it wraps a `Set` round-trip that has no terser native equivalent and is used by `Context` event tracking.

---

## 2. ~~arrayFlatMap uses inefficient concat in loop~~ ✅ FIXED

**Status:** Resolved. `arrayFlatMap` removed; all consumers now use native `.flatMap()`.

---

## 3. ~~arrayGroup uses inefficient concat for single items~~ ✅ FIXED

**Status:** Resolved. `arrayGroup` now uses `(output[group] ??= []).push(value)` pattern — no intermediate array creation.

---

## 4. ~~Set utility functions unnecessarily convert to Array~~ ✅ FIXED

**Status:** Resolved. `setForEach`, `setMap`, `setFilter`, `setFind`, `setFlatMap` now use direct `for...of` loops over the Set instead of converting to Array first.

---

## 5. ~~stringUniqueId uses inefficient string concatenation in reduce~~ ✅ FIXED

**Status:** Resolved. `stringUniqueId` now builds the hex string with `Array.from(container, value => …).join('')` instead of a `reduce` that concatenates a new string per iteration.

---

## 6. Group.children getter creates new array on every access

**File:** `packages/core/src/core/group.ts`

**Issue:** The `children` getter creates a new array from the internal Set every time it's accessed. This is called frequently during rendering and querying operations.

<!-- eslint-skip -->
```typescript
public get children() {
    return Array.from(this._elements);  // New array created on every access
}
```

**Status:** Intentionally deferred. Several call sites mutate the returned array in place — notably `Scene._collectInstructions`, which sorts each group's `children` by z-index while flattening the graph — so the getter must keep returning a fresh copy. Caching a shared array would let those in-place sorts corrupt the cache.

---

## 7. ~~SVGContext.render uses O(n) indexOf in sort comparator~~ ✅ FIXED

**Status:** Resolved. SVG rendering reconciles through `reconcileNode` (`packages/dom/src/vdom.ts`), which orders children in a single O(n) pass using a `Set` of desired ids plus a `Map` of existing elements and `insertBefore`/`appendChild` — the O(n) `indexOf`-in-`sort` comparator no longer exists.

---

---

## 8. ~~Scene keeps a second copy of the render buffer~~ ✅ FIXED

**File:** `packages/core/src/core/scene.ts`

**Issue:** `_buffer` duplicated `_instructions`, rebuilt through a `.filter(...).map(...)` pair (two intermediate arrays) on every graph rebuild, while its only consumers were a `.length` check on resize and two debug-only reads in `Renderer`.

**Status:** Resolved. `Scene.buffer` is now a derived view of `Scene.instructions`, materialized on first access after each rebuild and dropped by the next one. One store, no per-rebuild projection.

---

## 9. ~~Renderer held two copies of the same transitions~~ ✅ FIXED

**File:** `packages/core/src/core/renderer.ts`

**Issue:** `_transitionMap` and a per-call symbol-keyed `scopedTransitions` map held the same entries under the same keys, with removal hand-written in both the completion callback and the `onAbort` path.

**Status:** Resolved. The per-call scope is a flat array of `{ elementId, transitionId, entry }` handles into the one map, and both removal paths go through a single `_removeTransition`. The entry reference is deliberately retained in the handle: `Transition.seek()` is valid after a transition has completed and must still drive its interpolator, which a map lookup would no longer find.

---

## 10. ~~hitTest allocated per pointer move, and its memo outlived the frame~~ ✅ FIXED

**File:** `packages/core/src/context/context.ts`

**Issue:** Every hit test built a `flatMap` array, a `filter` array and an `arrayDedupe` `Set`-round-trip, plus — on any test with ≥2 hits — a `new Map` over *every* rendered element to recover paint order. Worse, `renderedElements` is rebuilt each frame in `markRenderStart` while `_getTrackedElements`' memo was only invalidated on a graph rebuild, so the memo could hand back elements from an older frame while paint order came from the current one (missing entries scored `-1`).

**Status:** Resolved. Hits are collected in one pass into a single result array with a `Set` for dedupe; paint order is a memo rebuilt only when `renderedElements` changes; and `markRenderStart` invalidates the tracked-element memo at depth 0, so it can never outlive its frame. Regression test: *"hitTest should see an element that gained a listener after the memo was primed"* (`packages/core/test/context/context.test.ts`).

The `element.has(event)` re-filter inside the collect pass looks redundant against the memo's own predicate but is **not** — `off()`, a spent `once()` and `destroy()` all leave the memo stale *within* a frame, and three existing tests cover exactly that. It stays.

---

## 11. `getBoundingBox` allocates a `Box` on a cache hit — ❌ NOT SAFE TO FIX

**File:** `packages/core/src/core/element.ts`

**Issue:** Both the local and world cache hits return a freshly constructed `Box` rather than the cached instance.

**Status:** Declined. The copy is a deliberate, tested contract: `packages/core/test/core/bounds-cache.test.ts` → *"Should not corrupt the cache when a returned box is mutated"*. `Box` has public mutable fields, so handing out the cached instance would let any consumer's `box.left -= padding` silently poison every later bounding-box read on that element. No production caller mutates today, but the cost is one small object per call against a whole class of undiagnosable corruption. `getBoundingBox`'s JSDoc now states the ownership contract explicitly. Revisit only alongside an immutable `Box`.

---

## 12. ~~SVG resolved a gradient's bounding box twice per element per frame~~ ✅ FIXED

**File:** `packages/svg/src/context.ts`

**Issue:** `_resolveGradientStyle` called `currentRenderElement.getBoundingBox(true)` for each of the fill and the stroke, every frame.

**Status:** Partially resolved. The bounds are memoized per render element for the duration of its paint and dropped at each `markRenderStart`, so a fill and a stroke sharing an element resolve one box. This matters most for a **group** carrying a gradient: `Group._boundsCacheable` is `false`, so its box unions the whole subtree on every read — now once per frame instead of twice.

**Deferred:** making group boxes cacheable at all. A group's box composes from children whose changes are invisible in the group's own state version, so the existing cache key cannot see them; it needs a child-aware invalidation scheme, which is a design change rather than an audit fix.

---

## 13. ~~vdom re-queried the live DOM for exclusions, twice per child per frame~~ ✅ FIXED

**File:** `packages/dom/src/vdom.ts`

**Issue:** `reconcileChildren` called `element.matches(selector)` per DOM child in the removal pass and again in the insert-position walk — a live DOM query per child per frame under SVG's `excludeSelectors: ['defs']`.

**Status:** Resolved. Exclusions are resolved once per parent into a `Set`, which both passes read; a reconciler with no `excludeSelectors` shares a frozen empty set and allocates nothing.

**Deferred:** the `wantedIds` / `existingChildren` / `claimed` allocations. Each is load-bearing (duplicate sibling ids, id→node lists, cache-fallback claims) and lazily allocating them buys a Map per parent at the cost of shared-mutable-state hazards.

---

## 14. ~~Four independent surface↔screen mappings~~ ✅ FIXED

**Files:** `packages/dom/src/navigator.ts`, `packages/charts/src/components/navigator.ts`, `packages/devtools/src/highlight.ts`, `packages/webgpu/src/context.ts`

**Issue:** Four hand-rolled implementations of the same mapping, disagreeing on the details: `DOMNavigator` cached the origin but applied **no scale at all**; the chart overview strip read `getBoundingClientRect()` **per pointer event**; devtools computed its own `rect.width / context.width`; webgpu duplicated `rescaleCanvas`'s DPR sizing and transform.

**Status:** Resolved. `packages/dom/src/surface.ts` now owns one `getSurfaceRect` / `createSurfaceOrigin` pair — a lazily re-measured origin with scroll, window-resize and context-resize invalidation, mapping to and from *logical* space per the coordinate doctrine. All three DOM consumers adopt it; webgpu delegates its hit-canvas sizing to `rescaleCanvas`.

**Behaviour changes (intentional, both bugs):**
- The navigators now divide by the surface scale, so a CSS-scaled surface no longer mistakes display pixels for logical ones. Regression test: *"Should map gestures through the surface scale, not raw client pixels"* (`packages/dom/test/navigator.test.ts`).
- webgpu's `scaleX`/`scaleY` now describe the exact DPR transform its hit canvas installs rather than the floored backing store, matching every other canvas-backed context.

---

## 15. ~~Band and discrete scales scanned the domain per conversion~~ ✅ FIXED

**Files:** `packages/core/src/scales/band.ts`, `packages/core/src/scales/discrete.ts`

**Issue:** Both called `domain.indexOf(value)` on every conversion — O(n) per datum, O(n²) per series.

**Status:** Resolved. `createDomainIndex` (`scales/_base`) builds a value → first-index `Map` once per scale; both scales convert in O(1). First index wins and `NaN` still resolves to `-1`, so the lookup is behaviourally identical to `indexOf`.

---

## 16. `Group.render`'s z-index sort — ⚠️ LEFT IN PLACE

**File:** `packages/core/src/core/group.ts`

**Issue:** `Group.render` sorts its children by z-index on every invocation, duplicating the ordering `Scene._collectInstructions` already performs on rebuild.

**Status:** Left as-is. It is genuinely unreachable from the paint path — both `Scene.render` and `Renderer._renderBuffer` walk the flat instruction stream and only ever call `element.render(context)` for `draw` (leaf) entries, so it costs nothing per frame. But it is documented public API with direct test coverage (`packages/core/test/core/group-render.test.ts` asserts both ascending z-index order and stable ties), and the freeform-drawing export demo re-implements the same ordering precisely because it renders outside a scene. Removing the sort would break a documented contract for a saving of zero frames.

---

## Summary

**Fixed (items 1–5, 7):** All generic array wrappers removed, consumers migrated to native methods. `arrayGroup` and set utilities optimized. `arrayJoin` now uses a `Map` for O(1) key lookups when predicate is a key string. `arrayMapRange` uses indexed `for` loop instead of `Array.from`. `stringUniqueId` builds its hex string via `Array.from(...).join('')`. SVG rendering reorders through the O(n) `reconcileNode` pass.

**Fixed (items 8–10, 12–15):** The scene's render buffer became a derived view of the instruction stream; the renderer collapsed onto one transition store; `hitTest` dropped its per-move allocations and stopped reusing a previous frame's memo; SVG resolves a gradient's box once per element per frame; the vdom resolves exclusions once per parent; one shared surface-origin helper replaced four mappings (fixing the navigators' missing scale); and band/discrete scales convert through a keyed lookup.

**Remaining:**
1. **Group.children caching** (#6) — deferred by design: callers (e.g. `Scene._collectInstructions`' z-index sort) mutate the returned array, so it must stay a fresh copy.
2. **`getBoundingBox` cache-hit allocation** (#11) — declined: the defensive copy is a tested contract and `Box` is mutable. Needs an immutable `Box` first.
3. **Cacheable group bounding boxes** (#12) — needs child-aware invalidation, not an audit fix.
4. **SVG `_vtree` full per-frame rebuild** — architectural; needs a benchmark harness before any redesign.
5. **`Context.save()`'s ~28-key state spread and the full `CONTEXT_OPERATIONS` walk per element per frame** — dirty-key tracking is a design project, not an audit fix.
6. **`evictDetachedNodes` is O(cache × depth)** — only runs on a pass that removed a node, but the containment test walks the parent chain per cached entry.
7. **Remaining `reconcileChildren` per-parent maps** (#13) — load-bearing; lazy allocation trades a Map for shared mutable state.
