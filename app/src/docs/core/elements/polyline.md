---
outline: "deep"
---

# Polyline

A **Polyline** draws a series of connected line segments through a set of `[x, y]` points. What makes Ripl's polyline powerful is its `renderer` property — choose from 13 built-in curve algorithms (spline, cardinal, catmull-rom, monotone, step, and more) or supply a custom render function. This makes it the go-to element for line charts, sparklines, data paths, and any visualization involving connected data points.

## Example

The demo below shows the same set of points rendered with different renderer modes.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplSelect v-model="currentRenderer">
                <option v-for="r in renderers" :key="r" :value="r">{{ r }}</option>
            </RiplSelect>
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createContext,
    createPolyline,
} from '@ripl/core';

const context = createContext('.mount-element');
const points = [[50, 150], [120, 40], [200, 180], [300, 60], [400, 140]];

createPolyline({
    stroke: '#3a86ff',
    lineWidth: 2,
    points,
    renderer: 'spline',
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createPolyline,
    createText,
} from '@ripl/core';

import type {
    Context,
    PolylineRenderer,
} from '@ripl/core';

import {
    ref,
    watch,
} from 'vue';

const renderers: PolylineRenderer[] = ['linear', 'spline', 'basis', 'bumpX', 'bumpY', 'cardinal', 'catmullRom', 'monotoneX', 'natural', 'step'];
const currentRenderer = ref<PolylineRenderer>('spline');

let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const pad = 40;

    const points: [number, number][] = [
        [pad, h * 0.6],
        [w * 0.2, h * 0.2],
        [w * 0.35, h * 0.7],
        [w * 0.5, h * 0.3],
        [w * 0.65, h * 0.8],
        [w * 0.8, h * 0.25],
        [w - pad, h * 0.5],
    ];

    context.clear();
    context.markRenderStart();

    createPolyline({
        stroke: '#3a86ff',
        lineWidth: 3,
        points,
        renderer: currentRenderer.value,
    }).render(context);

    points.forEach(([x, y]) => {
        createCircle({
            fill: '#ff006e',
            cx: x, cy: y, radius: 4,
        }).render(context);
    });

    createText({
        x: w / 2, y: h - 12,
        content: `renderer: '${currentRenderer.value}'`,
        fill: '#666', textAlign: 'center', font: '13px sans-serif',
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

watch(currentRenderer, () => {
    if (currentContext) renderDemo(currentContext);
});
</script>

## Usage

```ts
import {
    createPolyline,
} from '@ripl/core';

const polyline = createPolyline({
    stroke: '#3a86ff',
    lineWidth: 2,
    points: [[50, 150], [100, 50], [200, 180], [300, 80], [400, 120]],
});
```

## Properties

The polyline is defined by `points` (an array of `[x, y]` tuples) and an optional `renderer` mode (default: `'linear'`).

> [!NOTE]
> For the full property list, see the [Polyline API Reference](/docs/api/core/elements).

## Renderer Modes

The `renderer` property controls how points are connected. Built-in options include `'linear'`, `'spline'`, `'basis'`, `'bumpX'`, `'bumpY'`, `'cardinal'`, `'catmullRom'`, `'monotoneX'`, `'monotoneY'`, `'natural'`, `'step'`, `'stepBefore'`, and `'stepAfter'`. Use the interactive demo above to preview each mode.

```ts
const smoothLine = createPolyline({
    stroke: '#3a86ff',
    lineWidth: 2,
    points: [[50, 150], [100, 50], [200, 180], [300, 80]],
    renderer: 'spline',
});
```

### Custom Renderer

You can also pass a custom render function:

```ts
const custom = createPolyline({
    stroke: '#3a86ff',
    lineWidth: 2,
    points: myPoints,
    renderer: (context, path, points) => {
        // Custom drawing logic using the path API
        path.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            path.lineTo(points[i][0], points[i][1]);
        }
    },
});
```
