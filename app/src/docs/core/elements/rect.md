---
outline: "deep"
---

# Rect

A **Rect** draws a rectangle defined by position (`x`, `y`) and dimensions (`width`, `height`), with optional rounded corners via `borderRadius`. Rects are one of the most versatile shapes in Ripl — used for backgrounds, cards, bar chart segments, progress indicators, and layout scaffolding. The `borderRadius` property accepts a single number for uniform rounding or a `[topLeft, topRight, bottomRight, bottomLeft]` array for per-corner control.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createRect,
} from '@ripl/core';

const context = createContext('.mount-element');

// Sharp corners
createRect({
    fill: '#3a86ff',
    x: 50,
    y: 50,
    width: 150,
    height: 100,
}).render(context);

// Rounded corners
createRect({
    fill: '#ff006e',
    x: 250,
    y: 50,
    width: 150,
    height: 100,
    borderRadius: 16,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createRect,
    createText,
} from '@ripl/core';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const rw = w / 4;
    const rh = h / 3;

    const render = () => {
        context.markRenderStart();

        createRect({
            fill: '#3a86ff',
            x: w * 0.15, y: h / 2 - rh / 2, width: rw, height: rh,
        }).render(context);

        createText({
            x: w * 0.15 + rw / 2, y: h / 2 + rh / 2 + 20,
            content: 'Sharp', fill: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createRect({
            fill: '#ff006e',
            x: w * 0.5 - rw / 2, y: h / 2 - rh / 2, width: rw, height: rh,
            borderRadius: 16,
        }).render(context);

        createText({
            x: w * 0.5, y: h / 2 + rh / 2 + 20,
            content: 'Rounded', fill: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createRect({
            fill: '#8338ec',
            x: w * 0.85 - rw, y: h / 2 - rh / 2, width: rw, height: rh,
            borderRadius: [24, 0, 24, 0],
        }).render(context);

        createText({
            x: w * 0.85 - rw / 2, y: h / 2 + rh / 2 + 20,
            content: 'Per-Corner', fill: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>

## Usage

```ts
import {
    createRect,
} from '@ripl/core';

const rect = createRect({
    fill: '#3a86ff',
    x: 50,
    y: 50,
    width: 200,
    height: 120,
});
```

## Properties

The rect's geometry is defined by `x`, `y`, `width`, `height`, and optional `borderRadius`.

> [!NOTE]
> For the full property list, see the [Rect API Reference](/docs/api/core/elements).
