---
title: Introduction
description: "@ripl/3d builds 3D scenes from nine shapes lit by five light types, with materials, textures, fog, raycasting and an orbit camera, on Canvas or WebGPU."
---

# 3D

The `@ripl/3d` package extends Ripl with 3D geometry projected onto a 2D canvas. It provides a `Context3D` (extending `CanvasContext`), a reactive camera with orbit, pan and zoom, and nine built-in shapes: cube, sphere, cylinder, cone, plane and torus, plus a [mesh](/docs/3d/shapes/mesh) built from an explicit face list, a [parametric](/docs/3d/shapes/parametric) surface tessellated from a function of two parameters, and a [Bézier surface](/docs/3d/shapes/bezier-surface) built from bicubic patches. Because it builds on the core canvas context, you get Ripl's animation system, event handling, and scene management for free.

A scene carries five [light types](/docs/3d/essentials/lighting) — ambient, hemisphere, directional, point and spot — plus linear or exponential fog. Directional and spot lights are fixed in world space or locked to the camera. Surfaces take a [material](/docs/3d/essentials/materials) with colour, opacity, emissive and specular terms, wireframe, flat shading and per-vertex colours, and a [texture](/docs/3d/essentials/textures) mapped by UV. [Raycasting](/docs/3d/essentials/raycasting) reports the shape a screen point meets, the exact hit point, the face, its normal and its texture coordinate.

Two backends draw the same `Shape3D` elements. `@ripl/3d` rasterizes them onto a 2D canvas, sorting faces with a painter's algorithm; [`@ripl/webgpu`](/docs/3d/contexts/webgpu) rasterizes them on the GPU with WGSL shaders, hardware depth testing, and 4× MSAA. Swapping between them is one import change.

> [!NOTE]
> For the full 3D API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Installation

```bash
npm install @ripl/3d
```

## Quick Start

```ts
import {
    createCamera,
    createContext,
    createCube,
} from '@ripl/3d';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

const context = createContext('#app');
const scene = createScene(context);

createCamera(context, {
    position: [0, 2, 5],
    target: [0, 0, 0],
    interactions: true,
});

const cube = createCube({
    size: 1,
    fill: '#4488ff',
});

scene.add(cube);

createRenderer(scene, {
    autoStop: false,
});
```

## Features

- **Context3D**: extends `CanvasContext` with view/projection matrices and a `project()` method
- **Camera**: reactive camera with orbit, pan, zoom, and microtask-batched updates
- **Built-in Shapes**: Cube, Sphere, Cylinder, Cone, Plane, Torus, Mesh, Parametric, BezierSurface
- **Lighting**: ambient, hemisphere, directional, point and spot lights, with world- or camera-space orientation on the directed ones, plus linear or exponential fog
- **Materials**: colour, opacity, emissive, specular and shininess, front/back/double side, wireframe, flat shading and per-vertex colours
- **Textures**: image, canvas and bitmap sources with clamp/repeat/mirror wrapping, nearest or linear filtering and UV transforms
- **Raycasting**: read the shape, hit point, face, normal and texture coordinate under a screen position
- **Groups**: `Group3D` positions, rotates and scales a subtree as a unit
- **Vector3 Interpolator**: `interpolateVector3`, declared in a custom element's `interpolators` to animate a vector-valued property
- **WebGPU backend**: swap in `@ripl/webgpu` for GPU rasterization with WGSL shaders, a depth buffer, and 4× MSAA
