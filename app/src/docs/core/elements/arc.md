---
outline: "deep"
---

# Arc

An **Arc** draws a circular or annular (donut) arc segment. It supports inner radius for donut shapes, pad angles for spacing between segments, and provides a `getCentroid()` method useful for positioning labels.

## Usage

```ts
import { createArc } from '@ripl/core';

const arc = createArc({
    fillStyle: '#3a86ff',
    cx: 200,
    cy: 200,
    radius: 100,
    startAngle: 0,
    endAngle: Math.PI,
});
```

## Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `cx` | `number` | Yes | Center X coordinate |
| `cy` | `number` | Yes | Center Y coordinate |
| `radius` | `number` | Yes | Outer radius |
| `startAngle` | `number` | Yes | Start angle in radians |
| `endAngle` | `number` | Yes | End angle in radians |
| `innerRadius` | `number` | No | Inner radius (creates a donut/annular arc) |
| `padAngle` | `number` | No | Padding angle in radians between segments |
| `borderRadius` | `number` | No | Corner rounding radius |

Plus all [Element style properties](/docs/core/essentials/element#style-properties) and [Shape options](/docs/core/essentials/shape#shape-options).

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

## Demo

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
    fillStyle: '#3a86ff',
    cx: 150,
    cy: 150,
    radius: 80,
    startAngle: 0,
    endAngle: TAU * 0.75,
}).render(context);

// Donut arc
createArc({
    fillStyle: '#ff006e',
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
import { ref, watch } from 'vue';
import { createArc, createText } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

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
            fillStyle: '#3a86ff',
            cx: w * 0.3, cy: h / 2, radius: r,
            startAngle: 0, endAngle: TAU * 0.75,
        }).render(context);

        createText({
            x: w * 0.3, y: h / 2 + r + 24,
            content: 'Simple Arc', fillStyle: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createArc({
            fillStyle: '#ff006e',
            cx: w * 0.7, cy: h / 2, radius: r,
            innerRadius: r * 0.5,
            startAngle: 0, endAngle: TAU * 0.6,
        }).render(context);

        createText({
            x: w * 0.7, y: h / 2 + r + 24,
            content: 'Donut Arc', fillStyle: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>
