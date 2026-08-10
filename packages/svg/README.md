# @ripl/svg

[![npm](https://img.shields.io/npm/v/@ripl/svg)](https://www.npmjs.com/package/@ripl/svg)
[![license](https://img.shields.io/npm/l/@ripl/svg)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/svg)](https://bundlephobia.com/package/@ripl/svg)

> The SVG rendering context for [Ripl](https://www.ripl.run): draws the same elements into a live SVG DOM tree instead of a canvas bitmap.

## Features

- **One import to switch** — replace `createContext` from [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) with this package's, and the elements, scenes, animations and events are untouched.
- **Reconciled DOM updates** — each render pass diffs a virtual tree against the real SVG nodes and touches only what changed, rather than rebuilding the subtree.
- **Inspectable output** — the result is real markup you can style with CSS, inspect in devtools, export, or hand to a print pipeline.
- **Native `<defs>` for paint** — linear and radial gradients, pattern tiles, clip paths, shadow filters and text paths become `<defs>` entries, cached by id and swept when unused. Conic gradients, which SVG has no element for, fall back to a solid colour.
- **Full element parity** — paths, text, text-on-a-path, images, transforms, clipping and hit testing all behave as they do on Canvas.
- **Snapshot export** — SVG markup, an `image/svg+xml` object URL, or rasterized `ImageData`.

## Installation

```bash
# npm
npm install @ripl/svg

# yarn
yarn add @ripl/svg

# pnpm
pnpm add @ripl/svg
```

Install it alongside [`@ripl/web`](https://www.npmjs.com/package/@ripl/web), which supplies the elements, scene, renderer and browser platform bindings.

## Quick start

```typescript
import {
    createContext,
} from '@ripl/svg';

import {
    createCircle,
    createRect,
} from '@ripl/web';

const context = createContext('.mount-element');

createCircle({
    fill: '#3a86ff',
    stroke: '#1a56db',
    lineWidth: 2,
    cx: context.width / 3,
    cy: context.height / 2,
    radius: Math.min(context.width, context.height) / 4,
}).render(context);

createRect({
    fill: 'linear-gradient(45deg, #ff006e, #fb5607)',
    x: context.width / 2,
    y: context.height / 4,
    width: context.width / 3,
    height: context.height / 2,
}).render(context);
```

## Key API

| Export | What it does |
| --- | --- |
| [`createContext`](https://www.ripl.run/docs/core/contexts/svg) | Binds an `SVGContext` to a selector or element |
| [`SVGContext`](https://www.ripl.run/docs/core/contexts/svg) | The context itself, for typing and subclassing |
| [`SVGPath` / `SVGText` / `SVGImage`](https://www.ripl.run/docs/core/advanced/custom-contexts) | The SVG-backed path, text and image primitives |
| [`isSupportedSVGGradient`](https://www.ripl.run/docs/core/advanced/gradients) | Whether a parsed gradient has a native SVG element |

## Related packages

- [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) — the browser entry point supplying elements, scene and renderer
- [`@ripl/canvas`](https://www.npmjs.com/package/@ripl/canvas) — the same API, rasterizing to a canvas instead
- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the elements and scene graph this context draws
- [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) — every chart type renders through this context too

## Documentation

Guides, live demos and the full API reference are at [ripl.run/docs/core/contexts/svg](https://www.ripl.run/docs/core/contexts/svg).

## License

[MIT](../../LICENSE)
