# @ripl/utilities

Shared typed utility functions for [Ripl](https://www.ripl.run): a unified API for 2D graphics rendering in the browser.

## Installation

```bash
npm install @ripl/utilities
```

## Overview

A collection of strictly-typed utility functions used across the Ripl ecosystem. Zero dependencies, fully tree-shakable. Every runtime export is prefixed by its category (`type*`, `number*`, `array*`, `object*`, `set*`, `string*`, `function*`, `comparitor*`, `predicate*`, `value*`, `time*`) so related helpers group together in autocomplete.

## API

### Type Guards

```typescript
typeIsArray(value); // value is unknown[]
typeIsBoolean(value); // value is boolean
typeIsDate(value); // value is Date
typeIsFunction(value); // value is AnyFunction
typeIsNil(value); // value is null | undefined
typeIsNumber(value); // value is number
typeIsObject(value); // value is object
typeIsString(value); // value is string
```

### Number Helpers

```typescript
numberClamp(value, lower, upper); // constrain a value to an inclusive range
numberMinOf(values, accessor); // minimum extracted from an array via an accessor
numberMaxOf(values, accessor); // maximum extracted from an array via an accessor
numberExtent(values, accessor); // [min, max] extent via an accessor
numberSum(values, iteratee); // sum of an array, optionally mapped through an iteratee
numberFractional(value); // fractional part of a number (numberFractional(3.7) === 0.7)
numberRoundTo(value, precision); // round to N decimals, returning a number (trailing zeros stripped)
numberNice(value, round); // round to a "nice" 1/2/5/10 × power-of-ten value
numberFormat(value, options); // locale-aware Intl.NumberFormat string
```

> **Note:** The plain variadic `min`/`max` wrappers have been removed in favour of the native `Math.min`/`Math.max` for better performance.

### Collection Helpers

```typescript
arrayMapRange(length, iteratee); // build an array by mapping each index
arrayJoin(left, right, predicate); // left/inner/right join for data diffing (Map-optimized for key predicates)
arrayGroup(array, identity); // group items by key or function into a keyed record
arrayIntersection(left, right, predicate); // items in left that match something in right
arrayDifference(left, right, predicate); // items in left with no match in right
arrayDedupe(array); // remove duplicates, preserving insertion order

objectForEach(object, iteratee); // iterate enumerable (key, value) pairs
objectMap(object, iteratee); // map enumerable properties into a new object
objectReduce(object, reducer, seed); // reduce enumerable properties to a single value
objectFreeze(object); // shallow frozen copy

setForEach(set, iteratee); // iterate a Set with a running index
setMap(set, iteratee); // map a Set into a new Set
setFilter(set, predicate); // filter a Set into a new Set
setFind(set, predicate); // first Set value matching a predicate
setFlatMap(set, iteratee); // flat-map a Set into a new Set
```

> **Note:** Generic array wrappers (`arrayForEach`, `arrayMap`, `arrayFilter`, `arrayReduce`, `arrayFind`, `arrayFlatMap`) have been removed in favour of native array methods for better performance.

### Comparators

```typescript
comparitorNumeric(a, b); // ascending numeric sort
comparitorDate(a, b); // ascending chronological sort
comparitorString(a, b); // locale-aware alphabetical sort
```

### Function Helpers

```typescript
functionNoop(); // a do-nothing function
functionIdentity(value); // returns its argument unchanged
functionProduce(valueOrFactory); // normalize a value-or-factory into a factory
functionCache(fn); // cache a fn's result until invalidate() is called
functionMemoize(fn, resolver); // memoize a fn keyed by a resolver (defaults to the first argument)
```

### String Helpers

```typescript
stringUniqueId(length); // cryptographically random hex id (default 8 chars)
stringEquals(a, b); // case-insensitive equality
```

### Predicates

```typescript
predicateIdentity(a, b); // strict reference equality (===)
predicateKey(key); // whether two objects share the same value at a key
```

### Value Helpers

```typescript
valueOneOrMore(value); // normalize OneOrMore<T> into a guaranteed T[]
```

### Time Helpers

```typescript
timeFormat(value, options); // locale-aware Intl.DateTimeFormat string for a Date or epoch
```

### Common Types

```typescript
OneOrMore<T>; // T | T[]
AnyFunction; // (...args: any[]) => any
AnyObject; // { [key: PropertyKey]: unknown }
Disposable; // { dispose: () => void }
Predicate<L, R>; // (left: L, right: R) => boolean
```

## Documentation

Full documentation is available at [ripl.run](https://www.ripl.run).

## License

[MIT](../../LICENSE)
