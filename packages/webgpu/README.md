# @ripl/webgpu

[![npm](https://img.shields.io/npm/v/@ripl/webgpu)](https://www.npmjs.com/package/@ripl/webgpu)
[![license](https://img.shields.io/npm/l/@ripl/webgpu)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/webgpu)](https://bundlephobia.com/package/@ripl/webgpu)

> A WebGPU backend for [Ripl](https://www.ripl.run) 3D: the same `Shape3D` elements as [`@ripl/3d`](https://www.npmjs.com/package/@ripl/3d), rasterized on the GPU instead of face-sorted on a 2D canvas.

## Features

- **Hardware depth testing** — a real depth buffer replaces the painter's algorithm, so intersecting and self-occluding geometry resolves per fragment rather than per face.
- **WGSL shaders** — the fragment shader mirrors `@ripl/3d`'s `shadeSurface` term for term (ambient, hemisphere, directional, point and spot lights, Blinn-Phong specular, emissive, fog), so a scene shades identically on either backend. The uniform structs are generated from the same descriptor the CPU-side packer writes, so the two cannot disagree about the bytes.
- **4× MSAA** by default, configurable through `sampleCount`.
- **Its own texture path** — `TextureManager` uploads `Texture` images to the GPU and caches their bind groups, mapping Ripl's wrap modes to `clamp-to-edge`/`repeat`/`mirror-repeat` and its filters to `nearest`/`linear`. Untextured meshes bind a 1×1 white fallback, which keeps the whole backend on a single pipeline rather than one permutation per material.
- **Drop-in swap** — shapes, camera, lights, materials, fog and raycasting all come from `@ripl/3d` unchanged; only the `createContext` import differs.
- **Configurable clear colour** — a straight (non-premultiplied) RGBA `clearColor`, transparent by default.

## Installation

```bash
# npm
npm install @ripl/webgpu @ripl/3d @ripl/web

# yarn
yarn add @ripl/webgpu @ripl/3d @ripl/web

# pnpm
pnpm add @ripl/webgpu @ripl/3d @ripl/web
```

WebGPU needs a browser that supports it (Chrome 113+, Edge 113+, Firefox Nightly). The Canvas `Context3D` from [`@ripl/3d`](https://www.npmjs.com/package/@ripl/3d) stays available as a fallback and takes the same scene.

## Quick start

```typescript
import {
    createContext,
} from '@ripl/webgpu';

import {
    createCamera,
    createCube,
    createDirectionalLight,
    createSphere,
} from '@ripl/3d';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

const context = await createContext('.mount-element');
const scene = createScene(context);

createCamera(context, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
    interactions: true,
});

context.lights.add(createDirectionalLight({
    direction: [-1, -1, -0.5],
    intensity: 0.8,
}));

scene.add(createCube({
    size: 1,
    x: -1.2,
    fill: '#3a86ff',
}));

scene.add(createSphere({
    radius: 0.6,
    x: 1.2,
    fill: '#ff006e',
}));

createRenderer(scene, {
    autoStop: false,
});
```

`createContext` is **async** — it negotiates a GPU adapter and device before returning.

## Key API

| Export | What it does |
| --- | --- |
| [`createContext`](https://www.ripl.run/docs/3d/contexts/webgpu) | Async factory returning a `WebGPUContext3D` |
| [`WebGPUContext3D`](https://www.ripl.run/docs/3d/contexts/webgpu) | The context itself, a `Context3D` subclass |
| [`requestDevice`](https://www.ripl.run/docs/3d/contexts/webgpu) | Adapter and device negotiation, for reuse or capability checks |
| [`createPipeline`](https://www.ripl.run/docs/3d/contexts/webgpu) | The render pipeline, bind group layouts and vertex buffer layout |
| [`VERTEX_SHADER` / `FRAGMENT_SHADER`](https://www.ripl.run/docs/3d/essentials/shading) | The WGSL source, if you need to read or extend it |

## Related packages

- [`@ripl/3d`](https://www.npmjs.com/package/@ripl/3d) — the shapes, camera, lights, materials and textures this backend draws
- [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) — the scene, renderer and animation
- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the element and context model underneath both

## Documentation

Guides, a live demo and the full API reference are at [ripl.run/docs/3d/contexts/webgpu](https://www.ripl.run/docs/3d/contexts/webgpu).

## License

[MIT](../../LICENSE)
