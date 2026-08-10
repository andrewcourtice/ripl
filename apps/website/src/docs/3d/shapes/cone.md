---
title: Cone
description: "The Cone 3D primitive: a pointed apex over a circular base whose segment count sets its smoothness, with x/y/z placement, per-axis rotation and flat shading."
---

# Cone

The **Cone** is a 3D primitive with a pointed apex over a circular base. `segments` (default `16`) sets how many triangles wrap that base, and each face is flat shaded from its own normal.

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
    createCone,
    createContext,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(context, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
});

const cone = createCone({
    radius: 1,
    height: 2,
    fill: '#cc4444',
});

let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 5, 1.5, Math.cos(angle) * 5];
    camera.flush();
    context.batch(() => {
        cone.render(context);
    });
    requestAnimationFrame(loop);
}
loop();
```
:::

## Usage

```ts
import {
    createCone,
} from '@ripl/3d';

const cone = createCone({
    radius: 1,
    height: 2,
    segments: 16,
    fill: '#cc4444',
});
```

## Properties

- **`radius`**: base radius
- **`height`**: height from base to apex
- **`segments`**: number of radial segments (default `16`)
- **`x`** / **`y`** / **`z`**: position in world space (default `0`)
- **`rotationX`** / **`rotationY`** / **`rotationZ`**: rotation around each axis in radians (default `0`)
- **`scaleX`** / **`scaleY`** / **`scaleZ`**: scale along each axis (default `1`), or **`scale`** for all three
- **`material`**: how the surface responds to light — see [Materials](/docs/3d/essentials/materials)

## Type Guard

```ts
import {
    elementIsCone,
} from '@ripl/3d';

if (elementIsCone(element)) {
    console.log(element.height);
}
```

<script lang="ts" setup>
import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createCone,
} from '@ripl/3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createCone({ radius: 1, height: 2, fill: '#cc4444' }));
    startRotation(camera);
});
</script>
