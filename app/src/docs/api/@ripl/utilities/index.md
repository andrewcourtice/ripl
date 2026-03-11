[Documentation](../../packages.md) / @ripl/utilities

# @ripl/utilities

Shared typed utility functions for [Ripl](https://www.ripl.rocks) — a unified API for 2D graphics rendering in the browser.

## Installation

```bash
npm install @ripl/utilities
```

## Overview

A collection of strictly-typed utility functions used across the Ripl ecosystem. Zero dependencies, fully tree-shakable.

## API

### Type Guards

```typescript
typeIsArray(value); // value is unknown[]
typeIsFunction(value); // value is AnyFunction
typeIsNil(value); // value is null | undefined
typeIsNumber(value); // value is number
typeIsString(value); // value is string
typeIsObject(value); // value is object
typeIsDate(value); // value is Date
typeIsBoolean(value); // value is boolean
```

### Collection Helpers

```typescript
arrayJoin(left, right, predicate); // left/inner/right join for data diffing (Map-optimized for key predicates)
arrayMapRange(length, callback); // map over a numeric range
arrayGroup(array, key); // group array items by key or function
arrayIntersection(left, right, predicate); // intersection of two arrays
arrayDifference(left, right, predicate); // difference of two arrays
```

> **Note:** Generic array wrappers (`arrayForEach`, `arrayMap`, `arrayFilter`, `arrayReduce`, `arrayFind`, `arrayFlatMap`) have been removed in favour of native array methods for better performance.

### Object Helpers

```typescript
objectForEach(object, callback);
objectMap(object, callback);
objectMerge(target, ...sources);
```

### Common Types

```typescript
OneOrMore<T>; // T | T[]
AnyFunction; // (...args: any[]) => any
AnyObject; // { [key: PropertyKey]: unknown }
Disposable; // { dispose: () => void }
Predicate<L, R>; // (left: L, right: R) => boolean
```

### Value Helpers

```typescript
valueOr(value, fallback); // value ?? fallback with type narrowing
valueOrDefault(value, fallback); // nullish coalescing with defaults
```

## Documentation

Full documentation is available at [ripl.rocks](https://www.ripl.rocks).

## License

[MIT](../../_media/LICENSE)

## Interfaces

| Interface | Description |
| ------ | ------ |
| [ArrayJoin](interfaces/ArrayJoin.md) | Result of an array join containing unmatched left items, matched pairs, and unmatched right items. |
| [Disposable](interfaces/Disposable.md) | A resource that can be disposed to release underlying subscriptions or handles. |
| [DOMElementResizeEvent](interfaces/DOMElementResizeEvent.md) | Simplified resize event containing the new dimensions of the observed element. |

## Type Aliases

| Type Alias | Description |
| ------ | ------ |
| [AnyAsyncFunction](type-aliases/AnyAsyncFunction.md) | A loosely-typed async function signature. |
| [AnyFunction](type-aliases/AnyFunction.md) | A loosely-typed function signature that accepts and returns anything. |
| [AnyObject](type-aliases/AnyObject.md) | A loosely-typed object with string, number, or symbol keys. |
| [ArrayGroupIdentity](type-aliases/ArrayGroupIdentity.md) | A property key or indexer function used to derive group identity from array items. |
| [ArrayJoinPredicate](type-aliases/ArrayJoinPredicate.md) | A shared key or predicate function used to match items between two arrays in a join. |
| [CachedFunction](type-aliases/CachedFunction.md) | A function wrapper that caches its result after the first invocation until explicitly invalidated. |
| [CollectionIteratee](type-aliases/CollectionIteratee.md) | Callback invoked for each item in a collection, receiving the value and its index. |
| [DOMElementEventMap](type-aliases/DOMElementEventMap.md) | Resolves the correct event map for a given DOM element type. |
| [DOMElementResizeHandler](type-aliases/DOMElementResizeHandler.md) | Callback invoked when an observed element is resized. |
| [DOMEventHandler](type-aliases/DOMEventHandler.md) | A strongly-typed DOM event handler bound to a specific element and event type. |
| [GetMutableKeys](type-aliases/GetMutableKeys.md) | Extracts the mutable (non-readonly) property keys from an object type. |
| [GetReadonlyKeys](type-aliases/GetReadonlyKeys.md) | Extracts the readonly property keys from an object type. |
| [IfEquals](type-aliases/IfEquals.md) | Conditional type that resolves to `A` if `X` and `Y` are identical, otherwise `B`. |
| [Indexer](type-aliases/Indexer.md) | Derives a grouping key from a value. |
| [IterableObject](type-aliases/IterableObject.md) | An object whose values are unknown, suitable for generic iteration. |
| [MemoizedFunction](type-aliases/MemoizedFunction.md) | A function wrapper that caches results per unique key, exposing the underlying cache `Map`. |
| [MemoizeResolver](type-aliases/MemoizeResolver.md) | Derives a cache key from the arguments of a memoized function. |
| [Merge](type-aliases/Merge.md) | Merges two types, with properties in `TB` overriding those in `TA`. |
| [ObjectIteratee](type-aliases/ObjectIteratee.md) | Callback invoked for each entry in an object, receiving the key and value. |
| [ObjectReducer](type-aliases/ObjectReducer.md) | Reducer callback for folding over object entries into an accumulated result. |
| [OneOrMore](type-aliases/OneOrMore.md) | Represents a single value or an array of values. |
| [Predicate](type-aliases/Predicate.md) | A comparison function that tests whether two values match. |
| [UnionToIntersection](type-aliases/UnionToIntersection.md) | Converts a union type to an intersection type. |

## Variables

| Variable | Description |
| ------ | ------ |
| [hasWindow](variables/hasWindow.md) | Whether the current environment has a `window` object (i.e. is a browser context). |

## Functions

| Function | Description |
| ------ | ------ |
| [arrayDifference](functions/arrayDifference.md) | Returns items from the left array that have no matching counterpart in the right array. |
| [arrayGroup](functions/arrayGroup.md) | Groups array items by a property key or indexer function into a keyed record. |
| [arrayIntersection](functions/arrayIntersection.md) | Returns items from the left array that have a matching counterpart in the right array. |
| [arrayJoin](functions/arrayJoin.md) | Performs a full join between two arrays, returning entries (left-only), updates (matched), and exits (right-only). |
| [arrayMapRange](functions/arrayMapRange.md) | Creates an array of the given length by mapping each index through the iteratee. |
| [comparitorDate](functions/comparitorDate.md) | Date comparator suitable for sorting dates in ascending chronological order. |
| [comparitorNumeric](functions/comparitorNumeric.md) | Numeric comparator suitable for sorting numbers in ascending order. |
| [comparitorString](functions/comparitorString.md) | Locale-aware string comparator suitable for alphabetical sorting. |
| [functionCache](functions/functionCache.md) | Wraps a function so its result is computed once and then returned from cache on subsequent calls until `invalidate()` is called. |
| [functionIdentity](functions/functionIdentity.md) | Returns the value it receives unchanged — useful as a default transform or placeholder. |
| [functionMemoize](functions/functionMemoize.md) | Memoizes a function by caching results keyed by the resolver (defaults to the first argument). |
| [functionProduce](functions/functionProduce.md) | Wraps a value or factory function into a consistent factory that always returns the value. |
| [numberGCD](functions/numberGCD.md) | Computes the greatest common divisor of two integers using the Euclidean algorithm. |
| [numberNice](functions/numberNice.md) | Rounds a value to a "nice" human-readable number (1, 2, 5, or 10 scaled by the appropriate power of ten). |
| [numberSum](functions/numberSum.md) | Computes the sum of an array of numbers, or of values mapped through an optional iteratee. |
| [objectForEach](functions/objectForEach.md) | Iterates over the enumerable properties of an object, invoking the iteratee for each key-value pair. |
| [objectFreeze](functions/objectFreeze.md) | Creates a shallow frozen copy of the given object. |
| [objectMap](functions/objectMap.md) | Maps over the enumerable properties of an object, producing a new object with transformed values. |
| [objectReduce](functions/objectReduce.md) | Reduces the enumerable properties of an object into a single accumulated value. |
| [onDOMElementResize](functions/onDOMElementResize.md) | Observes an element for size changes using `ResizeObserver` (with a `window.resize` fallback) and returns a disposable. |
| [onDOMEvent](functions/onDOMEvent.md) | Attaches a strongly-typed event listener to a DOM element and returns a disposable for cleanup. |
| [predicateIdentity](functions/predicateIdentity.md) | Tests strict reference equality between two values. |
| [predicateKey](functions/predicateKey.md) | Tests whether two objects share the same value at a given key. |
| [setFilter](functions/setFilter.md) | Filters a `Set`, returning a new `Set` containing only values that satisfy the predicate. |
| [setFind](functions/setFind.md) | Searches a `Set` for the first value that satisfies the predicate. |
| [setFlatMap](functions/setFlatMap.md) | Flat-maps over a `Set`, concatenating the arrays returned by the iteratee into a new `Set`. |
| [setForEach](functions/setForEach.md) | Iterates over each value in a `Set`, invoking the iteratee with the value and a running index. |
| [setMap](functions/setMap.md) | Maps over a `Set`, producing a new `Set` with each value transformed by the iteratee. |
| [stringEquals](functions/stringEquals.md) | Case-insensitive string equality check. |
| [stringUniqueId](functions/stringUniqueId.md) | Generates a cryptographically random hexadecimal string of the specified length. |
| [typeIsArray](functions/typeIsArray.md) | Checks whether a value is an array. |
| [typeIsBoolean](functions/typeIsBoolean.md) | Checks whether a value is a boolean. |
| [typeIsDate](functions/typeIsDate.md) | Checks whether a value is a `Date` instance. |
| [typeIsFunction](functions/typeIsFunction.md) | Checks whether a value is a function. |
| [typeIsNil](functions/typeIsNil.md) | Checks whether a value is `null` or `undefined`. |
| [typeIsNumber](functions/typeIsNumber.md) | Checks whether a value is a number. |
| [typeIsObject](functions/typeIsObject.md) | Checks whether a value is a non-null object. |
| [typeIsString](functions/typeIsString.md) | Checks whether a value is a string. |
| [valueOneOrMore](functions/valueOneOrMore.md) | Normalises a single value or array into a guaranteed array. |
