---
outline: "deep"
---

# Gradients

<p class="api-package-badge"><code>@ripl/core</code></p>

CSS gradient string parsing and serialization.

## Overview

**Interfaces:** [`GradientColorStop`](#gradientcolorstop) · [`LinearGradient`](#lineargradient) · [`RadialGradient`](#radialgradient) · [`ConicGradient`](#conicgradient)

**Type Aliases:** [`Gradient`](#gradient) · [`GradientType`](#gradienttype)

**Functions:** [`parseGradient`](#parsegradient) · [`isGradientString`](#isgradientstring) · [`serialiseGradient`](#serialisegradient)

### GradientColorStop `interface`

A single color stop within a gradient, consisting of a CSS color and an optional offset position.

```ts
interface GradientColorStop {
    color: string;
    offset?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `color` | `string` |  |
| `offset?` | `number \| undefined` |  |
---

### LinearGradient `interface`

A parsed linear gradient with angle, color stops, and optional repeating flag.

```ts
interface LinearGradient {
    type: 'linear';
    repeating: boolean;
    angle: number;
    stops: GradientColorStop[];
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `type` | `"linear"` |  |
| `repeating` | `boolean` |  |
| `angle` | `number` |  |
| `stops` | `GradientColorStop[]` |  |
---

### RadialGradient `interface`

A parsed radial gradient with shape, position, color stops, and optional repeating flag.

```ts
interface RadialGradient {
    type: 'radial';
    repeating: boolean;
    shape: string;
    position: [number, number];
    stops: GradientColorStop[];
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `type` | `"radial"` |  |
| `repeating` | `boolean` |  |
| `shape` | `string` |  |
| `position` | `[number, number]` |  |
| `stops` | `GradientColorStop[]` |  |
---

### ConicGradient `interface`

A parsed conic gradient with angle, position, color stops, and optional repeating flag.

```ts
interface ConicGradient {
    type: 'conic';
    repeating: boolean;
    angle: number;
    position: [number, number];
    stops: GradientColorStop[];
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `type` | `"conic"` |  |
| `repeating` | `boolean` |  |
| `angle` | `number` |  |
| `position` | `[number, number]` |  |
| `stops` | `GradientColorStop[]` |  |
---

### Gradient `type`

Union of all supported gradient types.

```ts
type Gradient = LinearGradient | RadialGradient | ConicGradient;
```

---

### GradientType `type`

```ts
type GradientType = Gradient['type'];
```

---

### parseGradient `function`

Parses a CSS gradient string (linear, radial, or conic) into a structured `Gradient` object, or returns `undefined` if the string is not a recognised gradient.

```ts
function parseGradient(value: string): Gradient | undefined
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `Gradient \| undefined`

---

### isGradientString `function`

Tests whether a string looks like a CSS gradient (starts with a recognised gradient function name).

```ts
function isGradientString(value: string): boolean
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `string` |  |

**Returns:** `boolean`

---

### serialiseGradient `function`

Serialises a structured `Gradient` object back into a CSS gradient string.

```ts
function serialiseGradient(gradient: Gradient): string
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `gradient` | `Gradient` |  |

**Returns:** `string`

---

