---
title: Textures
description: Map images across 3D surfaces with configurable wrapping, filtering and UV transforms, sampled identically by the Canvas and WebGPU backends.
outline: "deep"
---

# Textures

A **texture** maps an image across a surface. Every built-in shape emits the texture coordinates to place it, and both backends sample the same texture from the same coordinates.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged">
    <template #header>
        <RiplControlGroup>
            <RiplSwitch v-model="textured" label="Texture" />
            <label class="ripl-example__label">Repeat</label>
            <RiplInputRange v-model="repeat" :min="1" :max="6" :step="1" />
        </RiplControlGroup>
    </template>
</ripl-3d-example>
== Code
```ts
import {
    createContext,
    createSphere,
    loadTexture,
} from '@ripl/3d';

const context = createContext('.mount-element');
const texture = await loadTexture('/earth.png');

const globe = createSphere({
    radius: 1.4,
    segments: 48,
    rings: 32,
    material: {
        map: texture,
    },
});
```
:::

## Creating a texture

A texture wraps anything a canvas can draw and a GPU can copy from — an `ImageBitmap`, an `<img>`, a `<canvas>`, an `OffscreenCanvas`, an `ImageData`, or a `<video>`.

```ts
import {
    createTexture,
    loadTexture,
} from '@ripl/3d';

const fromUrl = await loadTexture('/pattern.png');
const fromCanvas = createTexture(offscreenCanvas, { repeat: [4, 4] });
```

Generating a texture into a canvas rather than loading a file is often the simplest route for a procedural pattern, and it ships no asset.

## Properties

- **`wrapS`** / **`wrapT`**: how coordinates outside the `0`–`1` range are resolved — `'clamp'`, `'repeat'` or `'mirror'` (default `'repeat'`)
- **`magFilter`** / **`minFilter`**: `'nearest'` or `'linear'` (default `'linear'`)
- **`flipY`**: flips the image vertically, matching the convention most image assets are authored in (default `false`)
- **`repeat`**: how many times the texture repeats across the surface (default `[1, 1]`)
- **`offset`**: how far the texture is shifted across the surface (default `[0, 0]`)
- **`version`**: increments on every change, so a backend knows its upload is stale
- **`id`**: stable identity used to key whatever a backend caches against the texture

Mutating a texture bumps its `version`, which is what tells a backend to re-upload it. If you draw into the underlying canvas in place, call `texture.invalidate()` so the change is picked up.

## Texture coordinates

Every built-in primitive emits UVs, using the same conventions as three.js so a third-party asset maps as you would expect:

| Shape | Mapping |
|-------|---------|
| `Cube` | The whole texture on each of the six faces |
| `Sphere` | Spherical: `u` wraps once around the equator, `v` runs pole to pole |
| `Cylinder` / `Cone` | Cylindrical around the side; each cap is a disc inscribed in the texture |
| `Plane` | The whole texture across the quad |
| `Torus` | `u` runs around the ring, `v` around the tube |

A `Mesh`, `Parametric` or `BezierSurface` carries whatever UVs its faces declare; the parametric surfaces use their own parameters.

## Backend differences

The WebGPU backend samples the texture per pixel, with hardware filtering and wrap modes.

The Canvas backend maps each triangle with an affine transform — the one carrying its UV corners onto its screen corners. That is not perspective-correct: a large face seen at a steep angle shows a seam along the diagonal it was split on. Subdividing the geometry removes it, and for the segment counts a curved primitive already uses it is not visible.

Tiling is a repeating `CanvasPattern`, so `'repeat'` and `'mirror'` behave the same on both backends. `'clamp'` does not: a GPU sampler extends the edge texel outwards, whereas the Canvas pattern stops. Beyond the first tile the shaded fill shows through untextured rather than smeared, which is usually what you want from a clamped texture but is worth knowing before you compare the two side by side.

> [!TIP]
> If a textured plane looks creased, raise its subdivision or switch the demo to WebGPU.

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
    createTexture,
} from '@ripl/3d';

import type {
    Sphere,
    Texture,
} from '@ripl/3d';

const textured = ref(true);
const repeat = ref(2);

let sphere: Sphere | undefined;
let texture: Texture | undefined;

function createCheckerTexture(): Texture {
    const size = 128;
    const canvas = document.createElement('canvas');

    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');

    if (context) {
        context.fillStyle = '#f0efe9';
        context.fillRect(0, 0, size, size);
        context.fillStyle = '#3f6fa8';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 === 0) {
                    continue;
                }

                context.fillRect(col * size / 8, row * size / 8, size / 8, size / 8);
            }
        }
    }

    return createTexture(canvas);
}

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.context.lights.clear();
    scene.context.lights.add(
        createAmbientLight({ intensity: 0.4 }),
        createDirectionalLight({ direction: [-0.7, -0.8, -0.5], intensity: 0.7 }),
    );

    texture = createCheckerTexture();
    sphere = createSphere({ radius: 1.3, segments: 48, rings: 32, fill: '#ffffff' });

    scene.add(sphere);
    applyTexture();
    startRotation(camera, 0.0035);
});

function applyTexture() {
    if (!sphere || !texture) {
        return;
    }

    texture.repeat = [repeat.value, repeat.value];

    sphere.material = {
        map: textured.value ? texture : undefined,
    };
}

watch([textured, repeat], applyTexture);
</script>
