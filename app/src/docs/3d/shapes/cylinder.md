---
title: Cylinder
---

# Cylinder

The **Cylinder** is a 3D primitive with configurable top and bottom radii — set different values to create a truncated cone. Segment count controls the smoothness of the circular cross-section. Like all 3D shapes, it supports positioning, rotation, and automatic flat shading.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/3d/shapes).

## Usage

```ts
import {
    createCylinder,
} from '@ripl/3d';

const cylinder = createCylinder({
    radiusTop: 1,
    radiusBottom: 1,
    height: 2,
    segments: 16,
    fill: '#cc8844',
});
```

## Properties

- **`radiusTop`** — Radius of the top cap
- **`radiusBottom`** — Radius of the bottom cap
- **`height`** — Height of the cylinder
- **`segments`** — Number of radial segments (default `16`)
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
    createCylinder,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
});

const cylinder = createCylinder({
    radiusTop: 0.8,
    radiusBottom: 0.8,
    height: 2,
    fill: '#cc8844',
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
import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createCylinder,
} from '@ripl/3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createCylinder({
        radiusTop: 0.8, radiusBottom: 0.8, height: 2,
        fill: '#cc8844',
    }));
    startRotation(camera);
});
</script>
