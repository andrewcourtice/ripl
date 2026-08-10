# @ripl/dom

[![npm](https://img.shields.io/npm/v/@ripl/dom)](https://www.npmjs.com/package/@ripl/dom)
[![license](https://img.shields.io/npm/l/@ripl/dom)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/dom)](https://bundlephobia.com/package/@ripl/dom)

> The DOM layer shared by [Ripl](https://www.ripl.run)'s browser contexts: element mounting, pointer interaction, a virtual-DOM reconciler and the pan/zoom navigator.

**This is an internal dependency.** [`@ripl/canvas`](https://www.npmjs.com/package/@ripl/canvas), [`@ripl/svg`](https://www.npmjs.com/package/@ripl/svg) and [`@ripl/3d`](https://www.npmjs.com/package/@ripl/3d) install it for you, and [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) re-exports the parts you would reach for. Install it directly only when writing a custom browser context.

## Features

- **`DOMContext`** — the abstract base every browser context extends, adding element mounting, resize observation and pointer interaction to `@ripl/core`'s `Context`.
- **Pointer plumbing** — hit tests are buffered to a frame, drags are tracked from press to release, and the click that ends a drag is suppressed, so `mouseenter`/`mousemove`/`click`/`dragstart`/`drag`/`dragend` arrive on the right element.
- **`DOMNavigator`** — turns real wheel, pointer and touch gestures into the base `Navigator`'s pan, zoom and brush commands: drag to pan, wheel or pinch to zoom toward the pointer, shift-drag to brush. It feature-detects its host element, so a non-DOM context declines to attach instead of crashing.
- **Virtual DOM reconciler** — `reconcileNode` diffs a virtual tree against real nodes, creating, updating and removing only what changed. This is what keeps the SVG context's per-frame DOM writes proportional to the change rather than to the scene.
- **Canvas export** — `createCanvasExport` snapshots any `HTMLCanvasElement` (2D, WebGL or WebGPU) into a `ContextExport`, tracking object URLs so `release()` can revoke them.
- **Listener helpers** — `onDOMEvent` and `onDOMElementResize` return disposables, so teardown is one call.

## Installation

```bash
# npm
npm install @ripl/dom

# yarn
yarn add @ripl/dom

# pnpm
pnpm add @ripl/dom
```

## Quick start

```typescript
import {
    createNavigator,
} from '@ripl/dom';

import {
    createContext,
    createScene,
} from '@ripl/web';

const context = createContext('.mount-element');
const scene = createScene(context);

const navigator = createNavigator(context, {
    interactions: true,
});

navigator.on('change', () => scene.render());
```

`createNavigator` and `DOMNavigator` are re-exported by [`@ripl/web`](https://www.npmjs.com/package/@ripl/web), so a browser project never imports this package for them.

## Key API

| Export | What it does |
| --- | --- |
| [`DOMContext`](https://www.ripl.run/docs/core/advanced/custom-contexts) | Base class for a browser rendering context |
| [`createNavigator` / `DOMNavigator`](https://www.ripl.run/docs/core/advanced/navigator) | Wheel, pointer and touch gestures driving pan, zoom and brush |
| [`reconcileNode` / `createVNode` / `ensureGroupPath`](https://www.ripl.run/docs/core/contexts/svg) | The virtual-DOM reconciler behind the SVG context |
| [`createCanvasExport`](https://www.ripl.run/docs/core/contexts/canvas) | Builds a `ContextExport` from a canvas element |
| [`onDOMEvent` / `onDOMElementResize`](https://www.ripl.run/docs/core/advanced/events) | Disposable DOM listener helpers |

## Related packages

- [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) — the browser entry point, and what most projects should install
- [`@ripl/canvas`](https://www.npmjs.com/package/@ripl/canvas) / [`@ripl/svg`](https://www.npmjs.com/package/@ripl/svg) — the contexts built on `DOMContext`
- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the context, element and navigator abstractions this layer extends

## Documentation

Guides and the full API reference are at [ripl.run/docs/core](https://www.ripl.run/docs/core/).

## License

[MIT](../../LICENSE)
