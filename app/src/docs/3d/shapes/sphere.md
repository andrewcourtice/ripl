---
title: Sphere
---

# Sphere

A 3D sphere generated from configurable ring and segment counts.

## Usage

```ts
import { createSphere } from '@ripl/3d';

const sphere = createSphere({
    radius: 1,
    segments: 16,
    rings: 12,
    fillStyle: '#44cc88',
});
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `radius` | `number` | — | Radius of the sphere |
| `segments` | `number` | `16` | Number of horizontal segments |
| `rings` | `number` | `12` | Number of vertical rings |
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
import { createContext, createSphere, createCamera } from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, { position: [0, 1.5, 5], target: [0, 0, 0] });

const sphere = createSphere({ radius: 1.2, fillStyle: '#44cc88' });

let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 5, 1.5, Math.cos(angle) * 5];
    camera.flush();
    context.clear();
    context.markRenderStart();
    sphere.render(context);
    context.markRenderEnd();
    requestAnimationFrame(loop);
}
loop();
```
:::

<script lang="ts" setup>
import { createSphere } from '@ripl/3d';
import { useRipl3DExample } from '../../../.vitepress/compositions/example-3d';

const { contextChanged, startRotation } = useRipl3DExample((ctx, camera) => {
    const sphere = createSphere({ radius: 1.2, fillStyle: '#44cc88' });

    startRotation(camera, ctx, () => {
        sphere.render(ctx);
    });
});
</script>
