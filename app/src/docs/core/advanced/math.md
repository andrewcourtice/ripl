---
outline: "deep"
---

# Math & Geometry

Ripl ships with a focused set of math and geometry utilities used throughout the rendering engine. These cover angle conversion, point operations, bounding boxes, polygon generation, SVG path sampling, and common numeric helpers like `numberClamp`, `numberMin`/`numberMax`, and extent calculation.

> [!NOTE]
> For the full API, see the [Math & Geometry API Reference](/docs/api/@ripl/core/).

## Demo

The demo below visualizes several geometry utilities: polygon vertex generation, midpoints, waypoints, and bounding boxes.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Sides</span>
            <RiplInputRange v-model="sides" :min="3" :max="12" :step="1" @update:model-value="redraw" />
            <span>Waypoint %</span>
            <RiplInputRange v-model="waypoint" :min="0" :max="100" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    geometryContainingBox,
    geometryMidpoint,
    geometryPolygonPoints,
    geometryWaypoint,
} from '@ripl/web';

const points = geometryPolygonPoints(6, 200, 150, 80);
const mid = geometryMidpoint(points[0], points[3]);
const wp = geometryWaypoint(points[0], points[3], 0.75);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createLine,
    createPolygon,
    createRect,
    createText,
    geometryContainingBox,
    geometryMidpoint,
    geometryPolygonPoints,
    geometryWaypoint,
    Box,
} from '@ripl/web';

import type {
    Context,
    Point,
} from '@ripl/web';

import {
    ref,
    watch,
} from 'vue';

