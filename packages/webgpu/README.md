# @ripl/webgpu

WebGPU 3D rendering context for [Ripl](https://www.ripl.rocks). Replaces the Canvas 2D painter's algorithm in `@ripl/3d` with a true GPU rasterization pipeline featuring hardware depth testing, WGSL shaders, and Lambertian shading.

## Installation

```bash
npm install @ripl/webgpu
```

## Quick Start

```ts
import { createContext } from '@ripl/webgpu';
import { createCamera } from '@ripl/3d';
import { createScene, createRenderer } from '@ripl/core';
import { createCube } from '@ripl/3d';

const context = await createContext('#app');
const scene = createScene(context);
const renderer = createRenderer(scene);

const camera = createCamera(scene, {
    position: [0, 2, 5],
    target: [0, 0, 0],
});

const cube = createCube({ size: 1, fill: '#4488ff' });
scene.add(cube);
renderer.render();
```

## Features

- **WebGPU rendering** — true GPU rasterization with hardware depth buffer
- **Drop-in replacement** — same `Shape3D` elements work with both Canvas 2D and WebGPU contexts
- **WGSL shaders** — vertex and fragment shaders with Lambertian diffuse lighting
- **MSAA** — 4x multisample anti-aliasing
- **Async initialisation** — `createContext` returns a `Promise` for GPU adapter/device negotiation
