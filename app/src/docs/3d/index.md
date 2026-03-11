---
title: Introduction
---

# 3D

The `@ripl/3d` package extends Ripl with 3D shape rendering projected onto a 2D canvas. It provides a `Context3D` (extending `CanvasContext`), a reactive camera system with orbit/pan/zoom interactions, six built-in primitives (Cube, Sphere, Cylinder, Cone, Plane, Torus), and flat shading utilities driven by configurable light direction. Because it builds on the core canvas context, you get Ripl's animation system, event handling, and scene management for free.

> [!NOTE]
> For the full 3D API, see the [3D API Reference](/docs/api/3d/shapes).

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
    createRenderer,
    createScene,
} from '@ripl/3d';

const context = createContext('#app');
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

- **Context3D** — extends `CanvasContext` with view/projection matrices and a `project()` method
- **Camera** — reactive camera with orbit, pan, zoom, and microtask-batched updates
- **Built-in Shapes** — Cube, Sphere, Cylinder, Cone, Plane, Torus
- **Flat Shading** — automatic face shading based on normals and light direction
- **Vector3 Interpolator** — animate 3D positions with Ripl's animation system
