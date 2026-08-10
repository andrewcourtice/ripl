# @ripl/utilities

[![npm](https://img.shields.io/npm/v/@ripl/utilities)](https://www.npmjs.com/package/@ripl/utilities)
[![license](https://img.shields.io/npm/l/@ripl/utilities)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/utilities)](https://bundlephobia.com/package/@ripl/utilities)

> The typed helper functions every [Ripl](https://www.ripl.run) package is built from: type guards, numeric helpers, collection joins, comparators, caches and shared types.

**This is an internal dependency.** Every other `@ripl/*` package installs it, so you already have it transitively. Install it directly only if you want these helpers in your own code.

## Features

- **Category-prefixed names** — every runtime export starts with its category (`type*`, `number*`, `array*`, `object*`, `set*`, `string*`, `function*`, `comparitor*`, `predicate*`, `value*`, `time*`), so related helpers group together in autocomplete.
- **`arrayJoin`** — the left/inner/right join Ripl's charts diff data with. A `keyof` predicate takes a `Map`-backed path, so a keyed join is linear rather than quadratic.
- **Numeric helpers for axes and scales** — `numberExtent`, `numberNice` (rounds to a 1/2/5/10 × power of ten), `numberRoundTo`, `numberClamp`, `numberFormat`.
- **Eight type guards** — `typeIsArray`, `typeIsBoolean`, `typeIsDate`, `typeIsFunction`, `typeIsNil`, `typeIsNumber`, `typeIsObject`, `typeIsString`.
- **`createLRUCache`** — a bounded `Map` subclass that evicts the least recently used entry when full. Iteration is least-recently-used first and does not itself affect recency.
- **Function helpers** — `functionCache` (holds a result until invalidated), `functionMemoize` (keyed by a resolver, first argument by default), `functionProduce`, `functionIdentity`, `functionNoop`.
- **Shared types** — `OneOrMore<T>`, `AnyFunction`, `AnyObject`, `Disposable`, `Predicate<L, R>`, `Indexer<T>`, `Merge<A, B>`, plus `GetReadonlyKeys`/`GetMutableKeys`.
- **Zero dependencies, tree-shakable** — no runtime dependencies at all, and each helper is a separate export.

> Native array methods (`forEach`, `map`, `filter`, `reduce`, `find`, `flatMap`) and `Math.min`/`Math.max` are faster than wrappers, so this package has none. It ships only helpers that do something the platform does not.

## Installation

```bash
# npm
npm install @ripl/utilities

# yarn
yarn add @ripl/utilities

# pnpm
pnpm add @ripl/utilities
```

## Quick start

```typescript
import {
    arrayJoin,
    numberExtent,
    numberNice,
} from '@ripl/utilities';

const {
    left: entries,
    inner: updates,
    right: exits,
} = arrayJoin(data, elements, (datum, element) => datum.id === element.data);

exits.forEach(element => element.destroy());

const [min, max] = numberExtent(data, datum => datum.value);
const axisMax = numberNice(max, true);
```

## Key API

| Export | What it does |
| --- | --- |
| [`arrayJoin`](https://www.ripl.run/docs/api/@ripl/utilities/functions/arrayJoin) | Left/inner/right join for diffing data against drawn elements |
| [`arrayGroup` / `arrayDedupe` / `arrayIntersection` / `arrayDifference`](https://www.ripl.run/docs/api/@ripl/utilities/functions/arrayGroup) | Grouping and set operations over arrays |
| [`numberExtent` / `numberNice` / `numberClamp` / `numberFormat`](https://www.ripl.run/docs/api/@ripl/utilities/functions/numberNice) | The numeric helpers behind axes and scales |
| [`typeIsArray` … `typeIsString`](https://www.ripl.run/docs/api/@ripl/utilities/functions/typeIsArray) | The eight type guards |
| [`createLRUCache`](https://www.ripl.run/docs/api/@ripl/utilities/functions/createLRUCache) | Bounded, recency-ordered `Map` subclass |
| [`functionCache` / `functionMemoize`](https://www.ripl.run/docs/api/@ripl/utilities/functions/functionMemoize) | Result caching and keyed memoization |
| [`stringUniqueId`](https://www.ripl.run/docs/api/@ripl/utilities/functions/stringUniqueId) | Cryptographically random hex id, 8 characters by default |

## Related packages

- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the rendering core, this package's only direct consumer of note
- [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) — the browser entry point, and what most projects should install
- [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) — where `arrayJoin` does its data diffing

## Documentation

The full API reference is at [ripl.run/docs/api/@ripl/utilities](https://www.ripl.run/docs/api/@ripl/utilities/).

## License

[MIT](../../LICENSE)
