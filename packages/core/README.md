# @ripl/core

Core rendering library for [Ripl](https://www.ripl.rocks) — a unified API for 2D graphics rendering (Canvas & SVG) in the browser.

## Installation

```bash
npm install @ripl/core
```

## Features

- **Unified rendering API** — One API surface for both Canvas and SVG contexts
- **Built-in elements** — Arc, circle, rect, line, polyline, polygon, ellipse, path, text, and image
- **Scene management** — Scenegraph with grouping, property inheritance, and element querying
- **Animation** — High-performance async transitions with CSS-like keyframe support and custom interpolators
- **Event system** — Event bubbling, delegation, and stop propagation (mimics the DOM)
- **Scales** — Continuous, discrete, and time scales for data mapping
- **Color** — Color parsing, interpolation, and conversion (RGB, HSL, Hex)
- **Math** — Geometry utilities, vector operations, and easing functions
- **Zero dependencies** — Fully self-contained
- **Tree-shakable** — Only ship what you use

## Usage

```typescript
import {
    createContext,
    createCircle,
    createScene,
    createRenderer,
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fillStyle: 'rgb(30, 105, 120)',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: 50,
});

const scene = createScene({
    children: [circle],
});

const renderer = createRenderer(scene, {
    autoStart: true,
    autoStop: true,
});

await renderer.transition(circle, {
    duration: 1000,
    state: {
        radius: 100,
        fillStyle: '#FF0000',
    },
});
```

## Switching to SVG

Replace the `createContext` import with `@ripl/svg` — everything else stays the same:

```typescript
import { createContext } from '@ripl/svg';
```

## Documentation

Full documentation and interactive demos are available at [ripl.rocks](https://www.ripl.rocks).

## License

[MIT](../../LICENSE)
