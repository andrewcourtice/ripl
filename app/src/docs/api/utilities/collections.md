---
outline: "deep"
---

# Collections

<p class="api-package-badge"><code>@ripl/utilities</code></p>

Array and Set helpers: join, group, intersect, difference, map range.

## Overview

**Interfaces:** [`ArrayJoin`](#arrayjoin)

**Type Aliases:** [`IterableObject`](#iterableobject) · [`CollectionIteratee`](#collectioniteratee) · [`ObjectIteratee`](#objectiteratee) · [`ObjectReducer`](#objectreducer) · [`ArrayGroupIdentity`](#arraygroupidentity) · [`ArrayJoinPredicate`](#arrayjoinpredicate)

**Functions:** [`arrayMapRange`](#arraymaprange) · [`arrayJoin`](#arrayjoin) · [`arrayGroup`](#arraygroup) · [`arrayIntersection`](#arrayintersection) · [`arrayDifference`](#arraydifference) · [`objectForEach`](#objectforeach) · [`objectMap`](#objectmap) · [`objectReduce`](#objectreduce) · [`setForEach`](#setforeach) · [`setMap`](#setmap) · [`setFilter`](#setfilter) · [`setFind`](#setfind) · [`setFlatMap`](#setflatmap)

### ArrayJoin `interface`

Result of an array join containing unmatched left items, matched pairs, and unmatched right items.

```ts
interface ArrayJoin<TLeft, TRight> {
    left: TLeft[];
    inner: [left: TLeft, right: TRight][];
    right: TRight[];
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `left` | `TLeft[]` |  |
| `inner` | `[left: TLeft, right: TRight][]` |  |
| `right` | `TRight[]` |  |
---

### IterableObject `type`

An object whose values are unknown, suitable for generic iteration.

```ts
type IterableObject = Record<PropertyKey, unknown>;
```

---

### CollectionIteratee `type`

Callback invoked for each item in a collection, receiving the value and its index.

```ts
type CollectionIteratee<TValue, TResult = void> = (value: TValue, index: number) => TResult;
```

---

### ObjectIteratee `type`

Callback invoked for each entry in an object, receiving the key and value.

```ts
type ObjectIteratee<TKey, TValue, TResult = void> = (key: TKey, value: TValue) => TResult;
```

---

### ObjectReducer `type`

Reducer callback for folding over object entries into an accumulated result.

```ts
type ObjectReducer<TKey, TValue, TResult = void> = (accumulator: TResult, key: TKey, value: TValue) => TResult;
```

---

### ArrayGroupIdentity `type`

A property key or indexer function used to derive group identity from array items.

```ts
type ArrayGroupIdentity<TValue> = keyof TValue | Indexer<TValue>;
```

---

### ArrayJoinPredicate `type`

A shared key or predicate function used to match items between two arrays in a join.

```ts
type ArrayJoinPredicate<TLeft, TRight> = keyof (TLeft & TRight) | Predicate<TLeft, TRight>;
```

---

### arrayMapRange `function`

Creates an array of the given length by mapping each index through the iteratee.

```ts
function arrayMapRange<TResult>(length: number, iteratee: (index: number) => TResult): TResult[]
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `length` | `number` |  |
| `iteratee` | `(index: number) =&gt; TResult` |  |

**Returns:** `TResult[]`

---

### arrayJoin `function`

Performs a full join between two arrays, returning entries (left-only), updates (matched), and exits (right-only).

```ts
function arrayJoin<TLeft, TRight>(leftInput: TLeft[], rightInput: TRight[], predicate: ArrayJoinPredicate<TLeft, TRight>): ArrayJoin<TLeft, TRight>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `leftInput` | `TLeft[]` |  |
| `rightInput` | `TRight[]` |  |
| `predicate` | `ArrayJoinPredicate&lt;TLeft, TRight&gt;` |  |

**Returns:** `ArrayJoin&lt;TLeft, TRight&gt;`

---

### arrayGroup `function`

Groups array items by a property key or indexer function into a keyed record.

```ts
function arrayGroup<TValue>(input: TValue[], identity: ArrayGroupIdentity<TValue>): Record<PropertyKey, TValue[]>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `TValue[]` |  |
| `identity` | `ArrayGroupIdentity&lt;TValue&gt;` |  |

**Returns:** `Record&lt;PropertyKey, TValue[]&gt;`

---

### arrayIntersection `function`

Returns items from the left array that have a matching counterpart in the right array.

```ts
function arrayIntersection<TLeft, TRight = TLeft>(leftInput: TLeft[], rightInput: TRight[], predicate?: ArrayJoinPredicate<TLeft, TRight>): TLeft[]
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `leftInput` | `TLeft[]` |  |
| `rightInput` | `TRight[]` |  |
| `predicate` | `ArrayJoinPredicate&lt;TLeft, TRight&gt; \| undefined` |  |

**Returns:** `TLeft[]`

---

### arrayDifference `function`

Returns items from the left array that have no matching counterpart in the right array.

```ts
function arrayDifference<TLeft, TRight = TLeft>(leftInput: TLeft[], rightInput: TRight[], predicate?: ArrayJoinPredicate<TLeft, TRight>): TLeft[]
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `leftInput` | `TLeft[]` |  |
| `rightInput` | `TRight[]` |  |
| `predicate` | `ArrayJoinPredicate&lt;TLeft, TRight&gt; \| undefined` |  |

**Returns:** `TLeft[]`

---

### objectForEach `function`

Iterates over the enumerable properties of an object, invoking the iteratee for each key-value pair.

```ts
function objectForEach<TSource extends IterableObject>(input: TSource, iteratee: ObjectIteratee<keyof TSource, TSource[keyof TSource]>): void
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `TSource` |  |
| `iteratee` | `ObjectIteratee&lt;keyof TSource, TSource[keyof TSource], void&gt;` |  |

**Returns:** `void`

---

### objectMap `function`

Maps over the enumerable properties of an object, producing a new object with transformed values.

```ts
function objectMap<TSource extends IterableObject, TResult extends Record<keyof TSource, unknown> = Record<keyof TSource, unknown>>(input: TSource, iteratee: ObjectIteratee<Extract<keyof TSource, string>, TSource[keyof TSource], unknown>): TResult
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `TSource` |  |
| `iteratee` | `ObjectIteratee&lt;Extract&lt;keyof TSource, string&gt;, TSource[keyof TSource], unknown&gt;` |  |

**Returns:** `TResult`

---

### objectReduce `function`

Reduces the enumerable properties of an object into a single accumulated value.

```ts
function objectReduce<TSource extends IterableObject, TResult>(input: TSource, reducer: ObjectReducer<keyof TSource, TSource[keyof TSource], TResult>, initial: TResult): TResult
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `TSource` |  |
| `reducer` | `ObjectReducer&lt;keyof TSource, TSource[keyof TSource], TResult&gt;` |  |
| `initial` | `TResult` |  |

**Returns:** `TResult`

---

### setForEach `function`

Iterates over each value in a `Set`, invoking the iteratee with the value and a running index.

```ts
function setForEach<TValue>(input: Set<TValue>, iteratee: CollectionIteratee<TValue>): void
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `Set&lt;TValue&gt;` |  |
| `iteratee` | `CollectionIteratee&lt;TValue, void&gt;` |  |

**Returns:** `void`

---

### setMap `function`

Maps over a `Set`, producing a new `Set` with each value transformed by the iteratee.

```ts
function setMap<TValue, TResult>(input: Set<TValue>, iteratee: CollectionIteratee<TValue, TResult>): Set<TResult>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `Set&lt;TValue&gt;` |  |
| `iteratee` | `CollectionIteratee&lt;TValue, TResult&gt;` |  |

**Returns:** `Set&lt;TResult&gt;`

---

### setFilter `function`

Filters a `Set`, returning a new `Set` containing only values that satisfy the predicate.

```ts
function setFilter<TValue>(input: Set<TValue>, predicate: CollectionIteratee<TValue, boolean>): Set<TValue>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `Set&lt;TValue&gt;` |  |
| `predicate` | `CollectionIteratee&lt;TValue, boolean&gt;` |  |

**Returns:** `Set&lt;TValue&gt;`

---

### setFind `function`

Searches a `Set` for the first value that satisfies the predicate.

```ts
function setFind<TValue>(input: Set<TValue>, predicate: CollectionIteratee<TValue, boolean>): TValue | undefined
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `Set&lt;TValue&gt;` |  |
| `predicate` | `CollectionIteratee&lt;TValue, boolean&gt;` |  |

**Returns:** `TValue \| undefined`

---

### setFlatMap `function`

Flat-maps over a `Set`, concatenating the arrays returned by the iteratee into a new `Set`.

```ts
function setFlatMap<TValue, TResult>(input: Set<TValue>, iteratee: CollectionIteratee<TValue, TResult[]>): Set<TResult>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `input` | `Set&lt;TValue&gt;` |  |
| `iteratee` | `CollectionIteratee&lt;TValue, TResult[]&gt;` |  |

**Returns:** `Set&lt;TResult&gt;`

---

