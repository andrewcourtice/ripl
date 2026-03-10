---
outline: "deep"
---

# Arc

An **Arc** draws a circular or annular (donut) arc segment defined by a center point, radius, and angular range. It supports `innerRadius` for donut shapes, `padAngle` for spacing between segments, and `borderRadius` for rounded corners. The `getCentroid()` method returns the visual center of the arc, making it easy to position labels on pie or donut slices.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createArc,
} from '@ripl/core';

const TAU = Math.PI * 2;

// Simple arc
createArc({
    fill: '#3a86ff',
    cx: 150,
    cy: 150,
    radius: 80,
    startAngle: 0,
    endAngle: TAU * 0.75,
}).render(context);

// Donut arc
createArc({
    fill: '#ff006e',
    cx: 400,
    cy: 150,
    radius: 80,
    innerRadius: 40,
    startAngle: 0,
    endAngle: TAU * 0.6,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createArc,
    createText,
} from '@ripl/core';

import {
    ref,
    watch,
} from 'vue';

const TAU = Math.PI * 2;

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 4;

    const render = () => {
        context.markRenderStart();

        createArc({
            fill: '#3a86ff',
            cx: w * 0.3, cy: h / 2, radius: r,
            startAngle: 0, endAngle: TAU * 0.75,
        }).render(context);

        createText({
            x: w * 0.3, y: h / 2 + r + 24,
            content: 'Simple Arc', fill: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createArc({
            fill: '#ff006e',
            cx: w * 0.7, cy: h / 2, radius: r,
            innerRadius: r * 0.5,
            startAngle: 0, endAngle: TAU * 0.6,
        }).render(context);

        createText({
            x: w * 0.7, y: h / 2 + r + 24,
            content: 'Donut Arc', fill: '#666',
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
    createArc,
} from '@ripl/core';

const arc = createArc({
    fill: '#3a86ff',
    cx: 200,
    cy: 200,
    radius: 100,
    startAngle: 0,
    endAngle: Math.PI,
});
```

## Properties

The arc's geometry is defined by `cx`, `cy`, `radius`, `startAngle`, and `endAngle`. Optional properties include `innerRadius` (for donut arcs), `padAngle` (spacing between segments), and `borderRadius` (corner rounding).

> [!NOTE]
> For the full property list, see the [Arc API Reference](/docs/api/core/elements).

## Methods

### `getCentroid(alterations?)`

Returns the centroid point `[x, y]` of the arc segment. Useful for positioning labels at the visual center of a pie/donut slice:

```ts
const [labelX, labelY] = arc.getCentroid();
```

You can pass partial state alterations to compute the centroid at a different radius:

```ts
const [x, y] = arc.getCentroid({ radius: arc.radius * 1.2 });
```
