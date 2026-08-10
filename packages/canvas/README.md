# @ripl/canvas

[![npm](https://img.shields.io/npm/v/@ripl/canvas)](https://www.npmjs.com/package/@ripl/canvas)
[![license](https://img.shields.io/npm/l/@ripl/canvas)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/canvas)](https://bundlephobia.com/package/@ripl/canvas)

> The Canvas 2D rendering context for [Ripl](https://www.ripl.run): rasterizes the scene graph to an HTML `<canvas>` through `CanvasRenderingContext2D`.

## Features

- **Ripl's default backend** — implements the `Context` abstraction on the native Canvas 2D API, so the same drawing code also runs on [SVG](https://www.npmjs.com/package/@ripl/svg), the [terminal](https://www.npmjs.com/package/@ripl/terminal) or a custom context.
- **Device pixel ratio handled for you** — the backing store scales with the display while every coordinate you author, every bounding box and every pointer payload stays in CSS pixels.
- **Native paint objects** — CSS gradient and pattern strings in `fill` and `stroke` are parsed and cached into `CanvasGradient` and `CanvasPattern` instances, keyed so repeated paints reuse them.
- **Browser hit testing** — `isPointInPath`/`isPointInStroke` run against the browser's own implementation, under both fill rules.
- **`Path2D` caching** — `supportsPathCaching` is `true` here, so a shape whose state has not changed replays its built path instead of re-tracing it each frame.
- **Text along a path** and full stroke/fill state: caps, joins, dashes, miter limit, shadows, filters and blend modes.
- **Snapshot export** — PNG data URL, `Blob` object URL, or raw `ImageData`.

## Installation

Most browser projects should install [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) instead. It re-exports this package alongside [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) and registers the browser platform bindings, which this context needs for text measurement and frame scheduling.

```bash
# npm
npm install @ripl/canvas

# yarn
yarn add @ripl/canvas

# pnpm
pnpm add @ripl/canvas
```

## Quick start

```typescript
import {
    createContext,
} from '@ripl/canvas';

import {
    createCircle,
} from '@ripl/core';

const context = createContext('.mount-element');

createCircle({
    fill: 'linear-gradient(135deg, #3a86ff, #8338ec)',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: 50,
}).render(context);
```

Every context can snapshot its current output through `export()`:

```typescript
const snapshot = context.export();

const dataUrl = snapshot.toString(); // PNG data URL
const url = snapshot.toURL(); // PNG object URL
const image = await snapshot.toImage(); // ImageData

snapshot.release(); // revokes the object URL
```

## Key API

| Export | What it does |
| --- | --- |
| [`createContext`](https://www.ripl.run/docs/core/contexts/canvas) | Binds a `CanvasContext` to a selector, element or existing canvas |
| [`CanvasContext`](https://www.ripl.run/docs/core/contexts/canvas) | The context itself, for typing and subclassing |
| [`CanvasPath`](https://www.ripl.run/docs/core/advanced/custom-contexts) | `Path2D`-backed path builder used by every element |
| [`toCanvasGradient` / `toCanvasPattern`](https://www.ripl.run/docs/core/advanced/gradients) | Paint-string conversion into native canvas paints |
| [`rescaleCanvas`](https://www.ripl.run/docs/core/contexts/canvas) | Resizes the backing store for a device pixel ratio |

## Related packages

- [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) — the browser entry point, and what most projects should install
- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the elements and scene graph this context draws
- [`@ripl/svg`](https://www.npmjs.com/package/@ripl/svg) — the same API, rendering to SVG instead
- [`@ripl/3d`](https://www.npmjs.com/package/@ripl/3d) — a 3D context built on this one

## Documentation

Guides, live demos and the full API reference are at [ripl.run/docs/core/contexts/canvas](https://www.ripl.run/docs/core/contexts/canvas).

## License

[MIT](../../LICENSE)
