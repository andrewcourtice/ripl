---
title: Context3D
---

# Context3D

`Context3D` extends `CanvasContext` with 3D projection capabilities. It manages view, projection, and combined view-projection matrices, and provides methods to project 3D points onto the 2D canvas.

## Creation

```ts
import { createContext } from '@ripl/3d';

const context = createContext('#app');
```

Or with options:

```ts
const context = createContext('#app', {
    fov: 60,
    near: 0.1,
    far: 1000,
});
```

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `viewMatrix` | `Matrix4` | The current view (camera) matrix |
| `projectionMatrix` | `Matrix4` | The current projection matrix |
| `viewProjectionMatrix` | `Matrix4` | Combined view × projection matrix |
| `lightDirection` | `Vector3` | Direction of the light source for shading |

## Methods

### setCamera

Sets the view matrix from eye position, target, and up vector.

```ts
context.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);
```

### setPerspective

Updates the perspective projection.

```ts
context.setPerspective(fov, near, far);
```

### setOrthographic

Switches to orthographic projection.

```ts
context.setOrthographic(left, right, bottom, top, near, far);
```

### project

Projects a 3D point to 2D canvas coordinates.

```ts
const [x, y] = context.project([1, 2, 3]);
```

### projectDepth

Returns the projected depth of a 3D point (used for sorting).

```ts
const depth = context.projectDepth([1, 2, 3]);
```

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged"></ripl-3d-example>
== Code
```ts
import { createContext, createCube, createCamera } from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
});

const cube = createCube({ size: 1.5, fillStyle: '#4488ff' });

// Render loop with auto-rotation
let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 5, 1.5, Math.cos(angle) * 5];
    camera.flush();
    context.clear();
    context.markRenderStart();
    cube.render(context);
    context.markRenderEnd();
    requestAnimationFrame(loop);
}
loop();
```
:::

<script lang="ts" setup>
import { createCube } from '@ripl/3d';
import { useRipl3DExample } from '../../../.vitepress/compositions/example-3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createCube({ size: 1.5, fillStyle: '#4488ff' }));
    startRotation(camera);
});
</script>
