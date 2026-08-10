---
title: Raycasting
---

# Raycasting

**Raycasting** casts a ray into the scene and reports what it meets — the shape, the exact point, the face, its normal and its texture coordinate. Pointer events raycast too, but only ever answer *which* shape; this is how you get the rest.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged">
    <template #footer>
        <span>{{ readout }}</span>
    </template>
</ripl-3d-example>
== Code
```ts
import {
    createContext,
    createTorus,
} from '@ripl/3d';

const context = createContext('.mount-element');
const torus = createTorus({ radius: 1.6, tube: 0.5 });

scene.add(torus);

context.element.addEventListener('pointermove', event => {
    const bounds = context.element.getBoundingClientRect();
    const [hit] = context.raycastAll(scene, event.clientX - bounds.left, event.clientY - bounds.top);

    if (hit) {
        console.log(hit.point, hit.normal, hit.uv);
    }
});
```
:::

## Casting a ray

`context.raycast(x, y)` builds the world-space ray through a point on the surface, in the same logical CSS pixels the pointer reports. It is correct under both perspective and orthographic projection — an orthographic ray is parallel to the view direction rather than fanning from an eye point.

```ts
const ray = context.raycast(pointerX, pointerY);
```

`context.raycastAll(scene, x, y)` casts that ray and returns every shape it meets, nearest first, reaching through nested groups.

```ts
const hits = context.raycastAll(scene, pointerX, pointerY);
```

A single shape can be tested directly:

```ts
const hit = torus.raycast(ray, { backFaces: false });
```

## What a hit reports

- **`element`**: the shape that was hit
- **`distance`**: distance along the ray, in world units
- **`point`**: the world-space point of the hit
- **`face`**: the face that was hit
- **`faceIndex`**: its index within the shape's face list
- **`normal`**: the world-space surface normal, interpolated when the face carries vertex normals
- **`uv`**: the texture coordinate at the hit, when the face carries UVs
- **`backFacing`**: whether the triangle was met from behind

## Why not just use pointer events

3D shapes support the ordinary pointer events, and for most interactions those are the right tool — they need no wiring, and they raycast too: a pointer over the hole of a torus passes through it, and where two parts overlap the nearer one wins.

What they cannot give you is the hit itself. `mouseenter` says *that* a shape was hit, not where, on which face, at what texture coordinate, or how far along the ray. Reach for `raycast` when you need any of that — placing a marker on a surface, reading a value off a plot, aligning something to the normal at the hit — or when you want to query the scene without a pointer at all.

Two things pointer events do not honour, because they have no meaning for a solid: `pointerEvents: 'fill'` and `'stroke'` are both treated as `'all'`. `'none'` still opts a shape out entirely.

<script lang="ts" setup>
import {
    onUnmounted,
    ref,
} from 'vue';

import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createAmbientLight,
    createDirectionalLight,
    createTorus,
} from '@ripl/3d';

const readout = ref('Move the pointer over the torus');

let detach: (() => void) | undefined;

const { contextChanged } = useRipl3DExample((scene, camera) => {
    scene.context.lights.clear();
    scene.context.lights.add(
        createAmbientLight({ intensity: 0.35 }),
        createDirectionalLight({ direction: [-0.6, -0.9, -0.5], intensity: 0.75 }),
    );

    scene.add(createTorus({
        radius: 1.5,
        tube: 0.45,
        radialSegments: 20,
        tubularSegments: 48,
        rotationX: 1,
        fill: '#7f9ec4',
    }));

    camera.position = [0, 2.2, 4.4];
    camera.flush();

    const element = scene.context.element;

    const onMove = (event: PointerEvent) => {
        const bounds = element.getBoundingClientRect();
        const [hit] = scene.context.raycastAll(scene, event.clientX - bounds.left, event.clientY - bounds.top);

        readout.value = hit
            ? `hit at ${hit.point.map(value => value.toFixed(2)).join(', ')} — uv ${hit.uv?.map(value => value.toFixed(2)).join(', ')}`
            : 'no hit — the ray passed through';
    };

    element.addEventListener('pointermove', onMove);

    detach?.();
    detach = () => element.removeEventListener('pointermove', onMove);
});

onUnmounted(() => detach?.());
</script>
