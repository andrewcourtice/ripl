---
title: Plane
---

# Plane

A flat rectangular 3D plane.

## Usage

```ts
import { createPlane } from '@ripl/3d';

const plane = createPlane({
    width: 4,
    height: 3,
    fillStyle: '#88cc44',
});
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number` | — | Width of the plane |
| `height` | `number` | — | Height of the plane |
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
import { createContext, createPlane, createCamera } from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, { position: [0, 1.5, 5], target: [0, 0, 0] });

const plane = createPlane({
    width: 3, height: 2,
    rotationX: 0.5,
    fillStyle: '#88cc44',
});

let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 5, 1.5, Math.cos(angle) * 5];
    camera.flush();
    context.clear();
    context.markRenderStart();
    plane.render(context);
    context.markRenderEnd();
    requestAnimationFrame(loop);
}
loop();
```
:::

<script lang="ts" setup>
import { createPlane } from '@ripl/3d';
import { useRipl3DExample } from '../../../.vitepress/compositions/example-3d';

const { contextChanged, startRotation } = useRipl3DExample((ctx, camera) => {
    const plane = createPlane({
        width: 3, height: 2,
        rotationX: 0.5,
        fillStyle: '#88cc44',
    });

    startRotation(camera, ctx, () => {
        plane.render(ctx);
    });
});
</script>
