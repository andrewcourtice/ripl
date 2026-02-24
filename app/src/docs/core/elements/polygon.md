---
outline: "deep"
---

# Polygon

A **Polygon** draws a regular polygon (triangle, pentagon, hexagon, etc.) defined by a center point, radius, and number of sides.

## Usage

```ts
import { createPolygon } from '@ripl/core';

const hexagon = createPolygon({
    fillStyle: '#3a86ff',
    cx: 200,
    cy: 150,
    radius: 80,
    sides: 6,
});
```

## Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `cx` | `number` | Yes | Center X coordinate |
| `cy` | `number` | Yes | Center Y coordinate |
| `radius` | `number` | Yes | Distance from center to vertex |
| `sides` | `number` | Yes | Number of sides (minimum 3) |

Plus all [Element style properties](/docs/core/essentials/element#style-properties) and [Shape options](/docs/core/essentials/shape#shape-options).

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createPolygon,
} from '@ripl/core';

const context = createContext('.mount-element');

// Triangle
createPolygon({
    fillStyle: '#3a86ff',
    cx: 100,
    cy: 150,
    radius: 60,
    sides: 3,
}).render(context);

// Pentagon
createPolygon({
    fillStyle: '#ff006e',
    cx: 250,
    cy: 150,
    radius: 60,
    sides: 5,
}).render(context);

// Hexagon
createPolygon({
    fillStyle: '#8338ec',
    cx: 400,
    cy: 150,
    radius: 60,
    sides: 6,
}).render(context);
```
:::

<script lang="ts" setup>
import { createPolygon, createText } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 5;

    const shapes = [
        { sides: 3, color: '#3a86ff', label: 'Triangle' },
        { sides: 5, color: '#ff006e', label: 'Pentagon' },
        { sides: 6, color: '#8338ec', label: 'Hexagon' },
        { sides: 8, color: '#fb5607', label: 'Octagon' },
    ];

    const render = () => {
        context.markRenderStart();

        shapes.forEach((shape, i) => {
            const cx = w * (i + 1) / (shapes.length + 1);

            createPolygon({
                fillStyle: shape.color,
                cx, cy: h / 2, radius: r, sides: shape.sides,
            }).render(context);

            createText({
                x: cx, y: h / 2 + r + 20,
                content: shape.label, fillStyle: '#666',
                textAlign: 'center', font: '13px sans-serif',
            }).render(context);
        });

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>
