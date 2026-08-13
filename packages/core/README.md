# @ripl/core

[![npm](https://img.shields.io/npm/v/@ripl/core)](https://www.npmjs.com/package/@ripl/core)
[![license](https://img.shields.io/npm/l/@ripl/core)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/core)](https://bundlephobia.com/package/@ripl/core)

> The rendering core of [Ripl](https://www.ripl.run): elements, scene graph, renderer, animation, scales, colour and math, drawing through a `Context` abstraction that Canvas, SVG, the terminal and WebGPU each implement.

## Features

- **Ten built-in elements** — [arc](https://www.ripl.run/docs/core/elements/arc), [circle](https://www.ripl.run/docs/core/elements/circle), [ellipse](https://www.ripl.run/docs/core/elements/ellipse), [image](https://www.ripl.run/docs/core/elements/image), [line](https://www.ripl.run/docs/core/elements/line), [path](https://www.ripl.run/docs/core/elements/path), [polygon](https://www.ripl.run/docs/core/elements/polygon), [polyline](https://www.ripl.run/docs/core/elements/polyline), [rect](https://www.ripl.run/docs/core/elements/rect) and [text](https://www.ripl.run/docs/core/elements/text), each with a `createX` factory, an `elementIsX` type guard and full stroke/fill state. Polylines carry thirteen curve algorithms (linear, spline, basis, bump-x, bump-y, cardinal, catmull-rom, monotone-x, monotone-y, natural, step, step-before, step-after).
- **DOM-like scene graph** — elements nest in [groups](https://www.ripl.run/docs/core/essentials/group) that inherit presentation state, and are found with `getElementById`, `getElementsByType`, `getElementsByClass`, `query`, `queryAll`, `matches` and `closest`. [`Scene`](https://www.ripl.run/docs/core/essentials/scene) hoists the tree into a flat render buffer, so a frame costs O(n) in elements rather than in tree depth.
- **Renderer** — [`createRenderer`](https://www.ripl.run/docs/core/essentials/renderer) drives `requestAnimationFrame`, stops itself when nothing is animating (`autoStop`), and carries FPS, element-count and bounding-box debug overlays.
- **Animation** — awaitable, cancelable transitions with CSS-like keyframes, per-keyframe offsets, and **31 easing functions** (linear plus quad, cubic, quart, quint, sine, expo, circ, back, elastic and bounce in in/out/in-out form). See [Animations](https://www.ripl.run/docs/core/advanced/animations).
- **Type-aware interpolation** — every built-in element declares how its own state tweens, so a colour, gradient, pattern fill, rotation, point set or dash pattern animates without configuration; anything undeclared is detected from the value. The `interpolators` option overrides any property, on a custom element or a built-in one. Point-set morphing matches outlines of differing length by key, so a curve stays curved across the transition.
- **Events** — a typed `EventBus` with bubbling, delegation, `stopPropagation`, `{ self: true }` filtering and disposable subscriptions, plus pixel-accurate hit testing so a pointer event resolves to the element actually drawn under the cursor.
- **14 scale types** — continuous, band, point, discrete, ordinal, diverging, logarithmic, power, symlog, quantile, quantize, threshold, radial and time. See [Scales](https://www.ripl.run/docs/core/advanced/scales).
- **Colour** — parsing and serialisation for hex, `rgb()`/`rgba()`, `hsl()`/`hsla()`, `hsv()`/`hsva()` and the 148 CSS colour keywords, conversion between spaces, alpha manipulation, sequential colour scales and 8 built-in schemes (viridis, plasma, inferno, magma, cividis, turbo, RdBu, BrBG).
- **Gradients and patterns** — linear, radial and conic [gradients](https://www.ripl.run/docs/core/advanced/gradients) (including repeating variants) parsed from CSS gradient strings, and five [pattern](https://www.ripl.run/docs/core/advanced/pattern-fills) tiles (diagonal, cross-hatch, dots, horizontal, vertical). Both are ordinary paint strings, so they inherit and interpolate like any other style.
- **Math** — points, angles, distances, bounding boxes, matrices and polar conversion, plus a [`Navigator`](https://www.ripl.run/docs/core/advanced/navigator) that pans, zooms and brushes by rescaling scale domains rather than scaling geometry, keeping strokes and text crisp.
- **Strict TypeScript, tree-shakable, no third-party runtime dependencies** — the only dependency is [`@ripl/utilities`](https://www.npmjs.com/package/@ripl/utilities), a sibling in this repository.

## Installation

Browser projects should install [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) instead — it re-exports every symbol below alongside the Canvas 2D context, and registers the browser platform bindings that `@ripl/core` needs to measure text and schedule frames.

```bash
# npm
npm install @ripl/core

# yarn
yarn add @ripl/core

# pnpm
pnpm add @ripl/core
```

## Quick start

```typescript
import {
    createCircle,
    createContext,
    createRenderer,
    createScene,
    easeOutCubic,
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
    ease: easeOutCubic,
    state: {
        radius: 100,
        fill: '#ff0000',
    },
});
```

To render the same scene as SVG, import `createContext` from [`@ripl/svg`](https://www.npmjs.com/package/@ripl/svg). Nothing else changes.

## Key API

| Export | What it does |
| --- | --- |
| [`Context`](https://www.ripl.run/docs/core/essentials/context) | The rendering abstraction every backend implements |
| [`Element` / `Shape`](https://www.ripl.run/docs/core/essentials/shape) | Base classes for renderable state, transforms and hit testing |
| [`createGroup`](https://www.ripl.run/docs/core/essentials/group) | Container with inheritance, querying and event bubbling |
| [`createScene`](https://www.ripl.run/docs/core/essentials/scene) | Top-level group bound to a context, with a hoisted render buffer |
| [`createRenderer`](https://www.ripl.run/docs/core/essentials/renderer) | Animation loop and transition manager |
| [`scaleContinuous` … `scaleTime`](https://www.ripl.run/docs/core/advanced/scales) | The 14 scale constructors |
| [`interpolateColor` / `ElementInterpolators`](https://www.ripl.run/docs/core/advanced/interpolators) | Built-in interpolators and the per-property override map |
| [`parseGradient` / `parsePattern`](https://www.ripl.run/docs/core/advanced/gradients) | Paint-string parsing for gradients and pattern tiles |
| [`Navigator`](https://www.ripl.run/docs/core/advanced/navigator) | Pan, zoom and brush over a viewport by rescaling domains |

## Related packages

- [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) — the browser entry point, and what most projects should install
- [`@ripl/canvas`](https://www.npmjs.com/package/@ripl/canvas) / [`@ripl/svg`](https://www.npmjs.com/package/@ripl/svg) / [`@ripl/terminal`](https://www.npmjs.com/package/@ripl/terminal) — the rendering contexts
- [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) — 25 pre-built chart types on top of this package
- [`@ripl/3d`](https://www.npmjs.com/package/@ripl/3d) — 3D shapes, camera, lighting and materials
- [`@ripl/devtools`](https://www.npmjs.com/package/@ripl/devtools) — live scene-graph inspection in the browser devtools

## Documentation

Guides, live demos and the full API reference are at [ripl.run/docs/core](https://www.ripl.run/docs/core/).

## License

[MIT](../../LICENSE)