const sides = ref(6);
const waypoint = ref(50);
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const cx = w * 0.35;
    const cy = h / 2;
    const r = Math.min(w * 0.25, h * 0.35);

    context.batch(() => {
        const points = geometryPolygonPoints(sides.value, cx, cy, r, false);

        createPolygon({
            fill: 'rgba(58, 134, 255, 0.15)',
            stroke: '#3a86ff',
            lineWidth: 2,
            cx, cy, radius: r, sides: sides.value,
        }).render(context);

        points.forEach(([px, py], i) => {
            createCircle({ fill: '#3a86ff', cx: px, cy: py, radius: 4 }).render(context);
            createText({
                fill: '#666', x: px, y: py - 10,
                content: `P${i}`, font: '11px sans-serif', textAlign: 'center',
            }).render(context);
        });

        if (points.length >= 2) {
            const p0 = points[0];
            const pLast = points[Math.floor(points.length / 2)];

            createLine({
                stroke: '#999', lineWidth: 1, lineDash: [4, 4],
                x1: p0[0], y1: p0[1], x2: pLast[0], y2: pLast[1],
            }).render(context);

            const mid = geometryMidpoint(p0, pLast);
            createCircle({ fill: '#ff006e', cx: mid[0], cy: mid[1], radius: 5 }).render(context);
            createText({
                fill: '#ff006e', x: mid[0] + 10, y: mid[1] - 8,
                content: 'midpoint', font: '11px sans-serif',
            }).render(context);

            const wp = geometryWaypoint(p0, pLast, waypoint.value / 100);
            createCircle({ fill: '#8338ec', cx: wp[0], cy: wp[1], radius: 5 }).render(context);
            createText({
                fill: '#8338ec', x: wp[0] + 10, y: wp[1] + 14,
                content: `waypoint(${waypoint.value}%)`, font: '11px sans-serif',
            }).render(context);
        }

        const bbox = geometryContainingBox(points, ([x, y]) => new Box(y, x, y, x));
        createRect({
            stroke: '#fb5607', lineWidth: 1, lineDash: [4, 4],
            autoFill: false,
            x: bbox.left, y: bbox.top,
            width: bbox.width, height: bbox.height,
        }).render(context);

        createText({
            fill: '#fb5607', x: bbox.left, y: bbox.top - 6,
            content: 'bounding box', font: '11px sans-serif',
        }).render(context);

        const infoX = w * 0.68;
        const infoY = h * 0.2;
        const info = [
            `Sides: ${sides.value}`,
            `Vertices: ${points.length}`,
            `Box: ${Math.round(bbox.width)}×${Math.round(bbox.height)}`,
        ];

        info.forEach((line, i) => {
            createText({
                fill: '#333', x: infoX, y: infoY + i * 22,
                content: line, font: '13px sans-serif',
            }).render(context);
        });
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

## Points

A `Point` is a simple `[x, y]` tuple used throughout Ripl:

```ts
import type {
    Point,
} from '@ripl/web';

const p: Point = [100, 200];
```

### Midpoint and Waypoint

```ts
import {
    geometryMidpoint,
    geometryWaypoint,
} from '@ripl/web';

const a: Point = [0, 0];
const b: Point = [100, 100];

geometryMidpoint(a, b); // [50, 50]
geometryWaypoint(a, b, 0.25); // [25, 25]
geometryWaypoint(a, b, 0.75); // [75, 75]
```

### Equality and Distance

```ts
import {
    geometryPointsEqual,
    geometryEuclideanDistance,
} from '@ripl/web';

geometryPointsEqual([0, 0], [0, 0]); // true
geometryEuclideanDistance(3, 4); // 5
```

## Angles

```ts
import {
    geometryDegreesToRadians,
    geometryRadiansToDegrees,
    TAU,
} from '@ripl/web';

geometryDegreesToRadians(90); // π/2
geometryRadiansToDegrees(TAU); // 360
TAU; // 6.283... (2π)
```

### Theta Points

Compute a point at a given angle and distance from a center:

```ts
import {
    geometryThetaPoint,
} from '@ripl/web';

geometryThetaPoint(0, 100, 200, 200); // [300, 200]
geometryThetaPoint(Math.PI / 2, 100, 200, 200); // [200, 300]
```

## Polygons

Generate vertex points for a regular polygon:

```ts
import {
    geometryPolygonPoints,
} from '@ripl/web';

const hexagon = geometryPolygonPoints(6, 200, 200, 80);
// 7 points (6 vertices + closing point)

const triangle = geometryPolygonPoints(3, 100, 100, 50, false);
// 3 points (no closing point)
```

## Bounding Boxes

The `Box` class represents an axis-aligned bounding box:

```ts
import {
    Box,
    geometryContainingBox,
    geometryIsPointInBox,
} from '@ripl/web';

const box = new Box(10, 20, 110, 220);
box.width; // 200
box.height; // 100

geometryIsPointInBox([50, 50], box); // true
geometryIsPointInBox([0, 0], box); // false

Box.empty(); // Box(0, 0, 0, 0)
```

### Containing Box

Compute the smallest box that contains a collection of items:

```ts
const boxes = [
    new Box(0, 0, 50, 50),
    new Box(100, 100, 200, 200),
];

const container = geometryContainingBox(boxes, box => box);
// Box(0, 0, 200, 200)
```

## Numeric Helpers

```ts
import {
    numberClamp,
    numberFractional,
    numberExtent,
    numberTotal,
    numberMax,
    numberMaxOf,
    numberMin,
    numberMinOf,
} from '@ripl/web';

numberClamp(150, 0, 100); // 100
numberClamp(-5, 0, 100); // 0
numberFractional(3.7); // 0.7

numberMin(10, 20, 5); // 5
numberMax(10, 20, 5); // 20

const data = [{ v: 10 }, { v: 50 }, { v: 30 }];
numberMinOf(data, d => d.v); // 10
numberMaxOf(data, d => d.v); // 50
numberExtent(data, d => d.v); // [10, 50]
numberTotal(data, d => d.v); // 90
```

## SVG Path Utilities

Measure and sample points along SVG path strings:

```ts
import {
    geometryPathLength,
    geometrySamplePathPoint,
} from '@ripl/web';

const d = 'M 0,0 L 100,0 L 100,100';
geometryPathLength(d); // ~200

const point = geometrySamplePathPoint(d, 50);
// { x: 50, y: 0, angle: 0 }
```

`geometrySamplePathPoint` returns the position and tangent angle at a given distance along the path — this powers the [Text on Path](/docs/core/elements/text#text-on-path) feature.

## Border Radius

Normalize a border radius value into a four-corner tuple:

```ts
import {
    geometryNormaliseBorderRadius,
} from '@ripl/web';

geometryNormaliseBorderRadius(8); // [8, 8, 8, 8]
geometryNormaliseBorderRadius([4, 8, 4, 8]); // [4, 8, 4, 8]
```
