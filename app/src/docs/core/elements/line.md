---
outline: "deep"
---

# Line

A **Line** draws a straight line between two points (`x1`, `y1`) to (`x2`, `y2`). Lines are stroke-only by default — set the `stroke` property to see them. They're commonly used for axis lines, connectors, separators, and wireframe constructions.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Line Width</span>
            <RiplInputRange v-model="lineWidthVal" :min="1" :max="10" :step="1" @update:model-value="redraw" />
            <span>Dash Gap</span>
            <RiplInputRange v-model="dashGap" :min="0" :max="20" :step="1" @update:model-value="redraw" />
            <span>Angle</span>
            <RiplInputRange v-model="angleDeg" :min="0" :max="360" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
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
    y1: 150,
    x2: 350,
    y2: 150,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createLine,
    createText,
} from '@ripl/core';

import type {
    Context,
} from '@ripl/core';

import {
    ref,
} from 'vue';

const lineWidthVal = ref(3);
const dashGap = ref(0);
const angleDeg = ref(45);
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const cx = w / 2;
    const cy = h / 2;
    const len = Math.min(w, h) * 0.35;
    const angle = angleDeg.value * Math.PI / 180;
    const dash = dashGap.value > 0 ? [dashGap.value, dashGap.value] : [];

    context.batch(() => {
        createLine({
            stroke: '#3a86ff',
            lineWidth: lineWidthVal.value,
            lineDash: dash,
            x1: cx - Math.cos(angle) * len,
            y1: cy - Math.sin(angle) * len,
            x2: cx + Math.cos(angle) * len,
            y2: cy + Math.sin(angle) * len,
        }).render(context);

        createText({
            x: w / 2, y: h - 16,
            content: `width: ${lineWidthVal.value}  dash: ${dashGap.value}  angle: ${angleDeg.value}°`,
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
> For the full property list, see the [Line API Reference](/docs/api/@ripl/core/).
