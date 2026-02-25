---
title: Cylinder
---

# Cylinder

A 3D cylinder with configurable top and bottom radii (set different values for a truncated cone).

## Usage

```ts
import { createCylinder } from '@ripl/3d';

const cylinder = createCylinder({
    radiusTop: 1,
    radiusBottom: 1,
    height: 2,
    segments: 16,
    fillStyle: '#cc8844',
});
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `radiusTop` | `number` | — | Radius of the top cap |
| `radiusBottom` | `number` | — | Radius of the bottom cap |
| `height` | `number` | — | Height of the cylinder |
| `segments` | `number` | `16` | Number of radial segments |
| `x` | `number` | `0` | X position |
| `y` | `number` | `0` | Y position |
| `z` | `number` | `0` | Z position |
| `rotationX` | `number` | `0` | Rotation around X axis (radians) |
| `rotationY` | `number` | `0` | Rotation around Y axis (radians) |
| `rotationZ` | `number` | `0` | Rotation around Z axis (radians) |

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged"></ripl-3d-example>
== Code
```ts
import { createContext, createCylinder, createCamera } from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, { position: [0, 1.5, 5], target: [0, 0, 0] });

const cylinder = createCylinder({
    radiusTop: 0.8, radiusBottom: 0.8, height: 2,
    fillStyle: '#cc8844',
});

let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 5, 1.5, Math.cos(angle) * 5];
    camera.flush();
    context.clear();
    context.markRenderStart();
    cylinder.render(context);
    context.markRenderEnd();
    requestAnimationFrame(loop);
}
loop();
```
:::

<script lang="ts" setup>
import { createCylinder } from '@ripl/3d';
import { useRipl3DExample } from '../../../.vitepress/compositions/example-3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createCylinder({
        radiusTop: 0.8, radiusBottom: 0.8, height: 2,
        fillStyle: '#cc8844',
    }));
    startRotation(camera);
});
</script>
