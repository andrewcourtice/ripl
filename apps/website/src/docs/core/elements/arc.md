---
outline: "deep"
---

# Arc

An **Arc** draws a circular or annular (donut) arc segment defined by a center point, radius, and angular range. It supports `innerRadius` for donut shapes, `padAngle` and `padWidth` for spacing between segments, and `borderRadius` for rounded corners. The `getCentroid()` method returns the visual center of the arc, making it easy to position labels on pie or donut slices.

`padAngle` insets both ends by a fixed **angle**, so the resulting gap is a wedge — narrow at the inner radius and wide at the outer. `padWidth` insets each radius by `asin(padWidth / 2r)` instead, so the gap keeps a constant width in **pixels**. On an annular sector (one with an `innerRadius`) that makes neighbouring segments face each other with parallel edges; an **open** arc has no inner edge to inset, so `padWidth` degenerates to a single trim at the outer radius and adjacent edges converge to nothing at the centre. `padWidth` wins wherever it is **provided** — including `padWidth: 0`, which means *no padding* rather than *fall back to `padAngle`*, so animating `padWidth` up from `0` is continuous.

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
            <span>Pad Angle (set Pad Width to 0)</span>
            <RiplInputRange v-model="padAngleVal" :min="0" :max="20" :step="1" @update:model-value="redraw" />
            <span>Pad Width</span>
            <RiplInputRange v-model="padWidthVal" :min="0" :max="40" :step="1" @update:model-value="redraw" />
            <span>Border Radius</span>
            <RiplInputRange v-model="borderRadiusVal" :min="0" :max="40" :step="1" @update:model-value="redraw" />
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
    endAngle: TAU * 0.25,
    padWidth: 6,
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
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    ref,
} from 'vue';

const TAU = Math.PI * 2;
const SEGMENT_FILLS = ['#3a86ff', '#8338ec', '#ff006e'];
const endAnglePct = ref(75);
const innerRadiusPct = ref(50);
const padAngleVal = ref(0);
const padWidthVal = ref(8);
const borderRadiusVal = ref(6);
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 3;

    context.batch(() => {
        const sweep = TAU * (endAnglePct.value / 100);
        const innerRadius = r * (innerRadiusPct.value / 100);
        const padAngle = padAngleVal.value * 0.01;

        SEGMENT_FILLS.forEach((fill, index) => {
            createArc({
                fill,
                cx: w / 2, cy: h / 2, radius: r,
                innerRadius,
                startAngle: sweep * (index / SEGMENT_FILLS.length),
                endAngle: sweep * ((index + 1) / SEGMENT_FILLS.length),
                padAngle,
                padWidth: padWidthVal.value || undefined,
                borderRadius: borderRadiusVal.value,
            }).render(context);
        });

        createText({
            x: w / 2, y: h / 2 + r + 24,
            content: `sweep: ${Math.round(endAnglePct.value)}%  inner: ${innerRadiusPct.value}%  padAngle: ${padAngleVal.value}  padWidth: ${padWidthVal.value}  radius: ${borderRadiusVal.value}`,
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

The arc's geometry is defined by `cx`, `cy`, `radius`, `startAngle`, and `endAngle`. Optional properties include `innerRadius` (for donut arcs), `padAngle` (angular spacing between segments, in radians), `padWidth` (constant-width spacing between segments, in pixels — takes precedence over `padAngle` wherever it is provided), and `borderRadius` (corner rounding).

`borderRadius` is a single number — unlike the Rect family, an annular sector has no meaningful per-corner order, so the `[tl, tr, br, bl]` tuple form is not accepted. It is clamped to half the band thickness (`(radius - innerRadius) / 2`) and to what the sector's span allows, so an over-rounded segment degrades into a capsule rather than self-intersecting. An annular sector rounds all four corners; an open arc rounds its two outer corners and keeps a sharp center point. Padding is applied before rounding, so gaps stay constant.

> [!WARNING]
> On an **open** arc (no `innerRadius`), `borderRadius` also changes the path's topology. At `borderRadius: 0` the arc is a bare arc command, which a fill closes with a chord — a circular *segment*. Any non-zero `borderRadius` closes the path through the centre instead, making it a *wedge*. Filled area, the `isPointInPath` hit region, and the stroke (which gains two radial spokes to the centre) all jump at that boundary, so do not animate an open arc's `borderRadius` up from `0`. Annular sectors are unaffected — set an `innerRadius` if you need to animate corner rounding.

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
