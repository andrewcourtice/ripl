---
title: Bezier Surface
---

# Bezier Surface

The **BezierSurface** is tessellated from one or more bicubic Bézier patches. Each patch is sixteen control points: the surface passes through the four corners and is pulled towards the twelve interior points, so a shape is edited by moving points rather than by writing a formula.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged"></ripl-3d-example>
== Code
```ts
import {
    createBezierSurface,
} from '@ripl/3d';

const surface = createBezierSurface({
    patches: [patch],
    segments: 12,
    fill: '#8844cc',
});
```
:::

## Properties

- **`patches`**: the patches to tessellate, held by reference and never copied
- **`segments`**: subdivisions along each parameter of every patch (default `8`)
- **`revision`**: a counter bumped whenever the patch list is replaced

A patch is a flat array of sixteen `Vector3` control points in row-major order.

## Evaluating a patch directly

```ts
import {
    bernstein3,
    evaluateBezierPatch,
} from '@ripl/3d';

const point = evaluateBezierPatch(patch, 0.5, 0.5);
const weights = bernstein3(0.25);
```

## Type Guard

```ts
import {
    elementIsBezierSurface,
} from '@ripl/3d';

if (elementIsBezierSurface(element)) {
    console.log(element.patches.length);
}
```

<script lang="ts" setup>
import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createBezierSurface,
} from '@ripl/3d';

import type {
    BezierPatch,
    Vector3,
} from '@ripl/3d';

function createSaddlePatch(): BezierPatch {
    const points: Vector3[] = [];

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const x = (col / 3) * 3 - 1.5;
            const z = (row / 3) * 3 - 1.5;

            points.push([x, (x * x - z * z) * 0.35, z]);
        }
    }

    return points as BezierPatch;
}

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createBezierSurface({
        patches: [createSaddlePatch()],
        segments: 16,
        fill: '#8844cc',
    }));

    startRotation(camera);
});
</script>
