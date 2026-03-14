---
title: Introduction
---

# WebGPU

The `@ripl/webgpu` package provides a GPU-accelerated 3D rendering context for Ripl, replacing the Canvas 2D painter's algorithm in `@ripl/3d` with a true WebGPU rasterization pipeline. It features hardware depth testing, WGSL shaders with Lambertian diffuse lighting, and 4× MSAA anti-aliasing.

All existing `Shape3D` elements (Cube, Sphere, Cylinder, Cone, Plane, Torus, and custom shapes) work with the WebGPU context without modification — the rendering path is selected automatically based on the context type.

> [!NOTE]
> WebGPU requires a compatible browser (Chrome 113+, Edge 113+, Firefox Nightly). The existing `@ripl/3d` Canvas context remains available as a fallback.

## Installation

```bash
npm install @ripl/webgpu
```

## Quick Start

```ts
import {
    createContext,
} from '@ripl/webgpu';

import {
    createCamera,
} from '@ripl/3d';

import {
    createCube,
} from '@ripl/3d';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

// Note: createContext is async (GPU adapter/device negotiation)
const context = await createContext('#app');
const scene = createScene(context);
const renderer = createRenderer(scene);

const camera = createCamera(scene, {
    position: [0, 2, 5],
    target: [0, 0, 0],
});

const cube = createCube({
    size: 1,
    fill: '#4488ff',
});

scene.add(cube);
renderer.render();
```

## Features

- **Hardware depth buffer** — correct rendering of intersecting and overlapping geometry
- **WGSL shaders** — vertex and fragment shaders with Lambertian diffuse lighting
- **4× MSAA** — multisample anti-aliasing for smooth edges
- **Drop-in replacement** — same `Shape3D` elements work with both Canvas 2D and WebGPU contexts
- **Async initialisation** — `createContext` returns a `Promise` for GPU adapter/device negotiation
- **Camera compatible** — works with the existing `Camera` from `@ripl/3d`
