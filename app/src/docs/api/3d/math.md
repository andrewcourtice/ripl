---
outline: "deep"
---

# Math

<p class="api-package-badge"><code>@ripl/3d</code></p>

3D math utilities: vectors, matrices, and projections.

## Overview

**Interfaces:** [`Viewport`](#viewport)

**Type Aliases:** [`Vector3`](#vector3) · [`Matrix4`](#matrix4) · [`ProjectedPoint`](#projectedpoint)

**Functions:** [`vec3Add`](#vec3add) · [`vec3Sub`](#vec3sub) · [`vec3Scale`](#vec3scale) · [`vec3Dot`](#vec3dot) · [`vec3Cross`](#vec3cross) · [`vec3Length`](#vec3length) · [`vec3Normalize`](#vec3normalize) · [`vec3Lerp`](#vec3lerp) · [`vec3Negate`](#vec3negate) · [`vec3Distance`](#vec3distance) · [`typeIsVector3`](#typeisvector3) · [`mat4Create`](#mat4create) · [`mat4Identity`](#mat4identity) · [`mat4Clone`](#mat4clone) · [`mat4Multiply`](#mat4multiply) · [`mat4Translate`](#mat4translate) · [`mat4Scale`](#mat4scale) · [`mat4RotateX`](#mat4rotatex) · [`mat4RotateY`](#mat4rotatey) · [`mat4RotateZ`](#mat4rotatez) · [`mat4LookAt`](#mat4lookat) · [`mat4Perspective`](#mat4perspective) · [`mat4Orthographic`](#mat4orthographic) · [`mat4TransformPoint`](#mat4transformpoint) · [`projectPoint`](#projectpoint)

### Viewport `interface`

Viewport dimensions used for projection.

```ts
interface Viewport {
    width: number;
    height: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `width` | `number` |  |
| `height` | `number` |  |
---

### Vector3 `type`

A 3-component vector represented as a labeled tuple [x, y, z].

```ts
type Vector3 = [x: number, y: number, z: number];
```

---

### Matrix4 `type`

A column-major 4×4 matrix stored as a 16-element `Float64Array`.

```ts
type Matrix4 = Float64Array;
```

---

### ProjectedPoint `type`

A 2D screen-space point with a depth component for z-ordering.

```ts
type ProjectedPoint = [x: number, y: number, depth: number];
```

---

### vec3Add `function`

Returns the component-wise sum of two vectors.

```ts
function vec3Add(a: Vector3, b: Vector3): Vector3
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `Vector3` |  |
| `b` | `Vector3` |  |

**Returns:** `Vector3`

---

### vec3Sub `function`

Returns the component-wise difference of two vectors.

```ts
function vec3Sub(a: Vector3, b: Vector3): Vector3
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `Vector3` |  |
| `b` | `Vector3` |  |

**Returns:** `Vector3`

---

### vec3Scale `function`

Scales a vector by a scalar.

```ts
function vec3Scale(v: Vector3, s: number): Vector3
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `v` | `Vector3` |  |
| `s` | `number` |  |

**Returns:** `Vector3`

---

### vec3Dot `function`

Computes the dot product of two vectors.

```ts
function vec3Dot(a: Vector3, b: Vector3): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `Vector3` |  |
| `b` | `Vector3` |  |

**Returns:** `number`

---

### vec3Cross `function`

Computes the cross product of two vectors.

```ts
function vec3Cross(a: Vector3, b: Vector3): Vector3
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `Vector3` |  |
| `b` | `Vector3` |  |

**Returns:** `Vector3`

---

### vec3Length `function`

Returns the Euclidean length of a vector.

```ts
function vec3Length(v: Vector3): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `v` | `Vector3` |  |

**Returns:** `number`

---

### vec3Normalize `function`

Returns the unit-length direction of a vector, or the zero vector if length is 0.

```ts
function vec3Normalize(v: Vector3): Vector3
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `v` | `Vector3` |  |

**Returns:** `Vector3`

---

### vec3Lerp `function`

Linearly interpolates between two vectors by factor `t`.

```ts
function vec3Lerp(a: Vector3, b: Vector3, t: number): Vector3
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `Vector3` |  |
| `b` | `Vector3` |  |
| `t` | `number` |  |

**Returns:** `Vector3`

---

### vec3Negate `function`

Negates all components of a vector.

```ts
function vec3Negate(v: Vector3): Vector3
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `v` | `Vector3` |  |

**Returns:** `Vector3`

---

### vec3Distance `function`

Returns the Euclidean distance between two points.

```ts
function vec3Distance(a: Vector3, b: Vector3): number
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `Vector3` |  |
| `b` | `Vector3` |  |

**Returns:** `number`

---

### typeIsVector3 `function`

Type guard that checks whether a value is a `Vector3` tuple.

```ts
function typeIsVector3(value: unknown): value is Vector3
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `value` | `unknown` |  |

**Returns:** `boolean`

---

### mat4Create `function`

Creates a zeroed 4×4 matrix.

```ts
function mat4Create(): Matrix4
```

**Returns:** `Matrix4`

---

### mat4Identity `function`

Creates a 4×4 identity matrix.

```ts
function mat4Identity(): Matrix4
```

**Returns:** `Matrix4`

---

### mat4Clone `function`

Returns a copy of the given matrix.

```ts
function mat4Clone(m: Matrix4): Matrix4
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `m` | `Matrix4` |  |

**Returns:** `Matrix4`

---

### mat4Multiply `function`

Multiplies two 4×4 matrices.

```ts
function mat4Multiply(a: Matrix4, b: Matrix4): Matrix4
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `a` | `Matrix4` |  |
| `b` | `Matrix4` |  |

**Returns:** `Matrix4`

---

### mat4Translate `function`

Applies a translation to a matrix.

```ts
function mat4Translate(m: Matrix4, v: Vector3): Matrix4
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `m` | `Matrix4` |  |
| `v` | `Vector3` |  |

**Returns:** `Matrix4`

---

### mat4Scale `function`

Applies a scale transform to a matrix.

```ts
function mat4Scale(m: Matrix4, v: Vector3): Matrix4
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `m` | `Matrix4` |  |
| `v` | `Vector3` |  |

**Returns:** `Matrix4`

---

### mat4RotateX `function`

Applies a rotation around the X axis to a matrix.

```ts
function mat4RotateX(m: Matrix4, angle: number): Matrix4
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `m` | `Matrix4` |  |
| `angle` | `number` |  |

**Returns:** `Matrix4`

---

### mat4RotateY `function`

Applies a rotation around the Y axis to a matrix.

```ts
function mat4RotateY(m: Matrix4, angle: number): Matrix4
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `m` | `Matrix4` |  |
| `angle` | `number` |  |

**Returns:** `Matrix4`

---

### mat4RotateZ `function`

Applies a rotation around the Z axis to a matrix.

```ts
function mat4RotateZ(m: Matrix4, angle: number): Matrix4
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `m` | `Matrix4` |  |
| `angle` | `number` |  |

**Returns:** `Matrix4`

---

### mat4LookAt `function`

Constructs a view matrix looking from `eye` toward `target` with the given `up` direction.

```ts
function mat4LookAt(eye: Vector3, target: Vector3, up: Vector3): Matrix4
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `eye` | `Vector3` |  |
| `target` | `Vector3` |  |
| `up` | `Vector3` |  |

**Returns:** `Matrix4`

---

### mat4Perspective `function`

Constructs a perspective projection matrix.

```ts
function mat4Perspective(fovRadians: number, aspect: number, near: number, far: number): Matrix4
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `fovRadians` | `number` |  |
| `aspect` | `number` |  |
| `near` | `number` |  |
| `far` | `number` |  |

**Returns:** `Matrix4`

---

### mat4Orthographic `function`

Constructs an orthographic projection matrix.

```ts
function mat4Orthographic(
    left: number,
    right: number,
    bottom: number,
    top: number,
    near: number,
    far: number
): Matrix4
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `left` | `number` |  |
| `right` | `number` |  |
| `bottom` | `number` |  |
| `top` | `number` |  |
| `near` | `number` |  |
| `far` | `number` |  |

**Returns:** `Matrix4`

---

### mat4TransformPoint `function`

Transforms a 3D point by a 4×4 matrix, performing the perspective divide.

```ts
function mat4TransformPoint(m: Matrix4, v: Vector3): Vector3
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `m` | `Matrix4` |  |
| `v` | `Vector3` |  |

**Returns:** `Vector3`

---

### projectPoint `function`

Projects a 3D world-space point onto 2D screen-space via a view-projection matrix and viewport.

```ts
function projectPoint(point: Vector3, viewProjection: Matrix4, viewport: Viewport): ProjectedPoint
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `point` | `Vector3` |  |
| `viewProjection` | `Matrix4` |  |
| `viewport` | `Viewport` |  |

**Returns:** `ProjectedPoint`

---

