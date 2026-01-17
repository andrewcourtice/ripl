# Ripl Efficiency Report

This report documents several places in the codebase where performance could be improved.

## 1. arrayMap uses undefined length (Bug + Efficiency Issue)

**File:** `packages/utilities/src/collection.ts` (lines 57-65)

**Issue:** The `arrayMap` function creates a new array with `new Array<TResult>(length)`, but `length` is undefined in this scope. It should be `input.length`. This creates an array with undefined length which is inefficient and may cause unexpected behavior.

```typescript
export function arrayMap<TValue, TResult>(input: TValue[], iteratee: ArrayIteratee<TValue, TResult>, direction: IterationDirection = 1): TResult[] {
    const output = new Array<TResult>(length);  // BUG: 'length' is undefined, should be 'input.length'
    // ...
}
```

**Fix:** Change `length` to `input.length`.

---

## 2. arrayFlatMap uses inefficient concat in loop (O(n^2) complexity)

**File:** `packages/utilities/src/collection.ts` (lines 71-79)

**Issue:** The `arrayFlatMap` function uses `output.concat()` inside a loop, which creates a new array on each iteration. This results in O(n^2) time complexity instead of O(n).

```typescript
export function arrayFlatMap<TValue, TResult>(input: TValue[], iteratee: ArrayIteratee<TValue, TResult[]>, direction: IterationDirection = 1): TResult[] {
    let output = [] as TResult[];

    iterateArray(input, (value, index) => {
        output = output.concat(iteratee(value, index));  // Creates new array each iteration
    }, direction);

    return output;
}
```

**Fix:** Use `push(...items)` instead of `concat()` to mutate the array in place.

---

## 3. arrayGroup uses inefficient concat for single items

**File:** `packages/utilities/src/collection.ts` (lines 143-157)

**Issue:** The `arrayGroup` function uses `(output[group] || []).concat(value)` which creates a new array on each iteration when adding a single item. This is inefficient compared to using `push()`.

```typescript
iterateArray(input, value => {
    const group = groupIdentity(value);
    output[group] = (output[group] || []).concat(value);  // Creates new array each time
});
```

**Fix:** Initialize the array if needed and use `push()` instead.

---

## 4. Set utility functions unnecessarily convert to Array

**File:** `packages/utilities/src/collection.ts` (lines 185-199)

**Issue:** The `setForEach`, `setMap`, `setFind`, and `setFlatMap` functions all convert the Set to an Array using `Array.from()` before iterating. Sets can be iterated directly, avoiding the overhead of creating an intermediate array.

```typescript
export function setForEach<TValue>(input: Set<TValue>, iteratee: ArrayIteratee<TValue>, direction: IterationDirection = 1): void {
    arrayForEach(Array.from(input), iteratee, direction);  // Unnecessary Array.from()
}
```

**Fix:** Iterate over the Set directly when direction is forward (the common case).

---

## 5. stringUniqueId uses inefficient string concatenation in reduce

**File:** `packages/utilities/src/string.ts` (lines 1-8)

**Issue:** The `stringUniqueId` function uses `reduce` with string concatenation, which creates a new string on each iteration. Building an array and joining at the end would be more efficient.

```typescript
export function stringUniqueId(length: number = 6): string {
    const container = new Uint8Array(length / 2);
    window.crypto.getRandomValues(container);

    return container.reduce((output, value) => {
        return output + value.toString(16).padStart(2, '0');  // String concat in loop
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
    .sort((ea, eb) => order.indexOf(ea.id) - order.indexOf(eb.id));  // O(n) indexOf in sort
```

**Fix:** Create a Map from id to index for O(1) lookups.

---

## Summary

The most impactful fixes would be:
1. **arrayMap bug fix** - This is actually a bug that could cause incorrect behavior
2. **arrayFlatMap optimization** - O(n^2) to O(n) improvement in a utility function used throughout the codebase
3. **Group.children caching** - Frequently accessed during rendering

This PR will fix issue #2 (arrayFlatMap) as it provides a clear performance improvement with minimal risk.
