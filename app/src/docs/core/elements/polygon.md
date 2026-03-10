---
outline: "deep"
---

# Polygon

A **Polygon** draws a regular polygon (triangle, pentagon, hexagon, etc.) defined by a center point (`cx`, `cy`), `radius` (distance from center to vertex), and `sides` count. Polygons are useful for badges, icons, radar chart backgrounds, and decorative shapes. Increase `sides` to approximate a circle, or use 3 for triangles, 5 for pentagons, 6 for hexagons, and so on.

## Example

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
    fill: '#3a86ff',
    cx: 100,
    cy: 150,
    radius: 60,
    sides: 3,
}).render(context);

// Pentagon
createPolygon({
    fill: '#ff006e',
    cx: 250,
    cy: 150,
    radius: 60,
    sides: 5,
}).render(context);

// Hexagon
createPolygon({
    fill: '#8338ec',
    cx: 400,
    cy: 150,
    radius: 60,
    sides: 6,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createPolygon,
    createText,
} from '@ripl/core';

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
                fill: shape.color,
                cx, cy: h / 2, radius: r, sides: shape.sides,
            }).render(context);

            createText({
                x: cx, y: h / 2 + r + 20,
                content: shape.label, fill: '#666',
                textAlign: 'center', font: '13px sans-serif',
            }).render(context);
        });

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>

## Usage

```ts
import {
    createPolygon,
} from '@ripl/core';

const hexagon = createPolygon({
    fill: '#3a86ff',
    cx: 200,
    cy: 150,
    radius: 80,
    sides: 6,
});
```

## Properties

The polygon's geometry is defined by `cx`, `cy`, `radius`, and `sides`.

> [!NOTE]
> For the full property list, see the [Polygon API Reference](/docs/api/core/elements).
