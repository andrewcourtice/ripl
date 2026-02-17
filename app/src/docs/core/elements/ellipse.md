---
outline: "deep"
---

# Ellipse

An **Ellipse** draws an elliptical shape with independent X and Y radii, rotation, and optional start/end angles for partial ellipses.

## Usage

```ts
import { createEllipse } from '@ripl/core';

const ellipse = createEllipse({
    fillStyle: '#3a86ff',
    cx: 200,
    cy: 150,
    radiusX: 100,
    radiusY: 60,
    rotation: 0,
    startAngle: 0,
    endAngle: Math.PI * 2,
});
```

## Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `cx` | `number` | Yes | Center X coordinate |
| `cy` | `number` | Yes | Center Y coordinate |
| `radiusX` | `number` | Yes | Horizontal radius |
| `radiusY` | `number` | Yes | Vertical radius |
| `rotation` | `number` | Yes | Rotation angle in radians |
| `startAngle` | `number` | Yes | Start angle in radians |
| `endAngle` | `number` | Yes | End angle in radians |

Plus all [Element style properties](/docs/core/essentials/element#style-properties) and [Shape options](/docs/core/essentials/shape#shape-options).

## Demo

:::tabs
== Code
```ts
import { createContext, createEllipse } from '@ripl/core';

const context = createContext('.mount-element');
const TAU = Math.PI * 2;

createEllipse({
    fillStyle: '#3a86ff',
    cx: context.width / 2,
    cy: context.height / 2,
    radiusX: context.width / 4,
    radiusY: context.height / 4,
    rotation: 0,
    startAngle: 0,
    endAngle: TAU,
}).render(context);
```
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
:::

<script lang="ts" setup>
import { createEllipse, createText } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const TAU = Math.PI * 2;

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;

    const render = () => {
        context.markRenderStart();

        createEllipse({
            fillStyle: '#3a86ff',
            cx: w * 0.3, cy: h / 2,
            radiusX: w / 6, radiusY: h / 5,
            rotation: 0, startAngle: 0, endAngle: TAU,
        }).render(context);

        createText({
            x: w * 0.3, y: h / 2 + h / 5 + 24,
            content: 'No Rotation', fillStyle: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createEllipse({
            fillStyle: '#ff006e',
            cx: w * 0.7, cy: h / 2,
            radiusX: w / 6, radiusY: h / 5,
            rotation: Math.PI / 6, startAngle: 0, endAngle: TAU,
        }).render(context);

        createText({
            x: w * 0.7, y: h / 2 + h / 5 + 24,
            content: 'Rotated 30°', fillStyle: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>
