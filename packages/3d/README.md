# @ripl/3d

[![npm](https://img.shields.io/npm/v/@ripl/3d)](https://www.npmjs.com/package/@ripl/3d)
[![license](https://img.shields.io/npm/l/@ripl/3d)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/3d)](https://bundlephobia.com/package/@ripl/3d)

> 3D rendering for [Ripl](https://www.ripl.run): shapes, lights, materials and textures, drawn onto a 2D canvas with a depth-sorted painter's algorithm, or on the GPU through [`@ripl/webgpu`](https://www.npmjs.com/package/@ripl/webgpu).

## Features

- **Nine shapes** — [cube](https://www.ripl.run/docs/3d/shapes/cube), [sphere](https://www.ripl.run/docs/3d/shapes/sphere), [cylinder](https://www.ripl.run/docs/3d/shapes/cylinder), [cone](https://www.ripl.run/docs/3d/shapes/cone), [plane](https://www.ripl.run/docs/3d/shapes/plane), [torus](https://www.ripl.run/docs/3d/shapes/torus), [mesh](https://www.ripl.run/docs/3d/shapes/mesh) (raw faces), [parametric](https://www.ripl.run/docs/3d/shapes/parametric) (a tessellated surface function) and [bezier surface](https://www.ripl.run/docs/3d/shapes/bezier-surface) (bicubic patches).
- **Five light types** — `createAmbientLight`, `createHemisphereLight`, `createDirectionalLight`, `createPointLight` and `createSpotLight`, each with colour, intensity and an `enabled` flag; directed lights are fixed in world space or locked to the camera. Point and spot lights add distance falloff (`distance`, `decay`) and spot lights a cone (`angle`, `penumbra`).
- **Materials** — `color`, `opacity`, `emissive`, `emissiveIntensity`, `specular`, `shininess`, `side` (`'front' | 'back' | 'double'`), `wireframe`, `flatShading`, `vertexColors` and `map`. Every property is optional; an element with only a `fill` shades as it always did.
- **Textures** — `createTexture` from an `ImageBitmap`, `<img>`, `<canvas>`, `<video>`, `OffscreenCanvas` or `ImageData`, or `loadTexture` from a URL. Per-axis wrapping (`'clamp' | 'repeat' | 'mirror'`), separate magnification and minification filters (`'nearest' | 'linear'`), and a UV transform of `repeat`, `offset` and `flipY`. Every built-in shape emits the coordinates, and both backends sample them the same way.
- **Perspective and orthographic camera** — `createCamera` drives the context's view and projection, batches changes through a microtask, and handles orbit, pan and pinch/wheel zoom with per-interaction sensitivity.
- **Fog** — `'linear'` or `'exponential'` haze blending distant geometry towards a colour, computed identically on both backends.
- **Triangle raycasting** — `context.raycast(x, y)` builds a world-space ray and `context.raycastAll(scene, x, y)` returns every shape it meets, nearest first, with the hit point, face, interpolated normal and UV.
- **`Group3D`** — a group whose transform composes into the model matrix of every shape beneath it, so a subtree orbits, tilts and scales as a unit.
- **Animation and events** — shapes are Ripl elements, so `renderer.transition`, pointer events and scene querying all apply. `interpolateVector3` tweens 3D positions — declare it in a custom element's `interpolators` to animate a vector-valued property.

## Installation

```bash
# npm
npm install @ripl/3d @ripl/web

# yarn
yarn add @ripl/3d @ripl/web

# pnpm
pnpm add @ripl/3d @ripl/web
```

The scene and renderer come from [`@ripl/web`](https://www.npmjs.com/package/@ripl/web); this package supplies the 3D context, camera, lights and shapes. For GPU rasterization, add [`@ripl/webgpu`](https://www.npmjs.com/package/@ripl/webgpu) and import `createContext` from there instead.

## Quick start

```typescript
import {
    createCamera,
    createContext,
    createDirectionalLight,
    createTorus,
} from '@ripl/3d';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

const context = createContext('.mount-element');
const scene = createScene(context);

createCamera(context, {
    position: [0, 2, 5],
    target: [0, 0, 0],
    interactions: true,
});

context.lights.add(createDirectionalLight({
    direction: [-1, -1, -0.5],
    intensity: 0.8,
}));

scene.add(createTorus({
    radius: 1.2,
    tube: 0.4,
    material: {
        color: '#4488ff',
        specular: '#ffffff',
        shininess: 48,
    },
}));

createRenderer(scene, {
    autoStop: false,
});
```

## Key API

| Export | What it does |
| --- | --- |
| [`createContext`](https://www.ripl.run/docs/3d/contexts/canvas) | Canvas-backed `Context3D` that projects and depth-sorts faces |
| [`createCamera`](https://www.ripl.run/docs/3d/essentials/camera) | Perspective or orthographic camera with orbit, pan and zoom |
| [`createAmbientLight` … `createSpotLight`](https://www.ripl.run/docs/3d/essentials/lighting) | The five light constructors, added via `context.lights` |
| [`createMaterial`](https://www.ripl.run/docs/3d/essentials/materials) | How a surface responds to light |
| [`createTexture` / `loadTexture`](https://www.ripl.run/docs/3d/essentials/textures) | Images mapped across a surface |
| [`createCube` … `createBezierSurface`](https://www.ripl.run/docs/3d/) | The nine built-in shapes |
| [`createGroup3D`](https://www.ripl.run/docs/3d/) | A group carrying a 3D transform for its subtree |
| [`Context3D.raycastAll`](https://www.ripl.run/docs/3d/essentials/raycasting) | Every shape under a point, nearest first |
| [`computeFaceNormal` / `shadeFaceColor`](https://www.ripl.run/docs/3d/essentials/shading) | Shading helpers for custom geometry |

## Related packages

- [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) — the browser entry point supplying the scene, renderer and animation
- [`@ripl/webgpu`](https://www.npmjs.com/package/@ripl/webgpu) — GPU backend for the same `Shape3D` elements
- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the element, scene and animation model these shapes build on

## Documentation

Guides, live demos and the full API reference are at [ripl.run/docs/3d](https://www.ripl.run/docs/3d/).

## License

[MIT](../../LICENSE)
