---
title: Torus
---

# Torus

The **Torus** is a donut-shaped 3D primitive with configurable major radius, tube radius, and segment counts for both the ring and cross-section. Like all 3D shapes, it supports positioning, rotation, and automatic flat shading.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/3d/shapes).

## Usage

```ts
import {
    createTorus,
} from '@ripl/3d';

const torus = createTorus({
    radius: 2,
    tube: 0.5,
    radialSegments: 12,
    tubularSegments: 24,
    fill: '#8844cc',
});
```

## Properties

- **`radius`** — Distance from center of torus to center of tube
- **`tube`** — Radius of the tube
- **`radialSegments`** — Number of segments around the tube cross-section (default `12`)
- **`tubularSegments`** — Number of segments around the torus ring (default `24`)
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
    createTorus,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
});

const torus = createTorus({
    radius: 1.5,
    tube: 0.4,
    fill: '#8844cc',
});

let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 5, 1.5, Math.cos(angle) * 5];
    camera.flush();
    context.batch(() => {
        torus.render(context);
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
    createTorus,
} from '@ripl/3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createTorus({ radius: 1.5, tube: 0.4, fill: '#8844cc' }));
    startRotation(camera);
});
</script>
