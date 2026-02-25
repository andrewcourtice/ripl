---
title: Introduction
---

# @ripl/3d

The `@ripl/3d` package extends Ripl with 3D shape rendering projected onto a 2D canvas. It provides a `Context3D` (extending `CanvasContext`), a reactive camera system, built-in 3D shapes, and flat shading utilities.

## Installation

```bash
npm install @ripl/3d
```

## Quick Start

```ts
import { createContext, createCamera, createCube, createScene, createRenderer } from '@ripl/3d';

const context = createContext('#app');
const scene = createScene(context);
const renderer = createRenderer(scene);

const camera = createCamera(scene, {
    position: [0, 2, 5],
    target: [0, 0, 0],
});

const cube = createCube({
    size: 1,
    fillStyle: '#4488ff',
});

scene.add(cube);
renderer.render();
```

## Features

- **Context3D** — extends `CanvasContext` with view/projection matrices and a `project()` method
- **Camera** — reactive camera with orbit, pan, zoom, and microtask-batched updates
- **Built-in Shapes** — Cube, Sphere, Cylinder, Cone, Plane, Torus
- **Flat Shading** — automatic face shading based on normals and light direction
- **Vector3 Interpolator** — animate 3D positions with Ripl's animation system
