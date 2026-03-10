---
outline: "deep"
---

# Arc

An **Arc** draws a circular or annular (donut) arc segment defined by a center point, radius, and angular range. It supports `innerRadius` for donut shapes, `padAngle` for spacing between segments, and `borderRadius` for rounded corners. The `getCentroid()` method returns the visual center of the arc, making it easy to position labels on pie or donut slices.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>End Angle</span>
            <RiplInputRange v-model="endAnglePct" :min="0" :max="100" :step="1" @update:model-value="redraw" />
            <span>Inner Radius %</span>
            <RiplInputRange v-model="innerRadiusPct" :min="0" :max="90" :step="1" @update:model-value="redraw" />
            <span>Pad Angle</span>
            <RiplInputRange v-model="padAngleVal" :min="0" :max="20" :step="1" @update:model-value="redraw" />
            <span>Border Radius</span>
            <RiplInputRange v-model="borderRadiusVal" :min="0" :max="20" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createArc,
} from '@ripl/core';

const TAU = Math.PI * 2;

createArc({
    fill: '#3a86ff',
    cx: 200,
    cy: 150,
    radius: 80,
    innerRadius: 40,
    startAngle: 0,
    endAngle: TAU * 0.75,
    padAngle: 0.05,
    borderRadius: 4,
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

import type {
    Context,
} from '@ripl/core';

import {
    ref,
} from 'vue';

const TAU = Math.PI * 2;
const endAnglePct = ref(75);
const innerRadiusPct = ref(50);
const padAngleVal = ref(2);
const borderRadiusVal = ref(4);
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 3;

    context.clear();
    context.markRenderStart();

    const endAngle = TAU * (endAnglePct.value / 100);
    const innerRadius = r * (innerRadiusPct.value / 100);
    const padAngle = padAngleVal.value * 0.01;

    createArc({
        fill: '#3a86ff',
        cx: w / 2, cy: h / 2, radius: r,
        innerRadius,
        startAngle: 0,
        endAngle,
        padAngle,
        borderRadius: borderRadiusVal.value,
    }).render(context);

    createText({
        x: w / 2, y: h / 2 + r + 24,
        content: `endAngle: ${Math.round(endAnglePct.value)}%  inner: ${innerRadiusPct.value}%  pad: ${padAngleVal.value}  radius: ${borderRadiusVal.value}`,
        fill: '#666', textAlign: 'center', font: '12px sans-serif',
    }).render(context);

    context.markRenderEnd();
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
