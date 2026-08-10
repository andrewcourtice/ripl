---
title: Plane
description: "The Plane 3D primitive: a flat rectangle sized by width and height, for ground surfaces and walls, with x/y/z placement, per-axis rotation and flat shading."
---

# Plane

The **Plane** is a flat rectangle in 3D, sized by `width` and `height`. Lay it down with `rotationX` for a ground surface or leave it upright for a wall or backdrop; either way its single face is flat shaded.

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
    createPlane,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(context, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
});

const plane = createPlane({
    width: 3,
    height: 2,
    rotationX: 0.5,
    fill: '#88cc44',
});

let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 5, 1.5, Math.cos(angle) * 5];
    camera.flush();
    context.batch(() => {
        plane.render(context);
    });
    requestAnimationFrame(loop);
}
loop();
```
:::

## Usage

```ts
import {
    createPlane,
} from '@ripl/3d';

const plane = createPlane({
    width: 4,
    height: 3,
    fill: '#88cc44',
});
```

## Properties

- **`width`**: width of the plane
- **`height`**: height of the plane
- **`x`** / **`y`** / **`z`**: position in world space (default `0`)
- **`rotationX`** / **`rotationY`** / **`rotationZ`**: rotation around each axis in radians (default `0`)

<script lang="ts" setup>
import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createPlane,
} from '@ripl/3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createPlane({
        width: 3, height: 2,
        rotationX: 0.5,
        fill: '#88cc44',
    }));
    startRotation(camera);
});
</script>
