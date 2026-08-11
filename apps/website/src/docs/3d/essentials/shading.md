---
title: Shading
description: "How @ripl/3d turns light into pixel colour: the default light rig, the lightDirection shorthand, and the helpers that compute normals and brightness by hand."
---

# Shading

Every 3D context starts with a default rig: one ambient light and one directional light. `context.lightDirection` and `context.lightMode` steer that directional light, which is why a scene shades sensibly before you configure anything.

That rig is a starting point, not the whole model. Passing [`lights`](/docs/3d/essentials/lighting) replaces it, and the two shorthands go inert once it does — set the light's own `direction` and `space` instead. How a surface responds to the result is a property of its [material](/docs/3d/essentials/materials): shading is smooth by default, and `flatShading: true` opts a surface into per-face normals.

The helpers below compute normals, brightness and shaded colours directly, for custom geometry that shades itself.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Demo

Two cubes rendered with different light directions to illustrate how shading changes.

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
context.lightDirection = [-1, -1, -1];
context.lightMode = 'camera';

const cubeLeft = createCube({
    x: -1.5,
    size: 1.5,
    fill: '#4488ff',
});
const cubeRight = createCube({
    x: 1.5,
    size: 1.5,
    fill: '#ff6644',
});

// Rotate camera around the scene
let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 6, 2, Math.cos(angle) * 6];
    camera.flush();

    context.batch(() => {
        context.lightDirection = [-1, -1, -1];
        cubeLeft.render(context);

        context.layer(() => {
            context.lightDirection = [1, -1, 1];
            cubeRight.render(context);
        });
    });
    requestAnimationFrame(loop);
}
loop();
```
:::

## Functions

### computeFaceNormal

Computes the surface normal of a face from its vertices using the cross product of two edges.

```ts
import {
    computeFaceNormal,
} from '@ripl/3d';

const normal = computeFaceNormal([
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
]);
// [0, 0, 1]
```

### computeFaceBrightness

Returns a brightness value between 0 and 1 based on the angle between the face normal and the light direction.

```ts
import {
    computeFaceBrightness,
} from '@ripl/3d';

const brightness = computeFaceBrightness(
    [0, 0, -1], // face normal
    [0, 0, 1] // light direction
);
// 1.0 (face directly facing the light)
```

### shadeFaceColor

Scales an RGB color string by a brightness factor.

```ts
import {
    shadeFaceColor,
} from '@ripl/3d';

const color = shadeFaceColor('rgb(200, 100, 50)', 0.5);
// 'rgb(100, 50, 25)'
```

## Automatic Shading

`Shape3D` elements automatically apply flat shading during rendering. The light direction is read from `context.lightDirection` (defaults to `LIGHT_DIRECTION.topLeftFront`, the normalized `[-1, -1, -1]`).

```ts
context.lightDirection = [1, -1, -1]; // top-right light
```

## Light Modes

`context.lightMode` decides what `lightDirection` is measured against.

| Mode | Behaviour |
|--------|-----------|
| `'world'` (default) | The light is fixed in world space. A face keeps its brightness wherever the camera moves, so the highlight stays anchored to the geometry and only changes when the object itself rotates. |
| `'camera'` | The light is locked to the viewer, like a headlight. Whichever face is turned towards the camera is the brightest, so a shape stays readable from every angle. |

Pick the mode that matches what moves. The demo above orbits the camera around two stationary
cubes, and nothing in the scene actually changes — under `'world'` the same faces would stay lit for
the whole orbit and the cubes would go dark as the camera swung behind the light, so it uses
`'camera'`. A scene that spins its objects under a static camera wants `'world'`, where the shading
sweeps across the faces as they turn.

> [!TIP]
> Avoid aiming a world-fixed light straight down an object's body diagonal. `[-1, -1, -1]` sits at
> exactly equal angles to a cube's `+X`, `+Y` and `+Z` faces, lighting all three identically and
> flattening the shape into an edgeless silhouette.

<script lang="ts" setup>
import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createCube,
} from '@ripl/3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.context.lightDirection = [-1, -1, -1];
    scene.add(createCube({ x: -1.5, size: 1.5, fill: '#4488ff' }));
    scene.add(createCube({ x: 1.5, size: 1.5, fill: '#ff6644' }));
    startRotation(camera);
});
</script>
