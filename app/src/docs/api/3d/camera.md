---
outline: "deep"
---

# Camera

<p class="api-package-badge"><code>@ripl/3d</code></p>

Reactive camera system with orbit, pan, and zoom.

## Overview

**Classes:** [`Camera`](#camera)

**Interfaces:** [`CameraInteractionConfig`](#camerainteractionconfig) · [`CameraInteractions`](#camerainteractions) · [`CameraOptions`](#cameraoptions)

**Type Aliases:** [`CameraInteractionOption`](#camerainteractionoption)

**Functions:** [`createCamera`](#createcamera)

### Camera `class`

An interactive camera controlling the 3D context's view and projection, with mouse/touch orbit, pan, and zoom.

```ts
class Camera extends Disposer
```


**Constructor:**

**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `scene` | `Scene&lt;Context3D&gt;` |  |
| `options?` | `CameraOptions \| undefined` |  |

**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `position` | `Vector3` |  |
| `target` | `Vector3` |  |
| `up` | `Vector3` |  |
| `fov` | `number` |  |
| `near` | `number` |  |
| `far` | `number` |  |
| `projection` | `"perspective" \| "orthographic"` |  |

**Methods:**

#### `flush(): void`

Flushes pending camera changes to the 3D context's view and projection matrices.

#### `orbit(deltaTheta: number, deltaPhi: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `deltaTheta` | `number` |  |
| `deltaPhi` | `number` |  |

#### `pan(dx: number, dy: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `dx` | `number` |  |
| `dy` | `number` |  |

#### `zoom(delta: number): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `delta` | `number` |  |

#### `lookAt(target: Vector3): void`


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `target` | `Vector3` |  |

#### `dispose(): void`

Disposes all resources under the given key, or all resources if no key is provided.

---

### CameraInteractionConfig `interface`

Fine-grained configuration for a single camera interaction.

```ts
interface CameraInteractionConfig {
    enabled?: boolean;
    sensitivity?: number;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `enabled?` | `boolean \| undefined` |  |
| `sensitivity?` | `number \| undefined` |  |
---

### CameraInteractions `interface`

Configures which camera interactions (zoom, pivot, pan) are enabled.

```ts
interface CameraInteractions {
    zoom?: CameraInteractionOption;
    pivot?: CameraInteractionOption;
    pan?: CameraInteractionOption;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `zoom?` | `CameraInteractionOption \| undefined` |  |
| `pivot?` | `CameraInteractionOption \| undefined` |  |
| `pan?` | `CameraInteractionOption \| undefined` |  |
---

### CameraOptions `interface`

Options for constructing a camera, including position, projection type, and interaction config.

```ts
interface CameraOptions {
    position?: Vector3;
    target?: Vector3;
    up?: Vector3;
    fov?: number;
    near?: number;
    far?: number;
    projection?: 'perspective' | 'orthographic';
    interactions?: boolean | CameraInteractions;
}
```


**Properties:**

| Property | Type | Description |
| --- | --- | --- |
| `position?` | `Vector3 \| undefined` |  |
| `target?` | `Vector3 \| undefined` |  |
| `up?` | `Vector3 \| undefined` |  |
| `fov?` | `number \| undefined` |  |
| `near?` | `number \| undefined` |  |
| `far?` | `number \| undefined` |  |
| `projection?` | `"perspective" \| "orthographic" \| undefined` |  |
| `interactions?` | `boolean \| CameraInteractions \| undefined` |  |
---

### CameraInteractionOption `type`

A camera interaction can be enabled/disabled with a boolean or configured with sensitivity.

```ts
type CameraInteractionOption = boolean | CameraInteractionConfig;
```

---

### createCamera `function`

Factory function that creates a new `Camera` bound to a 3D scene.

```ts
function createCamera(scene: Scene<Context3D>, options?: CameraOptions): Camera;
```


**Parameters:**

| Name | Type | Description |
| --- | --- | --- |
| `scene` | `Scene&lt;Context3D&gt;` |  |
| `options` | `CameraOptions \| undefined` |  |

**Returns:** `Camera`

---

