# @ripl/web

The main browser entry point for [Ripl](https://www.ripl.run) — a unified, zero-dependency API for drawing and animating 2D graphics and data visualizations.

## Installation

```bash
npm install @ripl/web
```

## Overview

`@ripl/web` is the package most browser projects should install. It re-exports everything from [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) (elements, scenes, renderer, animation, scales, color, interpolation) and [`@ripl/canvas`](https://www.npmjs.com/package/@ripl/canvas) (the Canvas 2D context), and wires up the browser platform bindings (device pixel ratio, `requestAnimationFrame`, text measurement, and default state) automatically.

## Usage

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

await renderer.transition(circle, {
    duration: 1000,
    state: {
        radius: 100,
        fill: '#FF0000',
    },
});
```

## Switching contexts

To render the same scene to SVG, import `createContext` from [`@ripl/svg`](https://www.npmjs.com/package/@ripl/svg) instead — everything else stays the same.

## Documentation

Full documentation and interactive demos are available at [ripl.run](https://www.ripl.run).

## License

[MIT](../../LICENSE)
