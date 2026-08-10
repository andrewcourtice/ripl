# @ripl/web

[![npm](https://img.shields.io/npm/v/@ripl/web)](https://www.npmjs.com/package/@ripl/web)
[![license](https://img.shields.io/npm/l/@ripl/web)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/web)](https://bundlephobia.com/package/@ripl/web)

> **The browser entry point for [Ripl](https://www.ripl.run).** Draw and animate 2D graphics on a `<canvas>` with code that renders unchanged on SVG, the terminal or WebGPU.

This is the package to install. It re-exports every symbol from [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) and [`@ripl/canvas`](https://www.npmjs.com/package/@ripl/canvas), so one dependency covers elements, the scene graph, the renderer, animation, scales, colour, gradients, interpolation and the Canvas 2D context.

## Features

- **One import surface** — `createContext`, `createScene`, `createRenderer` and all ten element factories come from the same module, plus `createNavigator` and `DOMNavigator` for pan/zoom/brush.
- **Browser bindings registered on import** — device pixel ratio, `requestAnimationFrame`/`cancelAnimationFrame`, `performance.now`, computed styles, element creation, canvas text measurement and the Canvas 2D default state. Nothing to configure.
- **Canvas by default, other backends by one import** — swap `createContext` for [`@ripl/svg`](https://www.npmjs.com/package/@ripl/svg)'s and the same scene renders as SVG; the elements, animations and events are untouched.
- **Logical coordinates throughout** — element positions, bounding boxes and pointer payloads are all in CSS pixels, whatever the device pixel ratio, so nothing at the API boundary needs converting.
- **Animated transitions** — `renderer.transition(element, { duration, ease, state })` returns a promise, and every transition is cancelable.
- **Strict TypeScript, tree-shakable, no third-party runtime dependencies.**

## Installation

```bash
# npm
npm install @ripl/web

# yarn
yarn add @ripl/web

# pnpm
pnpm add @ripl/web
```

Add [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) for pre-built charts, [`@ripl/svg`](https://www.npmjs.com/package/@ripl/svg) for SVG output, or [`@ripl/3d`](https://www.npmjs.com/package/@ripl/3d) for 3D. `@ripl/core`, `@ripl/canvas`, `@ripl/dom` and `@ripl/utilities` arrive as dependencies of this package; you never install them yourself.

## Quick start

```typescript
import {
    createCircle,
    createContext,
    createRenderer,
    createScene,
} from '@ripl/web';

const context = createContext('.mount-element');

const circle = createCircle({
    fill: 'rgb(30, 105, 120)',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: 50,
});

const scene = createScene(context, {
    children: [circle],
});

const renderer = createRenderer(scene, {
    autoStart: true,
    autoStop: true,
});

circle.on('click', () => renderer.transition(circle, {
    duration: 1000,
    state: {
        radius: 100,
        fill: '#ff0000',
    },
}));
```

## Key API

| Export | What it does |
| --- | --- |
| [`createContext`](https://www.ripl.run/docs/core/contexts/canvas) | Binds a Canvas 2D context to a selector or element |
| [`createScene`](https://www.ripl.run/docs/core/essentials/scene) | Top-level group with a hoisted, O(n) render buffer |
| [`createRenderer`](https://www.ripl.run/docs/core/essentials/renderer) | `requestAnimationFrame` loop and transition manager |
| [`createCircle` … `createText`](https://www.ripl.run/docs/core/elements/circle) | The ten built-in element factories |
| [`createGroup`](https://www.ripl.run/docs/core/essentials/group) | Nesting, style inheritance, querying and event bubbling |
| [`createNavigator`](https://www.ripl.run/docs/core/advanced/navigator) | Pan, zoom and brush by rescaling scale domains |

## Related packages

- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the rendering core this package re-exports
- [`@ripl/canvas`](https://www.npmjs.com/package/@ripl/canvas) — the Canvas 2D context this package re-exports
- [`@ripl/svg`](https://www.npmjs.com/package/@ripl/svg) — SVG output, one import away
- [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) — 25 pre-built chart types
- [`@ripl/3d`](https://www.npmjs.com/package/@ripl/3d) — 3D shapes, camera, lighting and materials
- [`@ripl/devtools`](https://www.npmjs.com/package/@ripl/devtools) — live scene-graph inspection in the browser devtools

## Documentation

Guides, live demos and the full API reference are at [ripl.run/docs/core](https://www.ripl.run/docs/core/). Start with the [tutorial](https://www.ripl.run/docs/core/getting-started/tutorial).

## License

[MIT](../../LICENSE)
