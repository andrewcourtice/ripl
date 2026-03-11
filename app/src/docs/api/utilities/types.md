---
outline: "deep"
---

# Types

<p class="api-package-badge"><code>@ripl/utilities</code></p>

Shared TypeScript type definitions.

## Overview

**Interfaces:** [`Disposable`](#disposable)

**Type Aliases:** [`AnyObject`](#anyobject) · [`AnyFunction`](#anyfunction) · [`AnyAsyncFunction`](#anyasyncfunction) · [`OneOrMore`](#oneormore) · [`Predicate`](#predicate) · [`Indexer`](#indexer) · [`Merge`](#merge) · [`UnionToIntersection`](#uniontointersection) · [`IfEquals`](#ifequals) · [`GetReadonlyKeys`](#getreadonlykeys) · [`GetMutableKeys`](#getmutablekeys)

### Disposable `interface`

A resource that can be disposed to release underlying subscriptions or handles.

```ts
interface Disposable {
    dispose: () => void;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `dispose` | `() =&gt; void` |  |
---

### AnyObject `type`

A loosely-typed object with string, number, or symbol keys.

```ts
type AnyObject = { [key: PropertyKey]: unknown };
```

---

### AnyFunction `type`

A loosely-typed function signature that accepts and returns anything.

```ts
type AnyFunction = (...args: any[]) => any;
```

---

### AnyAsyncFunction `type`

A loosely-typed async function signature.

```ts
type AnyAsyncFunction = (...args: any[]) => any;
```

---

### OneOrMore `type`

Represents a single value or an array of values.

```ts
type OneOrMore<TValue> = TValue | TValue[];
```

---

### Predicate `type`

A comparison function that tests whether two values match.

```ts
type Predicate<TLeft, TRight = TLeft> = (left: TLeft, right: TRight) => boolean;
```

---

### Indexer `type`

Derives a grouping key from a value.

```ts
type Indexer<TValue> = (value: TValue) => PropertyKey;
```

---

### Merge `type`

Merges two types, with properties in `TB` overriding those in `TA`.

```ts
type Merge<TA, TB> = Omit<TA, keyof TB> & TB;
```

---

### UnionToIntersection `type`

Converts a union type to an intersection type.

```ts
type UnionToIntersection<U> = (U extends any ? (arg: U) => any : never) extends ((arg: infer I) => void) ? I : never;
```

---

### IfEquals `type`

Conditional type that resolves to `A` if `X` and `Y` are identical, otherwise `B`.

```ts
type IfEquals<X, Y, A = X, B = never> =
    (<TValue>() => TValue extends X ? 1 : 2) extends
    (<TValue>() => TValue extends Y ? 1 : 2) ? A : B;
```

---

### GetReadonlyKeys `type`

Extracts the readonly property keys from an object type.

```ts
type GetReadonlyKeys<TValue extends object> = {
    [TKey in keyof TValue]-?: IfEquals<{ [Q in TKey]: TValue[TKey] }, { -readonly [Q in TKey]: TValue[TKey] }, never, TKey>
}[keyof TValue];
```

---

### GetMutableKeys `type`

Extracts the mutable (non-readonly) property keys from an object type.

```ts
type GetMutableKeys<TValue extends object> = {
    [TKey in keyof TValue]-?: IfEquals<{ [Q in TKey]: TValue[TKey] }, { -readonly [Q in TKey]: TValue[TKey] }, TKey>;
}[keyof TValue];
```

---

