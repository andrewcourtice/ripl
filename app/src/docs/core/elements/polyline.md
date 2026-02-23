---
outline: "deep"
---

# Polyline

A **Polyline** draws a series of connected line segments through a set of points. It supports multiple rendering modes including smooth curves, splines, step functions, and more.

## Usage

```ts
import { createPolyline } from '@ripl/core';

const polyline = createPolyline({
    strokeStyle: '#3a86ff',
    lineWidth: 2,
    points: [[50, 150], [100, 50], [200, 180], [300, 80], [400, 120]],
});
```

## Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `points` | `[number, number][]` | Yes | Array of `[x, y]` coordinate pairs |
| `renderer` | `string \| function` | No | Rendering mode (default: `'linear'`) |

Plus all [Element style properties](/docs/core/essentials/element#style-properties) and [Shape options](/docs/core/essentials/shape#shape-options).

## Renderer Modes

The `renderer` property controls how points are connected. Ripl provides 13 built-in renderers:

| Renderer | Description |
| --- | --- |
| `'linear'` | Straight line segments (default) |
| `'spline'` | Smooth spline curve with configurable tension |
| `'basis'` | Cubic B-spline interpolation |
| `'bumpX'` | Smooth bump curve along the X axis |
| `'bumpY'` | Smooth bump curve along the Y axis |
| `'cardinal'` | Cardinal spline with configurable tension |
| `'catmullRom'` | Catmull-Rom spline |
| `'monotoneX'` | Monotone cubic interpolation (preserves monotonicity in X) |
| `'monotoneY'` | Monotone cubic interpolation (preserves monotonicity in Y) |
| `'natural'` | Natural cubic spline |
| `'step'` | Step function (midpoint) |
| `'stepBefore'` | Step function (step before point) |
| `'stepAfter'` | Step function (step after point) |

```ts
const smoothLine = createPolyline({
    strokeStyle: '#3a86ff',
    lineWidth: 2,
    points: [[50, 150], [100, 50], [200, 180], [300, 80]],
    renderer: 'spline',
});
```

### Custom Renderer

You can also pass a custom render function:

```ts
const custom = createPolyline({
    strokeStyle: '#3a86ff',
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

## Demo

The demo below shows the same set of points rendered with different renderer modes.

:::tabs
== Code
```ts
import { createContext, createPolyline } from '@ripl/core';

const context = createContext('.mount-element');
const points = [[50, 150], [120, 40], [200, 180], [300, 60], [400, 140]];

createPolyline({
    strokeStyle: '#3a86ff', lineWidth: 2,
    points, renderer: 'spline',
}).render(context);
```
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <select class="ripl-select" v-model="currentRenderer">
                <option v-for="r in renderers" :key="r" :value="r">{{ r }}</option>
            </select>
        </div>
    </template>
</ripl-example>
:::

<script lang="ts" setup>
import { ref, watch } from 'vue';
import { createPolyline, createCircle, createText } from '@ripl/core';
import type { Context, PolylineRenderer } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

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
        strokeStyle: '#3a86ff',
        lineWidth: 3,
        points,
        renderer: currentRenderer.value,
    }).render(context);

    points.forEach(([x, y]) => {
        createCircle({
            fillStyle: '#ff006e',
            cx: x, cy: y, radius: 4,
        }).render(context);
    });

    createText({
        x: w / 2, y: h - 12,
        content: `renderer: '${currentRenderer.value}'`,
        fillStyle: '#666', textAlign: 'center', font: '13px sans-serif',
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
