---
outline: "deep"
---

# Circle

A **Circle** draws a filled and/or stroked circle defined by a center point (`cx`, `cy`) and `radius`. It's the simplest shape in Ripl and a great starting point for learning the element API. Circles are commonly used as data point markers, avatar placeholders, decorative elements, and building blocks for more complex visualizations.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createCircle,
    createContext,
} from '@ripl/core';

const context = createContext('.mount-element');

createCircle({
    fill: '#3a86ff',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: Math.min(context.width, context.height) / 3,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
} from '@ripl/core';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;

    const render = () => {
        context.markRenderStart();

        createCircle({
            fill: '#3a86ff',
            stroke: '#1a56db',
            lineWidth: 3,
            cx: w / 2, cy: h / 2,
            radius: Math.min(w, h) / 3,
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
    createCircle,
} from '@ripl/core';

const circle = createCircle({
    fill: '#3a86ff',
    cx: 200,
    cy: 150,
    radius: 60,
});
```

## Properties

The circle's geometry is defined by `cx`, `cy`, and `radius`. All properties are animatable and support style inheritance from parent groups.

> [!NOTE]
> For the full property list, see the [Circle API Reference](/docs/api/core/elements).
