---
outline: "deep"
---

# Function, String, Number & Object

<p class="api-package-badge"><code>@ripl/utilities</code></p>

Miscellaneous utility functions.

## Overview

**Type Aliases:** [`CachedFunction`](#cachedfunction) · [`MemoizedFunction`](#memoizedfunction) · [`MemoizeResolver`](#memoizeresolver)

**Functions:** [`functionIdentity`](#functionidentity) · [`functionProduce`](#functionproduce) · [`functionCache`](#functioncache) · [`functionMemoize`](#functionmemoize) · [`stringUniqueId`](#stringuniqueid) · [`stringEquals`](#stringequals) · [`numberSum`](#numbersum) · [`numberGCD`](#numbergcd) · [`numberNice`](#numbernice) · [`objectFreeze`](#objectfreeze) · [`valueOneOrMore`](#valueoneormore) · [`comparitorNumeric`](#comparitornumeric) · [`comparitorDate`](#comparitordate) · [`comparitorString`](#comparitorstring)

### CachedFunction `type`

A function wrapper that caches its result after the first invocation until explicitly invalidated.

```ts
type CachedFunction<TValue extends AnyFunction> = {
    (...args: Parameters<TValue>): ReturnType<TValue>;
    invalidate(): void;
};
```

---

### MemoizedFunction `type`

A function wrapper that caches results per unique key, exposing the underlying cache `Map`.

```ts
type MemoizedFunction<TValue extends AnyFunction, TKey> = {
    (...args: Parameters<TValue>): ReturnType<TValue>;
    cache: Map<TKey, ReturnType<TValue>>;
};
```

---

### MemoizeResolver `type`

Derives a cache key from the arguments of a memoized function.

```ts
type MemoizeResolver<TValue extends AnyFunction, TKey> = (...args: Parameters<TValue>) => TKey;
```

---

### functionIdentity `function`

Returns the value it receives unchanged — useful as a default transform or placeholder.

```ts
function functionIdentity<TValue>(value: TValue);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `TValue` |  |

**Returns:** `TValue`

---

### functionProduce `function`

Wraps a value or factory function into a consistent factory that always returns the value.

```ts
function functionProduce<TValue>(value: TValue | (() => TValue)): () => TValue;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `TValue \| (() =&gt; TValue)` |  |

**Returns:** `() =&gt; TValue`

---

### functionCache `function`

Wraps a function so its result is computed once and then returned from cache on subsequent calls until `invalidate()` is called.

```ts
function functionCache<TValue extends AnyFunction>(value: TValue): CachedFunction<TValue>;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `TValue` |  |

**Returns:** `CachedFunction&lt;TValue&gt;`

---

### functionMemoize `function`

Memoizes a function by caching results keyed by the resolver (defaults to the first argument).

```ts
function functionMemoize<TValue extends AnyFunction, TKey = Parameters<TValue>[0]>(value: TValue, resolver: MemoizeResolver<TValue, TKey> = (...args) => args[0]);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `TValue` |  |
| `resolver` | `MemoizeResolver&lt;TValue, TKey&gt;` |  |

**Returns:** `MemoizedFunction&lt;TValue, TKey&gt;`

---

### stringUniqueId `function`

Generates a cryptographically random hexadecimal string of the specified length.

```ts
function stringUniqueId(length: number = 6): string;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `length` | `number` |  |

**Returns:** `string`

---

### stringEquals `function`

Case-insensitive string equality check.

```ts
function stringEquals(valueA: string, valueB: string);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `valueA` | `string` |  |
| `valueB` | `string` |  |

**Returns:** `boolean`

---

### numberSum `function`

Computes the sum of an array of numbers, or of values mapped through an optional iteratee.

```ts
function numberSum<TValue = number>(values: TValue[], iteratee?: (value: TValue) => number);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `values` | `TValue[]` |  |
| `iteratee` | `((value: TValue) =&gt; number) \| undefined` |  |

**Returns:** `number`

---

### numberGCD `function`

Computes the greatest common divisor of two integers using the Euclidean algorithm.

```ts
function numberGCD(valueA: number, valueB: number);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `valueA` | `number` |  |
| `valueB` | `number` |  |

**Returns:** `number`

---

### numberNice `function`

Rounds a value to a "nice" human-readable number (1, 2, 5, or 10 scaled by the appropriate power of ten).

```ts
function numberNice(value: number, round: boolean = false);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `number` |  |
| `round` | `boolean` |  |

**Returns:** `number`

---

### objectFreeze `function`

Creates a shallow frozen copy of the given object.

```ts
function objectFreeze<TValue extends object>(value: TValue);
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `TValue` |  |

**Returns:** `Readonly&lt;TValue&gt;`

---

### valueOneOrMore `function`

Normalises a single value or array into a guaranteed array.

```ts
function valueOneOrMore<TValue>(value: OneOrMore<TValue>): TValue[];
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `OneOrMore&lt;TValue&gt;` |  |

**Returns:** `TValue[]`

---

### comparitorNumeric `function`

Numeric comparator suitable for sorting numbers in ascending order.

```ts
function comparitorNumeric(valueA: number, valueB: number): number;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `valueA` | `number` |  |
| `valueB` | `number` |  |

**Returns:** `number`

---

### comparitorDate `function`

Date comparator suitable for sorting dates in ascending chronological order.

```ts
function comparitorDate(valueA: Date, valueB: Date): number;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `valueA` | `Date` |  |
| `valueB` | `Date` |  |

**Returns:** `number`

---

### comparitorString `function`

Locale-aware string comparator suitable for alphabetical sorting.

```ts
function comparitorString(valueA: string, valueB: string): number;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `valueA` | `string` |  |
| `valueB` | `string` |  |

**Returns:** `number`

---

