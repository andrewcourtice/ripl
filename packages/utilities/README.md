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
typeIsArray(value)     // value is unknown[]
typeIsFunction(value)  // value is AnyFunction
typeIsNil(value)       // value is null | undefined
typeIsNumber(value)    // value is number
typeIsString(value)    // value is string
typeIsObject(value)    // value is object
typeIsDate(value)      // value is Date
typeIsBoolean(value)   // value is boolean
```

### Collection Helpers

```typescript
arrayForEach(array, callback)
arrayMap(array, callback)
arrayFilter(array, callback)
arrayReduce(array, callback, initial)
arrayFind(array, predicate)
arrayFlatMap(array, callback)
arrayJoin(left, right, predicate)  // left/inner/right join for data diffing
```

### Object Helpers

```typescript
objectForEach(object, callback)
objectMap(object, callback)
objectMerge(target, ...sources)
```

### Common Types

```typescript
OneOrMore<T>      // T | T[]
AnyFunction       // (...args: any[]) => any
AnyObject         // { [key: PropertyKey]: unknown }
Disposable        // { dispose: () => void }
Predicate<L, R>   // (left: L, right: R) => boolean
```

### Value Helpers

```typescript
valueOr(value, fallback)       // value ?? fallback with type narrowing
valueOrDefault(value, fallback) // nullish coalescing with defaults
```

## Documentation

Full documentation is available at [ripl.rocks](https://www.ripl.rocks).

## License

[MIT](../../LICENSE)
