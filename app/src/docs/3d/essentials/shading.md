---
title: Shading
---

# Shading

The `@ripl/3d` package includes flat shading utilities that compute face brightness based on surface normals and a light direction vector.

## Functions

### computeFaceNormal

Computes the surface normal of a face from its vertices using the cross product of two edges.

```ts
import { computeFaceNormal } from '@ripl/3d';

const normal = computeFaceNormal([
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
]);
// [0, 0, 1]
```

### computeFaceBrightness

Returns a brightness value between 0 and 1 based on the angle between the face normal and the light direction.

```ts
import { computeFaceBrightness } from '@ripl/3d';

const brightness = computeFaceBrightness(
    [0, 0, -1], // face normal
    [0, 0, 1],  // light direction
);
// 1.0 (face directly facing the light)
```

### shadeFaceColor

Scales an RGB color string by a brightness factor.

```ts
import { shadeFaceColor } from '@ripl/3d';

const color = shadeFaceColor('rgb(200, 100, 50)', 0.5);
// 'rgb(100, 50, 25)'
```

## Automatic Shading

`Shape3D` elements automatically apply flat shading during rendering. The light direction is read from `context.lightDirection` (defaults to `[0, 0, -1]`).

```ts
context.lightDirection = [1, -1, -1]; // top-right light
```

## Demo

Two cubes rendered with different light directions to illustrate how shading changes.

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged"></ripl-3d-example>
== Code
```ts
import { createContext, createCube, createCamera } from '@ripl/3d';

const context = createContext('.mount-element');
context.lightDirection = [-1, -1, -1];

const cubeLeft = createCube({ x: -1.5, size: 1.5, fillStyle: '#4488ff' });
const cubeRight = createCube({ x: 1.5, size: 1.5, fillStyle: '#ff6644' });

// Rotate camera around the scene
let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 6, 2, Math.cos(angle) * 6];
    camera.flush();

    context.lightDirection = [-1, -1, -1];
    context.clear();
    context.markRenderStart();
    cubeLeft.render(context);

    context.lightDirection = [1, -1, 1];
    cubeRight.render(context);
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
    scene.context.lightDirection = [-1, -1, -1];
    scene.add(createCube({ x: -1.5, size: 1.5, fillStyle: '#4488ff' }));
    scene.add(createCube({ x: 1.5, size: 1.5, fillStyle: '#ff6644' }));
    startRotation(camera);
});
</script>
