# @ripl/3d

Experimental 3D rendering for [Ripl](https://www.ripl.rocks) — a unified API for 2D graphics rendering in the browser.

> **Note:** This package is experimental and its API may change between releases.

## Installation

```bash
npm install @ripl/3d
```

## Overview

Extends Ripl's rendering pipeline with 3D capabilities. Projects 3D geometry onto Ripl's 2D canvas context using a virtual camera, depth sorting, and flat shading.

## Features

- **3D math** — Vectors, matrices, and transformations
- **Camera** — Configurable virtual camera with projection
- **Shading** — Flat shading with directional lighting
- **Depth sorting** — Automatic painter's algorithm for correct draw order
- **3D shapes** — Built-in 3D shape primitives
- **Interpolation** — 3D-aware interpolators for smooth animation

## Usage

```typescript
import { createContext } from '@ripl/core';
import { createCamera, createCube } from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera({ /* options */ });
const cube = createCube({ /* options */ });
```

## Documentation

Full documentation is available at [ripl.rocks](https://www.ripl.rocks).

## License

[MIT](../../LICENSE)
