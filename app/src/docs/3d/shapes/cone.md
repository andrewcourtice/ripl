---
title: Cone
---

# Cone

The **Cone** is a 3D primitive with a pointed apex and circular base. Segment count controls the smoothness of the base circle. Like all 3D shapes, it supports positioning, rotation, and automatic flat shading.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

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

- **`radius`** — Base radius
- **`height`** — Height from base to apex
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
    createCone,
    createContext,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, {
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
