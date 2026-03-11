---
outline: "deep"
---

# Shading

<p class="api-package-badge"><code>@ripl/3d</code></p>

Flat shading utilities based on face normals and light direction.

## Overview

**Functions:** [`computeFaceNormal`](#computefacenormal) · [`computeFaceBrightness`](#computefacebrightness) · [`shadeFaceColor`](#shadefacecolor)

### computeFaceNormal `function`

Computes the surface normal of a face from its first three vertices via the cross product.

```ts
function computeFaceNormal(vertices: Vector3[]): Vector3;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `vertices` | `Vector3[]` |  |

**Returns:** `Vector3`

---

### computeFaceBrightness `function`

Computes a 0–1 brightness value for a face given its normal and a light direction.

```ts
function computeFaceBrightness(normal: Vector3, lightDirection: Vector3, normalized?: boolean): number;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `normal` | `Vector3` |  |
| `lightDirection` | `Vector3` |  |
| `normalized` | `boolean \| undefined` |  |

**Returns:** `number`

---

### shadeFaceColor `function`

Shades a color by a brightness factor (0–1), darkening or lightening the RGB channels.

```ts
function shadeFaceColor(baseColor: string, brightness: number): string;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `baseColor` | `string` |  |
| `brightness` | `number` |  |

**Returns:** `string`

---

