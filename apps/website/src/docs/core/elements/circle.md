---
title: Circle
description: "Draw a filled or stroked circle from a center point and radius: the simplest shape in Ripl, and the primitive behind scatter markers, dots and node glyphs."
outline: "deep"
---

# Circle

A **Circle** draws a filled and/or stroked circle defined by a center point (`cx`, `cy`) and `radius`. It is the smallest complete example of the element API — state, styling, transforms, events and hit testing all behave here exactly as they do on every other shape. Circles are the usual choice for scatter markers, data point dots, avatar placeholders and graph nodes.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplField label="Radius">
            <RiplInputRange v-model="radius" :min="10" :max="100" :step="1" @update:model-value="redraw" />
        </RiplField>
        <RiplField label="Stroke Width">
            <RiplInputRange v-model="lineWidth" :min="0" :max="10" :step="1" @update:model-value="redraw" />
        </RiplField>
        <RiplField label="Opacity">
            <RiplInputRange v-model="opacity" :min="0" :max="100" :step="1" @update:model-value="redraw" />
        </RiplField>
    </template>
</ripl-example>
== Code
```ts
import {
    createCircle,
    createContext,
} from '@ripl/web';

const context = createContext('.mount-element');

createCircle({
    fill: '#3a86ff',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: 60,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createText,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    ref,
} from 'vue';

const radius = ref(60);
const lineWidth = ref(3);
const opacity = ref(100);
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 3 * (radius.value / 100 + 0.4);

    context.batch(() => {
        createCircle({
            fill: '#3a86ff',
            stroke: '#1a56db',
            lineWidth: lineWidth.value,
            opacity: opacity.value / 100,
            cx: w / 2, cy: h / 2,
            radius: r,
        }).render(context);

        createText({
            x: w / 2, y: h / 2 + r + 24,
            content: `radius: ${Math.round(r)}  lineWidth: ${lineWidth.value}  opacity: ${opacity.value}%`,
            fill: '#666', textAlign: 'center', font: '12px sans-serif',
        }).render(context);
    });
}

const {
    contextChanged
} = useRiplExample(context => {
    currentContext = context;
    renderDemo(context);
    context.on('resize', () => renderDemo(context));
});

function redraw() {
    if (currentContext) renderDemo(currentContext);
}
</script>

## Usage

```ts
import {
    createCircle,
} from '@ripl/web';

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
> For the full property list, see the [Circle API Reference](/docs/api/@ripl/core/).
