# @ripl/webgpu

WebGPU 3D rendering context for [Ripl](https://www.ripl.run). Replaces the Canvas 2D painter's algorithm in `@ripl/3d` with a true GPU rasterization pipeline featuring hardware depth testing, WGSL shaders, and Lambertian shading.

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
    createCube,
} from '@ripl/3d';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

const context = await createContext('#app');
const scene = createScene(context);
const renderer = createRenderer(scene, {
    autoStop: false,
});

const camera = createCamera(context, {
    position: [0, 2, 5],
    target: [0, 0, 0],
});

scene.add(createCube({
    size: 1,
    fill: '#4488ff',
}));

camera.flush();
```

## Features

- **WebGPU rendering**: true GPU rasterization with hardware depth buffer
- **Drop-in replacement**: same `Shape3D` elements work with both Canvas 2D and WebGPU contexts
- **WGSL shaders**: vertex and fragment shaders with Lambertian diffuse lighting
- **MSAA**: 4x multisample anti-aliasing
- **Async initialization**: `createContext` returns a `Promise` for GPU adapter/device negotiation
