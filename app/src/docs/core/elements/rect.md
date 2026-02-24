---
outline: "deep"
---

# Rect

A **Rect** draws a rectangle with optional rounded corners (border radius).

## Usage

```ts
import { createRect } from '@ripl/core';

const rect = createRect({
    fillStyle: '#3a86ff',
    x: 50,
    y: 50,
    width: 200,
    height: 120,
});
```

## Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `x` | `number` | Yes | Top-left X coordinate |
| `y` | `number` | Yes | Top-left Y coordinate |
| `width` | `number` | Yes | Width |
| `height` | `number` | Yes | Height |
| `borderRadius` | `number \| [number, number, number, number]` | No | Corner radius. A single number applies to all corners. An array sets `[topLeft, topRight, bottomRight, bottomLeft]`. |

Plus all [Element style properties](/docs/core/essentials/element#style-properties) and [Shape options](/docs/core/essentials/shape#shape-options).

## Border Radius

The `borderRadius` property supports both uniform and per-corner values:

```ts
// Uniform radius
createRect({ x: 0, y: 0, width: 200, height: 100, borderRadius: 12 });

// Per-corner: [topLeft, topRight, bottomRight, bottomLeft]
createRect({ x: 0, y: 0, width: 200, height: 100, borderRadius: [12, 0, 12, 0] });
```

## Demo

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
    fillStyle: '#3a86ff',
    x: 50,
    y: 50,
    width: 150,
    height: 100,
}).render(context);

// Rounded corners
createRect({
    fillStyle: '#ff006e',
    x: 250,
    y: 50,
    width: 150,
    height: 100,
    borderRadius: 16,
}).render(context);
```
:::

<script lang="ts" setup>
import { createRect, createText } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

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
            fillStyle: '#3a86ff',
            x: w * 0.15, y: h / 2 - rh / 2, width: rw, height: rh,
        }).render(context);

        createText({
            x: w * 0.15 + rw / 2, y: h / 2 + rh / 2 + 20,
            content: 'Sharp', fillStyle: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createRect({
            fillStyle: '#ff006e',
            x: w * 0.5 - rw / 2, y: h / 2 - rh / 2, width: rw, height: rh,
            borderRadius: 16,
        }).render(context);

        createText({
            x: w * 0.5, y: h / 2 + rh / 2 + 20,
            content: 'Rounded', fillStyle: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createRect({
            fillStyle: '#8338ec',
            x: w * 0.85 - rw, y: h / 2 - rh / 2, width: rw, height: rh,
            borderRadius: [24, 0, 24, 0],
        }).render(context);

        createText({
            x: w * 0.85 - rw / 2, y: h / 2 + rh / 2 + 20,
            content: 'Per-Corner', fillStyle: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>
