---
title: Sphere
description: "The Sphere 3D primitive, tessellated from the segment and ring counts you set, with x/y/z world placement, per-axis rotation and automatic flat shading."
---

# Sphere

The **Sphere** is a 3D primitive tessellated from `rings` (default `12`) and `segments` (default `16`). Raising either smooths the surface and adds faces to sort and shade.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

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
const camera = createCamera(context, {
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
    context.batch(() => {
        sphere.render(context);
    });
    requestAnimationFrame(loop);
}
loop();
```
:::

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

- **`radius`**: radius of the sphere
- **`segments`**: number of horizontal segments (default `16`)
- **`rings`**: number of vertical rings (default `12`)
- **`x`** / **`y`** / **`z`**: position in world space (default `0`)
- **`rotationX`** / **`rotationY`** / **`rotationZ`**: rotation around each axis in radians (default `0`)
- **`scaleX`** / **`scaleY`** / **`scaleZ`**: scale along each axis (default `1`), or **`scale`** for all three
- **`material`**: how the surface responds to light — see [Materials](/docs/3d/essentials/materials)

## Type Guard

```ts
import {
    elementIsSphere,
} from '@ripl/3d';

if (elementIsSphere(element)) {
    console.log(element.radius);
}
```

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
