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
} from '@ripl/web';

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
    useDemoElements,
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createArc,
    createText,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    ref,
} from 'vue';

const TAU = Math.PI * 2;
const endAnglePct = ref(75);
const innerRadiusPct = ref(50);
const padAngleVal = ref(2);
const borderRadiusVal = ref(4);
let currentContext: Context | undefined;

// Built once, on first render, so ids stay stable and every id-keyed cache hits.
const getElements = useDemoElements(() => {
    const arc = createArc({
        fill: '#3a86ff',
        cx: 0,
        cy: 0,
        radius: 0,
        innerRadius: 0,
        startAngle: 0,
        endAngle: 0,
    });

    const label = createText({
        x: 0,
        y: 0,
        content: '',
        fill: '#666',
        textAlign: 'center',
        font: '12px sans-serif',
    });

    return {
        arc,
        label,
    };
});

function renderDemo(context: Context) {
    const {
        arc,
        label,
    } = getElements();

    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 3;

    arc.cx = w / 2;
    arc.cy = h / 2;
    arc.radius = r;
    arc.innerRadius = r * (innerRadiusPct.value / 100);
    arc.endAngle = TAU * (endAnglePct.value / 100);
    arc.padAngle = padAngleVal.value * 0.01;
    arc.borderRadius = borderRadiusVal.value;

    label.x = w / 2;
    label.y = h / 2 + r + 24;
    label.content = `endAngle: ${Math.round(endAnglePct.value)}%  inner: ${innerRadiusPct.value}%  pad: ${padAngleVal.value}  radius: ${borderRadiusVal.value}`;

    context.batch(() => {
        arc.render(context);
        label.render(context);
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
    createArc,
} from '@ripl/web';

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
> For the full property list, see the [Arc API Reference](/docs/api/@ripl/core/).

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
