---
outline: "deep"
---

# Type Guards

<p class="api-package-badge"><code>@ripl/utilities</code></p>

Runtime type checking predicates.

## Overview

**Functions:** [`typeIsArray`](#typeisarray) · [`typeIsDate`](#typeisdate) · [`typeIsObject`](#typeisobject) · [`typeIsBoolean`](#typeisboolean) · [`typeIsFunction`](#typeisfunction) · [`typeIsNumber`](#typeisnumber) · [`typeIsString`](#typeisstring) · [`typeIsNil`](#typeisnil) · [`predicateIdentity`](#predicateidentity) · [`predicateKey`](#predicatekey)

### typeIsArray `function`

Checks whether a value is an array.

```ts
function typeIsArray(value: unknown): value is unknown[]
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### typeIsDate `function`

Checks whether a value is a `Date` instance.

```ts
function typeIsDate(value: unknown): value is Date
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### typeIsObject `function`

Checks whether a value is a non-null object.

```ts
function typeIsObject(value: unknown): value is object
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### typeIsBoolean `function`

Checks whether a value is a boolean.

```ts
function typeIsBoolean(value: unknown): value is boolean
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### typeIsFunction `function`

Checks whether a value is a function.

```ts
function typeIsFunction(value: unknown): value is AnyFunction
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### typeIsNumber `function`

Checks whether a value is a number.

```ts
function typeIsNumber(value: unknown): value is number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### typeIsString `function`

Checks whether a value is a string.

```ts
function typeIsString(value: unknown): value is string
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### typeIsNil `function`

Checks whether a value is `null` or `undefined`.

```ts
function typeIsNil(value: unknown): value is null | undefined
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### predicateIdentity `function`

Tests strict reference equality between two values.

```ts
function predicateIdentity(valueA: unknown, valueB: unknown): boolean
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `valueA` | `unknown` |  |
| `valueB` | `unknown` |  |

**Returns:** `boolean`

---

### predicateKey `function`

Tests whether two objects share the same value at a given key.

```ts
function predicateKey<TValue extends Record<PropertyKey, unknown>>(valueA: TValue, valueB: TValue, key: PropertyKey): boolean
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `valueA` | `TValue` |  |
| `valueB` | `TValue` |  |
| `key` | `PropertyKey` |  |

**Returns:** `boolean`

---

