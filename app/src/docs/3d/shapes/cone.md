---
title: Cone
---

# Cone

A 3D cone with a pointed apex and circular base.

## Usage

```ts
import { createCone } from '@ripl/3d';

const cone = createCone({
    radius: 1,
    height: 2,
    segments: 16,
    fillStyle: '#cc4444',
});
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `radius` | `number` | — | Base radius |
| `height` | `number` | — | Height from base to apex |
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
import { createContext, createCone, createCamera } from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, { position: [0, 1.5, 5], target: [0, 0, 0] });

const cone = createCone({ radius: 1, height: 2, fillStyle: '#cc4444' });

let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 5, 1.5, Math.cos(angle) * 5];
    camera.flush();
    context.clear();
    context.markRenderStart();
    cone.render(context);
    context.markRenderEnd();
    requestAnimationFrame(loop);
}
loop();
```
:::

<script lang="ts" setup>
import { createCone } from '@ripl/3d';
import { useRipl3DExample } from '../../../.vitepress/compositions/example-3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createCone({ radius: 1, height: 2, fillStyle: '#cc4444' }));
    startRotation(camera);
});
</script>
