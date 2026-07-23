---
outline: "deep"
---

# Canvas Context

The **Canvas context** is the default rendering backend in Ripl. It renders elements to an HTML `<canvas>` element using the Canvas 2D API, handling DPR (device pixel ratio) scaling automatically so your content looks crisp on Retina displays. It also parses CSS gradient strings directly in `fill` and `stroke` properties, converting them to native `CanvasGradient` objects behind the scenes.

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createCircle,
    createContext,
    createRect,
} from '@ripl/web';

// Creates a canvas context by default
const context = createContext('.mount-element');

createCircle({
    fill: 'linear-gradient(135deg, #3a86ff, #8338ec)',
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
:::

## Usage

The canvas context is created by importing `createContext` from `@ripl/core`:

```ts
import {
    createContext,
} from '@ripl/web';

const context = createContext('.my-container');
```

You can also pass an `HTMLElement` directly:

```ts
const container = document.getElementById('my-container');
const context = createContext(container);
```

## DPR Scaling

The canvas context automatically scales the canvas to match the device pixel ratio (DPR). This ensures crisp rendering on high-DPI displays (e.g. Retina screens). The scaling is transparent — you work in CSS pixel coordinates and Ripl handles the rest.

```ts
// These coordinates are in CSS pixels, not physical pixels
const circle = createCircle({
    cx: context.width / 2, // CSS pixel width
    cy: context.height / 2, // CSS pixel height
    radius: 50,
});
```

## Gradient Support

The canvas context supports CSS gradient strings directly in `fill` and `stroke`. Ripl parses the CSS gradient syntax and converts it to native `CanvasGradient` objects:

```ts
const rect = createRect({
    x: 0,
    y: 0,
    width: 200,
    height: 100,
    fill: 'linear-gradient(90deg, #3a86ff, #ff006e)',
});
```

See [Gradients](/docs/core/advanced/gradients) for the full gradient syntax reference.

## Canvas-Specific Methods

The canvas context provides all the standard [Context](/docs/core/essentials/context) methods, plus canvas-specific behaviors like `rotate`, `scale`, `translate`, `setTransform`, `measureText`, `applyClip`, and path-based hit testing (`isPointInPath`, `isPointInStroke`).

> [!NOTE]
> For the full API, see the [Canvas Context API Reference](/docs/api/@ripl/core/).

## When to Use Canvas

Canvas is the best choice when:

- **Performance is critical** — Canvas is generally faster for rendering many elements per frame
- **Pixel-level operations** — Canvas supports `getImageData`/`putImageData` for pixel manipulation
- **Complex animations** — Canvas clears and redraws efficiently each frame

Canvas is less ideal when:

- You need DOM accessibility for rendered elements
- You need to inspect or style individual elements via browser DevTools
- You need CSS animations on individual rendered elements

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createRect,
} from '@ripl/web';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 4;

    const render = () => {
        context.batch(() => {
            createCircle({
                fill: 'linear-gradient(135deg, #3a86ff, #8338ec)',
                cx: w / 3, cy: h / 2, radius: r,
            }).render(context);

            createRect({
                fill: 'linear-gradient(45deg, #ff006e, #fb5607)',
                x: w / 2, y: h / 4,
                width: w / 3, height: h / 2,
            }).render(context);
        });
    };

    render();
    context.on('resize', render);
});
</script>
