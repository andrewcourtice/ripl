---
title: Cube
---

# Cube

The **Cube** is a 3D box primitive with equal-length sides. It supports positioning via `x`, `y`, `z`, independent rotation around each axis, and automatic flat shading based on the context's light direction.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Usage

```ts
import {
    createCube,
} from '@ripl/3d';

const cube = createCube({
    x: 0,
    y: 0,
    z: 0,
    size: 2,
    fill: '#4488ff',
});
```

## Properties

- **`x`** / **`y`** / **`z`** — Position in world space (default `0`)
- **`size`** — Side length of the cube
- **`rotationX`** / **`rotationY`** / **`rotationZ`** — Rotation around each axis in radians (default `0`)
- **`fill`** — Base fill color (shading is applied per-face)

## Type Guard

```ts
import {
    elementIsCube,
} from '@ripl/3d';

if (elementIsCube(element)) {
    console.log(element.size);
}
```

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged"></ripl-3d-example>
== Code
```ts
import {
    createCamera,
    createContext,
    createCube,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
});

const cube = createCube({
    size: 1.5,
    fill: '#4488ff',
});

let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 5, 1.5, Math.cos(angle) * 5];
    camera.flush();
    context.batch(() => {
        cube.render(context);
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
    createCube,
} from '@ripl/3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createCube({ size: 1.5, fill: '#4488ff' }));
    startRotation(camera);
});
</script>
