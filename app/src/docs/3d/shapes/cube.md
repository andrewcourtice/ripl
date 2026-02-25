---
title: Cube
---

# Cube

A 3D cube (box) shape with equal-length sides.

## Usage

```ts
import { createCube } from '@ripl/3d';

const cube = createCube({
    x: 0,
    y: 0,
    z: 0,
    size: 2,
    fillStyle: '#4488ff',
});
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `x` | `number` | `0` | X position in world space |
| `y` | `number` | `0` | Y position in world space |
| `z` | `number` | `0` | Z position in world space |
| `size` | `number` | — | Side length of the cube |
| `rotationX` | `number` | `0` | Rotation around the X axis (radians) |
| `rotationY` | `number` | `0` | Rotation around the Y axis (radians) |
| `rotationZ` | `number` | `0` | Rotation around the Z axis (radians) |
| `fillStyle` | `string` | — | Base fill color (shading is applied per-face) |

## Type Guard

```ts
import { elementIsCube } from '@ripl/3d';

if (elementIsCube(element)) {
    console.log(element.size);
}
```

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged"></ripl-3d-example>
== Code
```ts
import { createContext, createCube, createCamera } from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, { position: [0, 1.5, 5], target: [0, 0, 0] });

const cube = createCube({ size: 1.5, fillStyle: '#4488ff' });

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
