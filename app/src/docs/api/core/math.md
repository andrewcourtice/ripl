---
outline: "deep"
---

# Math & Geometry

<p class="api-package-badge"><code>@ripl/core</code></p>

Geometry utilities, trigonometry helpers, and bounding box structures.

## Overview

**Classes:** [`Box`](#box)

**Type Aliases:** [`PathPoint`](#pathpoint) · [`Point`](#point) · [`BorderRadius`](#borderradius)

**Functions:** [`degreesToRadians`](#degreestoradians) · [`radiansToDegrees`](#radianstodegrees) · [`arePointsEqual`](#arepointsequal) · [`getMidpoint`](#getmidpoint) · [`getWaypoint`](#getwaypoint) · [`getHypLength`](#gethyplength) · [`getThetaPoint`](#getthetapoint) · [`getPolygonPoints`](#getpolygonpoints) · [`getContainingBox`](#getcontainingbox) · [`isPointInBox`](#ispointinbox) · [`normaliseBorderRadius`](#normaliseborderradius) · [`typeIsPoint`](#typeispoint) · [`getPathLength`](#getpathlength) · [`samplePathPoint`](#samplepathpoint) · [`min`](#min) · [`max`](#max) · [`minOf`](#minof) · [`maxOf`](#maxof) · [`clamp`](#clamp) · [`fractional`](#fractional) · [`getExtent`](#getextent) · [`getTotal`](#gettotal)

**Constants:** [`TAU`](#tau)

### Box `class`

An axis-aligned bounding box defined by its four edges.

```ts
class Box
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `top` | `number` |  |
| `left` | `number` |  |
| `bottom` | `number` |  |
| `right` | `number` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `top` | `number` |  |
| `left` | `number` |  |
| `bottom` | `number` |  |
| `right` | `number` |  |
| `width` | `number` | The horizontal span of the box. |
| `height` | `number` | The vertical span of the box. |
---

### PathPoint `type`

A sampled point on an SVG path with position and tangent angle.

```ts
type PathPoint = {
    x: number;
    y: number;
    angle: number;
};
```

---

### Point `type`

A 2D point represented as an `[x, y]` tuple.

```ts
type Point = [x: number, y: number];
```

---

### BorderRadius `type`

Four-corner border radius represented as `[topLeft, topRight, bottomRight, bottomLeft]`.

```ts
type BorderRadius = [
    topLeft: number,
    topRight: number,
    bottomRight: number,
    bottomLeft: number
];
```

---

### degreesToRadians `function`

Converts degrees to radians.

```ts
function degreesToRadians(degrees: number): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `degrees` | `number` |  |

**Returns:** `number`

---

### radiansToDegrees `function`

Converts radians to degrees.

```ts
function radiansToDegrees(radians: number): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `radians` | `number` |  |

**Returns:** `number`

---

### arePointsEqual `function`

Tests whether two points have identical coordinates.

```ts
function arePointsEqual([x1, y1]: Point, [x2, y2]: Point): boolean
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `__0` | `Point` |  |
| `__1` | `Point` |  |

**Returns:** `boolean`

---

### getMidpoint `function`

Returns the midpoint between two points.

```ts
function getMidpoint(pointA: Point, pointB: Point): Point
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `pointA` | `Point` |  |
| `pointB` | `Point` |  |

**Returns:** `Point`

---

### getWaypoint `function`

Returns a point along the line segment between two points at the given normalised position (0–1).

```ts
function getWaypoint([x1, y1]: Point, [x2, y2]: Point, position: number): Point
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `__0` | `Point` |  |
| `__1` | `Point` |  |
| `position` | `number` |  |

**Returns:** `Point`

---

### getHypLength `function`

Computes the hypotenuse length from two right-triangle sides.

```ts
function getHypLength(sideA: number, sideB: number): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `sideA` | `number` |  |
| `sideB` | `number` |  |

**Returns:** `number`

---

### getThetaPoint `function`

Returns the point at a given angle and distance from an optional centre.

```ts
function getThetaPoint(angle: number, distance: number, cx?: number, cy?: number): Point
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `angle` | `number` |  |
| `distance` | `number` |  |
| `cx` | `number \| undefined` |  |
| `cy` | `number \| undefined` |  |

**Returns:** `Point`

---

### getPolygonPoints `function`

Generates the vertex points of a regular polygon centred at `(cx, cy)` with the given radius and number of sides.

```ts
function getPolygonPoints(
    sides: number,
    cx: number,
    cy: number,
    radius: number,
    closePath: boolean = true
): Point[]
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `sides` | `number` |  |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radius` | `number` |  |
| `closePath` | `boolean` |  |

**Returns:** `Point[]`

---

### getContainingBox `function`

Computes the smallest axis-aligned bounding box that contains all boxes extracted from the array.

```ts
function getContainingBox<TValue>(value: TValue[], identity: (value: TValue) => Box): Box
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `TValue[]` |  |
| `identity` | `(value: TValue) =&gt; Box` |  |

**Returns:** `Box`

---

### isPointInBox `function`

Tests whether a point lies within the given bounding box (inclusive).

```ts
function isPointInBox([x, y]: Point,
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `__0` | `Point` |  |
| `__1` | `Box` |  |

**Returns:** `boolean`

---

### normaliseBorderRadius `function`

Normalises a border radius value into a four-corner tuple, expanding a single number to all corners.

```ts
function normaliseBorderRadius(borderRadius: number | BorderRadius): BorderRadius
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `borderRadius` | `number \| BorderRadius` |  |

**Returns:** `BorderRadius`

---

### typeIsPoint `function`

Type guard that checks whether a value is a `Point` (a two-element array).

```ts
function typeIsPoint(value: unknown): value is Point
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### getPathLength `function`

Computes the total length of an SVG path from its `d` attribute string.

```ts
function getPathLength(pathData: string): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `pathData` | `string` |  |

**Returns:** `number`

---

### samplePathPoint `function`

Samples a point and tangent angle at the given distance along an SVG path.

```ts
function samplePathPoint(pathData: string, distance: number): PathPoint
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `pathData` | `string` |  |
| `distance` | `number` |  |

**Returns:** `PathPoint`

---

### min `function`

Returns the minimum of the provided numbers.

```ts
function min(...values: number[]): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `values` | `number[]` |  |

**Returns:** `number`

---

### max `function`

Returns the maximum of the provided numbers.

```ts
function max(...values: number[]): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `values` | `number[]` |  |

**Returns:** `number`

---

### minOf `function`

Returns the minimum numeric value extracted from an array via the accessor.

```ts
function minOf<TValue>(values: TValue[], accessor: (value: TValue) => number)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `values` | `TValue[]` |  |
| `accessor` | `(value: TValue) =&gt; number` |  |

**Returns:** `number`

---

### maxOf `function`

Returns the maximum numeric value extracted from an array via the accessor.

```ts
function maxOf<TValue>(values: TValue[], accessor: (value: TValue) => number)
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `values` | `TValue[]` |  |
| `accessor` | `(value: TValue) =&gt; number` |  |

**Returns:** `number`

---

### clamp `function`

Constrains a value to the inclusive range between lower and upper bounds.

```ts
function clamp(value: number, lower: number, upper: number): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `number` |  |
| `lower` | `number` |  |
| `upper` | `number` |  |

**Returns:** `number`

---

### fractional `function`

Returns the fractional part of a number (e.g. `fractional(3.7)` → `0.7`).

```ts
function fractional(value: number): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `number` |  |

**Returns:** `number`

---

### getExtent `function`

Computes the `[min, max]` extent of an array using the given numeric accessor.

```ts
function getExtent<TValue>(values: TValue[], accessor: (value: TValue) => number): [min: number, max: number]
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `values` | `TValue[]` |  |
| `accessor` | `(value: TValue) =&gt; number` |  |

**Returns:** `[min: number, max: number]`

---

### getTotal `function`

Sums all numeric values extracted from an array via the accessor.

```ts
function getTotal<TValue>(values: TValue[], accessor: (value: TValue) => number): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `values` | `TValue[]` |  |
| `accessor` | `(value: TValue) =&gt; number` |  |

**Returns:** `number`

---

### TAU `const`

Full circle in radians (2π).

```ts
const TAU: number
```

---

