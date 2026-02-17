---
outline: "deep"
---

# Line

A **Line** draws a straight line between two points.

## Usage

```ts
import { createLine } from '@ripl/core';

const line = createLine({
    strokeStyle: '#3a86ff',
    lineWidth: 2,
    x1: 50,
    y1: 50,
    x2: 250,
    y2: 200,
});
```

## Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `x1` | `number` | Yes | Start X coordinate |
| `y1` | `number` | Yes | Start Y coordinate |
| `x2` | `number` | Yes | End X coordinate |
| `y2` | `number` | Yes | End Y coordinate |

Plus all [Element style properties](/docs/core/essentials/element#style-properties) and [Shape options](/docs/core/essentials/shape#shape-options).

> [!TIP]
> Lines are stroked by default. Set `strokeStyle` to see the line — `fillStyle` alone won't produce a visible result.

## Demo

:::tabs
== Code
```ts
import { createContext, createLine } from '@ripl/core';

const context = createContext('.mount-element');

createLine({
    strokeStyle: '#3a86ff',
    lineWidth: 3,
    x1: 50, y1: 50,
    x2: context.width - 50, y2: context.height - 50,
}).render(context);
```
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
:::

<script lang="ts" setup>
import { createLine } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const pad = 40;

    const render = () => {
        context.markRenderStart();

        createLine({
            strokeStyle: '#3a86ff', lineWidth: 3,
            x1: pad, y1: pad, x2: w - pad, y2: h - pad,
        }).render(context);

        createLine({
            strokeStyle: '#ff006e', lineWidth: 3,
            x1: w - pad, y1: pad, x2: pad, y2: h - pad,
        }).render(context);

        createLine({
            strokeStyle: '#8338ec', lineWidth: 2,
            lineDash: [8, 4],
            x1: w / 2, y1: pad, x2: w / 2, y2: h - pad,
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>
