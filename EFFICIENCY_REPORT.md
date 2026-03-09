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

## 5. stringUniqueId uses inefficient string concatenation in reduce

**File:** `packages/utilities/src/string.ts` (lines 1-8)

**Issue:** The `stringUniqueId` function uses `reduce` with string concatenation, which creates a new string on each iteration. Building an array and joining at the end would be more efficient.

```typescript
export function stringUniqueId(length: number = 6): string {
    const container = new Uint8Array(length / 2);
    window.crypto.getRandomValues(container);

    return container.reduce((output, value) => {
        return output + value.toString(16).padStart(2, '0'); // String concat in loop
    }, '');
}
```

**Fix:** Use `Array.from().map().join('')` pattern instead.

---

## 6. Group.children getter creates new array on every access

**File:** `packages/core/src/core/group.ts` (lines 155-157)

**Issue:** The `children` getter creates a new array from the internal Set every time it's accessed. This is called frequently during rendering and querying operations.

```typescript
public get children() {
    return Array.from(this.#elements);  // New array created on every access
}
```

**Fix:** Cache the array and invalidate the cache when elements are added/removed.

---

## 7. SVGContext.render uses O(n) indexOf in sort comparator

**File:** `packages/svg/src/index.ts` (lines 287-289)

**Issue:** The sorting of elements uses `order.indexOf()` which is O(n) for each comparison, making the overall sort O(n^2 log n) instead of O(n log n).

```typescript
const orderedElements = newElements
    .concat(updatedElements)
    .sort((ea, eb) => order.indexOf(ea.id) - order.indexOf(eb.id)); // O(n) indexOf in sort
```

**Fix:** Create a Map from id to index for O(1) lookups.

---

## Summary

**Fixed (items 1-4):** All generic array wrappers removed, consumers migrated to native methods. `arrayGroup` and set utilities optimised. `arrayJoin` now uses a `Map` for O(1) key lookups when predicate is a key string. `arrayMapRange` uses indexed `for` loop instead of `Array.from`.

**Remaining:**
1. **stringUniqueId** (#5) — string concat in reduce
2. **Group.children caching** (#6) — new array on every access
3. **SVGContext sort** (#7) — O(n) indexOf in comparator
