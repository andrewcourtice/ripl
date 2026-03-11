---
outline: "deep"
---

# Interpolators

<p class="api-package-badge"><code>@ripl/core</code></p>

Value interpolation factories for animating between states.

## Overview

**Interfaces:** [`StringInterpolatorTag`](#stringinterpolatortag)

**Type Aliases:** [`StringInterpolationSet`](#stringinterpolationset) · [`StringInterpolationFormatter`](#stringinterpolationformatter) · [`Interpolator`](#interpolator) · [`PredicatedFunction`](#predicatedfunction) · [`InterpolatorFactory`](#interpolatorfactory)

**Functions:** [`interpolateWaypoint`](#interpolatewaypoint) · [`interpolatePath`](#interpolatepath) · [`interpolatePolygonPoint`](#interpolatepolygonpoint) · [`interpolateCirclePoint`](#interpolatecirclepoint) · [`interpolateString`](#interpolatestring)

**Constants:** [`interpolateAny`](#interpolateany) · [`interpolateColor`](#interpolatecolor) · [`interpolateDate`](#interpolatedate) · [`interpolateGradient`](#interpolategradient) · [`interpolateNumber`](#interpolatenumber) · [`interpolatePoints`](#interpolatepoints) · [`interpolateBorderRadius`](#interpolateborderradius) · [`interpolateRotation`](#interpolaterotation) · [`interpolateTransformOrigin`](#interpolatetransformorigin)

### StringInterpolatorTag `interface`

A tagged template result capturing the static fragments and dynamic numeric arguments.

```ts
interface StringInterpolatorTag {
    fragments: TemplateStringsArray;
    args: number[];
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `fragments` | `TemplateStringsArray` |  |
| `args` | `number[]` |  |
---

### StringInterpolationSet `type`

A pair of tagged template results representing the start and end states for string interpolation.

```ts
type StringInterpolationSet = [valueA: StringInterpolatorTag, valueB: StringInterpolatorTag];
```

---

### StringInterpolationFormatter `type`

Optional formatter applied to each interpolated numeric value before insertion into the output string.

```ts
type StringInterpolationFormatter = (value: number) => number;
```

---

### Interpolator `type`

A function that interpolates between two values based on a normalised position (0–1).

```ts
type Interpolator<TValue = number> = (position: number) => TValue;
```

---

### PredicatedFunction `type`

A callable with a `test` method used to determine whether the factory can handle a given value.

```ts
type PredicatedFunction = {
    test?(value: unknown): boolean;
};
```

---

### InterpolatorFactory `type`

A factory that creates an interpolator between two values of the same type, with a `test` predicate for type matching.

```ts
type InterpolatorFactory<TOut = number, TIn = TOut> = {
    (valueA: TIn, valueB: TIn): Interpolator<TOut>;
} & PredicatedFunction;
```

---

### interpolateWaypoint `function`

Creates an interpolator that returns the point along a polyline at the given normalised position.

```ts
function interpolateWaypoint(points: Point[]): Interpolator<Point>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `points` | `Point[]` |  |

**Returns:** `Interpolator&lt;Point&gt;`

---

### interpolatePath `function`

Creates an interpolator that progressively reveals a path from start to end as position advances from 0 to 1.

```ts
function interpolatePath(points: Point[]): Interpolator<Point[]>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `points` | `Point[]` |  |

**Returns:** `Interpolator&lt;Point[]&gt;`

---

### interpolatePolygonPoint `function`

Creates an interpolator that traces a point around the vertices of a regular polygon.

```ts
function interpolatePolygonPoint(
    sides: number,
    cx: number,
    cy: number,
    radius: number,
    closePath: boolean = true
): Interpolator<Point>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `sides` | `number` |  |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radius` | `number` |  |
| `closePath` | `boolean` |  |

**Returns:** `Interpolator&lt;Point&gt;`

---

### interpolateCirclePoint `function`

Creates an interpolator that traces a point around a circle of the given centre and radius.

```ts
function interpolateCirclePoint(
    cx: number,
    cy: number,
    radius: number
): Interpolator<Point>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `cx` | `number` |  |
| `cy` | `number` |  |
| `radius` | `number` |  |

**Returns:** `Interpolator&lt;Point&gt;`

---

### interpolateString `function`

Creates a string interpolator by interpolating between numeric values embedded in tagged template literals.

```ts
function interpolateString(callback: (tag: typeof tagIntStr) => StringInterpolationSet, formatter?: StringInterpolationFormatter): Interpolator<string>
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `callback` | `(tag: typeof tagIntStr) =&gt; StringInterpolationSet` |  |
| `formatter` | `StringInterpolationFormatter \| undefined` |  |

**Returns:** `Interpolator&lt;string&gt;`

---

### interpolateAny `const`

Fallback interpolator factory that snaps from the first value to the second at the halfway point.

```ts
const interpolateAny: InterpolatorFactory<unknown>
```

---

### interpolateColor `const`

Interpolator factory that smoothly transitions between two CSS color strings by interpolating their RGBA channels.

```ts
const interpolateColor: InterpolatorFactory<string>
```

---

### interpolateDate `const`

Interpolator factory that interpolates between two `Date` instances by lerping their timestamps.

```ts
const interpolateDate: InterpolatorFactory<Date>
```

---

### interpolateGradient `const`

Interpolator factory that transitions between two CSS gradient strings by interpolating their stops, angles, and positions.

```ts
const interpolateGradient: InterpolatorFactory<string>
```

---

### interpolateNumber `const`

Interpolator factory that linearly interpolates between two numbers.

```ts
const interpolateNumber: InterpolatorFactory<number>
```

---

### interpolatePoints `const`

Interpolator factory that transitions between two point arrays, extrapolating additional points where set lengths differ.

```ts
const interpolatePoints: InterpolatorFactory<Point[]>
```

---

### interpolateBorderRadius `const`

Interpolator factory that transitions between two border-radius values (single number or four-corner tuple).

```ts
const interpolateBorderRadius: InterpolatorFactory<BorderRadius, number | BorderRadius>
```

---

### interpolateRotation `const`

Interpolator factory that transitions between two rotation values (numbers in radians or strings like `"90deg"`).

```ts
const interpolateRotation: InterpolatorFactory<string | number>
```

---

### interpolateTransformOrigin `const`

Interpolator factory that transitions between two transform-origin values (numbers or percentage strings).

```ts
const interpolateTransformOrigin: InterpolatorFactory<string | number>
```

---

