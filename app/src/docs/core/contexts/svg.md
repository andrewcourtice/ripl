---
outline: "deep"
---

# SVG Context

The **SVG context** renders elements to an SVG DOM tree instead of a canvas bitmap. It provides the same unified API as the Canvas context, so your drawing code works identically — just change the import.

## Installation

The SVG context is provided by the `@ripl/svg` package:

```bash
npm install @ripl/svg
```

## Usage

Import `createContext` from `@ripl/svg` instead of `@ripl/core`:

```ts
import { createContext } from '@ripl/svg';
import { createCircle } from '@ripl/core';

const context = createContext('.my-container');

const circle = createCircle({
    fillStyle: '#3a86ff',
    cx: 100, cy: 100, radius: 50,
});

circle.render(context);
```

That's it — the same element code renders to SVG with no other changes.

## How It Works

Under the hood, the SVG context:

1. Creates an `<svg>` element inside your container
2. Maintains a **virtual tree** of SVG element definitions
3. On each render pass, **reconciles** the virtual tree against the real SVG DOM
4. Only creates, updates, or removes DOM nodes that have actually changed

This approach minimizes DOM mutations for better performance, similar to how virtual DOM libraries work.

## Buffered Rendering

The SVG context uses **buffered rendering** by default (`buffer: true`). This means DOM updates are batched and flushed once per animation frame via `requestAnimationFrame`, rather than applied synchronously after each element render.

```ts
// Buffer is true by default for SVG
const context = createContext('.container');

// Disable buffering for immediate DOM updates
const context = createContext('.container', { buffer: false });
```

## Gradient Support

Like the Canvas context, the SVG context supports CSS gradient strings. Gradients are automatically converted to SVG `<linearGradient>` and `<radialGradient>` elements inside a `<defs>` block:

```ts
const rect = createRect({
    fillStyle: 'linear-gradient(90deg, #3a86ff, #ff006e)',
    x: 0, y: 0, width: 200, height: 100,
});
```

Gradient definitions are cached and reused efficiently. When a gradient string changes, only the gradient element is updated rather than recreated.

## Group Hierarchy

The SVG context preserves the group hierarchy from your Ripl scene graph. Groups are rendered as `<g>` elements in the SVG DOM, maintaining the logical structure.

## Hit Testing

The SVG context uses native SVG hit testing methods (`isPointInFill`, `isPointInStroke`) on the actual SVG geometry elements, providing accurate pointer event detection.

## When to Use SVG

SVG is the best choice when:

- **DOM accessibility** — SVG elements are part of the DOM and can be inspected in DevTools
- **CSS styling** — Individual elements can be targeted with CSS
- **Scalability** — SVG scales perfectly at any zoom level without pixelation
- **Small element counts** — SVG performs well with hundreds of elements

SVG is less ideal when:

- Rendering thousands of elements per frame (Canvas is faster for large counts)
- You need pixel-level manipulation
- Frame-by-frame animation performance is critical

## Demo

Toggle between Canvas and SVG using the buttons above the demo. The same drawing code renders to both contexts.

:::tabs
== Code
```ts
import { createContext } from '@ripl/svg';
import { createCircle, createRect } from '@ripl/core';

const context = createContext('.mount-element');

createCircle({
    fillStyle: '#3a86ff',
    strokeStyle: '#1a56db',
    lineWidth: 2,
    cx: context.width / 3,
    cy: context.height / 2,
    radius: Math.min(context.width, context.height) / 4,
}).render(context);

createRect({
    fillStyle: '#ff006e',
    strokeStyle: '#c9184a',
    lineWidth: 2,
    x: context.width / 2,
    y: context.height / 4,
    width: context.width / 3,
    height: context.height / 2,
}).render(context);
```
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
:::

<script lang="ts" setup>
import { createCircle, createRect, createText } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 4;

    const render = () => {
        context.markRenderStart();

        createCircle({
            fillStyle: '#3a86ff',
            strokeStyle: '#1a56db',
            lineWidth: 2,
            cx: w / 3, cy: h / 2, radius: r,
        }).render(context);

        createRect({
            fillStyle: '#ff006e',
            strokeStyle: '#c9184a',
            lineWidth: 2,
            x: w / 2, y: h / 4,
            width: w / 3, height: h / 2,
        }).render(context);

        createText({
            x: w / 2, y: h - 20,
            content: `Rendering to: ${context.type.toUpperCase()}`,
            fillStyle: '#666',
            textAlign: 'center',
            font: '14px sans-serif',
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>
