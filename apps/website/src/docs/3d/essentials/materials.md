---
title: Materials
outline: "deep"
---

# Materials

A **material** describes how a surface responds to light: its colour, how sharply it catches a highlight, whether it emits light of its own, which of its faces are drawn, and whether it is shaded smoothly or faceted.

Every property is optional. An element with only a `fill` behaves exactly as it always has, so materials are something you reach for when you want more, not something you have to configure.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged">
    <template #header>
        <RiplControlGroup>
            <RiplSwitch v-model="flatShading" label="Flat" />
            <RiplSwitch v-model="wireframe" label="Wireframe" />
            <label class="ripl-example__label">Shine</label>
            <RiplInputRange v-model="shininess" :min="0" :max="120" :step="1" />
        </RiplControlGroup>
    </template>
</ripl-3d-example>
== Code
```ts
import {
    createContext,
    createSphere,
} from '@ripl/3d';

const context = createContext('.mount-element');

const sphere = createSphere({
    radius: 1.2,
    material: {
        color: '#c0c0c0',
        specular: '#ffffff',
        shininess: 48,
    },
});
```
:::

## Usage

```ts
import {
    createMaterial,
    createSphere,
} from '@ripl/3d';

const sphere = createSphere({
    radius: 1,
    material: createMaterial({
        color: '#b87333',
        specular: '#ffd9a0',
        shininess: 64,
        emissive: '#200800',
    }),
});
```

## Properties

- **`color`**: the surface's own colour. Falls back to the element's `fill`, then to a neutral grey
- **`opacity`**: the surface's opacity from `0` to `1`, multiplying the colour's own alpha (default `1`)
- **`specular`**: the colour of specular highlights (default black, which disables them)
- **`shininess`**: the Blinn-Phong specular exponent; higher is tighter. `0` disables highlights (default `0`)
- **`emissive`**: light the surface emits regardless of illumination (default black)
- **`emissiveIntensity`**: a multiplier on `emissive` (default `1`)
- **`side`**: `'front'`, `'back'` or `'double'` — which faces are drawn (default `'double'`)
- **`wireframe`**: draws the surface as edges only, with no fill (default `false`)
- **`flatShading`**: shades each face by its own normal rather than its vertex normals (default `false`)
- **`vertexColors`**: uses each face's `colors` in place of the surface colour (default `false`)
- **`map`**: an image mapped across the surface — see [Textures](/docs/3d/essentials/textures)

> [!TIP]
> A material is read as a plain value, not observed. Assign a new object to change it — mutating the existing one in place will not repaint.

## Smooth and flat shading

`Sphere`, `Cylinder`, `Cone` and `Torus` emit per-vertex normals, so they shade smoothly by default. Set `flatShading: true` for a faceted, low-poly look.

```ts
createSphere({
    radius: 1,
    segments: 12,
    rings: 8,
    material: {
        flatShading: true,
    },
});
```

The GPU interpolates vertex normals across each face. The Canvas painter fills flat polygons and so shades from their average — closer to the true surface than the face normal, but still one colour per face. Raising the segment count narrows the difference.

## Which side is drawn

By default both facings are drawn, matching the behaviour before materials existed. That is the right default for a shape whose winding you do not control, but it means the hidden faces of a closed solid are still filled — which shows through when `opacity` is below `1`.

```ts
createSphere({
    radius: 1,
    material: {
        opacity: 0.4,
        side: 'front',
    },
});
```

| Value | Draws |
|-------|-------|
| `'double'` | Every face (default) |
| `'front'` | Only faces wound counter-clockwise towards the camera |
| `'back'` | Only faces wound away from the camera |

## Per-vertex colours

A face can carry one colour per vertex, which the GPU interpolates across it. This is how a height colormap or a gradient-shaded mesh is built from a single element.

```ts
const mesh = createMesh({
    faces: [
        {
            vertices: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]],
            colors: ['#ff0000', '#ffff00', '#00ff00', '#0000ff'],
        },
    ],
    material: {
        vertexColors: true,
    },
});
```

The Canvas painter averages a face's colours, since it can only express one fill per face — so a mesh relying on this wants enough subdivision that each face is close to a single colour.

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createAmbientLight,
    createDirectionalLight,
    createSphere,
} from '@ripl/3d';

import type {
    Sphere,
} from '@ripl/3d';

const flatShading = ref(false);
const wireframe = ref(false);
const shininess = ref(48);

const spheres: Sphere[] = [];

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.context.lights.clear();
    scene.context.lights.add(
        createAmbientLight({ color: '#334466', intensity: 0.3 }),
        createDirectionalLight({ direction: [-0.8, -0.9, -0.6], color: '#fff4e6', intensity: 0.85 }),
    );

    spheres.length = 0;
    spheres.push(
        createSphere({ x: -1.6, radius: 0.9, segments: 32, rings: 24, fill: '#b87333' }),
        createSphere({ x: 0, radius: 0.9, segments: 32, rings: 24, fill: '#7f9ec4' }),
        createSphere({ x: 1.6, radius: 0.9, segments: 32, rings: 24, fill: '#5c9e78' }),
    );

    scene.add(spheres);
    applyMaterial();
    startRotation(camera, 0.003);
});

function applyMaterial() {
    spheres.forEach((sphere, index) => {
        sphere.material = {
            specular: '#ffffff',
            shininess: shininess.value * (index + 1) / 2,
            flatShading: flatShading.value,
            wireframe: wireframe.value,
        };
    });
}

watch([flatShading, wireframe, shininess], applyMaterial);
</script>
