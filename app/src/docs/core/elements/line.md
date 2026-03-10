---
outline: "deep"
---

# Line

A **Line** draws a straight line between two points (`x1`, `y1`) to (`x2`, `y2`). Lines are stroke-only by default — set the `stroke` property to see them. They're commonly used for axis lines, connectors, separators, and wireframe constructions.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createLine,
} from '@ripl/core';

const context = createContext('.mount-element');

createLine({
    stroke: '#3a86ff',
    lineWidth: 3,
    x1: 50,
    y1: 50,
    x2: context.width - 50,
    y2: context.height - 50,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createLine,
} from '@ripl/core';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const pad = 40;

    const render = () => {
        context.markRenderStart();

        createLine({
            stroke: '#3a86ff', lineWidth: 3,
            x1: pad, y1: pad, x2: w - pad, y2: h - pad,
        }).render(context);

        createLine({
            stroke: '#ff006e', lineWidth: 3,
            x1: w - pad, y1: pad, x2: pad, y2: h - pad,
        }).render(context);

        createLine({
            stroke: '#8338ec', lineWidth: 2,
            lineDash: [8, 4],
            x1: w / 2, y1: pad, x2: w / 2, y2: h - pad,
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
    createLine,
} from '@ripl/core';

const line = createLine({
    stroke: '#3a86ff',
    lineWidth: 2,
    x1: 50,
    y1: 50,
    x2: 250,
    y2: 200,
});
```

## Properties

The line's geometry is defined by `x1`, `y1`, `x2`, and `y2`.

> [!TIP]
> Lines are stroked by default. Set `stroke` to see the line — `fill` alone won't produce a visible result.

> [!NOTE]
> For the full property list, see the [Line API Reference](/docs/api/core/elements).
