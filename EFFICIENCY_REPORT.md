# Ripl Efficiency Report

This report documents several places in the codebase where performance could be improved.

## 1. ~~arrayMap uses undefined length~~ ✅ FIXED

**Status:** Resolved. `arrayMap` and all generic array wrappers (`arrayForEach`, `arrayMap`, `arrayFilter`, `arrayReduce`, `arrayFind`, `arrayFlatMap`, `arrayDedupe`) have been removed in favour of native array methods. All consumers refactored.

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

**Status:** Intentionally deferred. Several call sites mutate the returned array in place — notably `Group.render`, which sorts `children` by z-index before drawing — so the getter must keep returning a fresh copy. Caching a shared array would let those in-place sorts corrupt the cache.

---

## 7. ~~SVGContext.render uses O(n) indexOf in sort comparator~~ ✅ FIXED

**Status:** Resolved. SVG rendering reconciles through `reconcileNode` (`packages/dom/src/vdom.ts`), which orders children in a single O(n) pass using a `Set` of desired ids plus a `Map` of existing elements and `insertBefore`/`appendChild` — the O(n) `indexOf`-in-`sort` comparator no longer exists.

---

## Summary

**Fixed (items 1–5, 7):** All generic array wrappers removed, consumers migrated to native methods. `arrayGroup` and set utilities optimised. `arrayJoin` now uses a `Map` for O(1) key lookups when predicate is a key string. `arrayMapRange` uses indexed `for` loop instead of `Array.from`. `stringUniqueId` builds its hex string via `Array.from(...).join('')`. SVG rendering reorders through the O(n) `reconcileNode` pass.

**Remaining:**
1. **Group.children caching** (#6) — deferred by design: callers (e.g. `Group.render`'s z-index sort) mutate the returned array, so it must stay a fresh copy.
