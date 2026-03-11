---
outline: "deep"
---

# Circle

A **Circle** draws a filled and/or stroked circle defined by a center point (`cx`, `cy`) and `radius`. It's the simplest shape in Ripl and a great starting point for learning the element API. Circles are commonly used as data point markers, avatar placeholders, decorative elements, and building blocks for more complex visualizations.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Radius</span>
            <RiplInputRange v-model="radius" :min="10" :max="100" :step="1" @update:model-value="redraw" />
            <span>Stroke</span>
            <RiplInputRange v-model="lineWidth" :min="0" :max="10" :step="1" @update:model-value="redraw" />
            <span>Opacity</span>
            <RiplInputRange v-model="opacity" :min="0" :max="100" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
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
} from '@ripl/core';

import type {
    Context,
} from '@ripl/core';

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
            content: `radius: ${Math.round(r)}  stroke: ${lineWidth.value}  opacity: ${opacity.value}%`,
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
