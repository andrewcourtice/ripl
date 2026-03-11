---
title: Plane
---

# Plane

The **Plane** is a flat rectangular 3D primitive. It's useful as a ground surface, wall, or any flat element in a 3D scene. Like all 3D shapes, it supports positioning, rotation, and automatic flat shading.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/3d/shapes).

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

- **`width`** — Width of the plane
- **`height`** — Height of the plane
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
    createPlane,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, {
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
