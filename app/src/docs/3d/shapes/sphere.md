---
title: Sphere
---

# Sphere

The **Sphere** is a 3D primitive generated from configurable ring and segment counts. Higher values produce smoother surfaces at the cost of more faces. Like all 3D shapes, it supports positioning, rotation, and automatic flat shading.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/3d/shapes).

## Usage

```ts
import {
    createSphere,
} from '@ripl/3d';

const sphere = createSphere({
    radius: 1,
    segments: 16,
    rings: 12,
    fill: '#44cc88',
});
```

## Properties

- **`radius`** — Radius of the sphere
- **`segments`** — Number of horizontal segments (default `16`)
- **`rings`** — Number of vertical rings (default `12`)
- **`x`** / **`y`** / **`z`** — Position in world space (default `0`)
- **`rotationX`** / **`rotationY`** / **`rotationZ`** — Rotation around each axis in radians (default `0`)

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged"></ripl-3d-example>
== Code
```ts
import {
    createCamera,
    createContext,
    createSphere,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
});

const sphere = createSphere({
    radius: 1.2,
    fill: '#44cc88',
});

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
import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createSphere,
} from '@ripl/3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createSphere({ radius: 1.2, fill: '#44cc88' }));
    startRotation(camera);
});
</script>
