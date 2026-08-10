---
title: Parametric
---

# Parametric

The **Parametric** surface is tessellated from a function of two parameters. Normals come from the analytic partial derivatives, so a smooth surface shades smoothly with no averaging pass, and the parameters themselves become the texture coordinates.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged"></ripl-3d-example>
== Code
```ts
import {
    createParametric,
} from '@ripl/3d';

const ripple = createParametric({
    surface: (u, v) => {
        const x = u * 4 - 2;
        const z = v * 4 - 2;
        const radius = Math.sqrt(x * x + z * z);

        return [x, Math.sin(radius * 4) / (1 + radius * 2), z];
    },
    uSegments: 48,
    vSegments: 48,
    fill: '#6366f1',
});
```
:::

## Properties

- **`surface`**: the function to tessellate, mapping `(u, v)` in `0`–`1` to a world-space point
- **`uSegments`**: subdivisions along the first parameter (default `24`)
- **`vSegments`**: subdivisions along the second parameter (default `24`)
- **`revision`**: a counter bumped whenever the surface function is replaced

## Surfaces of revolution

Spinning a profile around an axis is the most common use, and covers any turned shape — a vase, a bowl, a lampshade.

```ts
const vase = createParametric({
    surface: (u, v) => {
        const angle = u * Math.PI * 2;
        const radius = 0.6 + Math.sin(v * Math.PI) * 0.5;

        return [Math.cos(angle) * radius, v * 3 - 1.5, Math.sin(angle) * radius];
    },
});
```

## Poles

A surface of revolution collapses to a point at each pole, where the two tangents are parallel and the normal is undefined. Rather than hand back a zero normal — which would shade the pole black — the normal is taken a little way inside the domain, which for a smooth surface is the limit the pole is approaching.

## Replacing the surface

```ts
element.setSurface(nextSurface);
```

## Type Guard

```ts
import {
    elementIsParametric,
} from '@ripl/3d';

if (elementIsParametric(element)) {
    console.log(element.uSegments);
}
```

<script lang="ts" setup>
import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createParametric,
} from '@ripl/3d';

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createParametric({
        surface: (u, v) => {
            const x = u * 4 - 2;
            const z = v * 4 - 2;
            const radius = Math.sqrt(x * x + z * z);

            return [x, Math.sin(radius * 4) / (1 + radius * 2), z];
        },
        uSegments: 40,
        vSegments: 40,
        fill: '#6366f1',
    }));

    startRotation(camera);
});
</script>
