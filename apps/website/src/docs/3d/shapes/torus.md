---
title: Torus
description: "The Torus 3D primitive: a ring sized by major radius and tube radius, with radial and tubular segment counts, x/y/z placement, rotation and flat shading."
---

# Torus

The **Torus** is a ring-shaped 3D primitive: `radius` is the distance out to the tube's centre, `tube` its thickness, and `radialSegments` (default `12`) and `tubularSegments` (default `24`) its resolution.

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
    createTorus,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(context, {
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

- **`radius`**: distance from center of torus to center of tube
- **`tube`**: radius of the tube
- **`radialSegments`**: number of segments around the tube cross-section (default `12`)
- **`tubularSegments`**: number of segments around the torus ring (default `24`)
- **`x`** / **`y`** / **`z`**: position in world space (default `0`)
- **`rotationX`** / **`rotationY`** / **`rotationZ`**: rotation around each axis in radians (default `0`)
- **`scaleX`** / **`scaleY`** / **`scaleZ`**: scale along each axis (default `1`), or **`scale`** for all three
- **`material`**: how the surface responds to light — see [Materials](/docs/3d/essentials/materials)

## Type Guard

```ts
import {
    elementIsTorus,
} from '@ripl/3d';

if (elementIsTorus(element)) {
    console.log(element.tube);
}
```

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
