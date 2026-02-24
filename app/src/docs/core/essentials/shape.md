---
outline: "deep"
---

# Shape

A **Shape** is a specialized [Element](/docs/core/essentials/element) that draws using a path. While `Element` is the base class for all drawable objects, `Shape` adds path-based rendering with automatic fill and stroke, plus pixel-accurate hit testing via the path geometry.

Most built-in elements (Circle, Rect, Arc, Line, Polygon, Polyline, Ellipse) extend `Shape`. The notable exception is [Text](/docs/core/elements/text), which extends `Element` directly.

## Element vs Shape

| Feature | Element | Shape |
| --- | --- | --- |
| Base class | `EventBus` | `Element` |
| Rendering | Manual (override `render`) | Path-based (override `render` with path callback) |
| Auto fill/stroke | No | Yes — fills and strokes automatically based on style |
| Hit testing | Bounding box only | Pixel-accurate via path geometry |
| Use case | Text, images, custom non-path elements | Geometric shapes with fill/stroke |

## Shape Options

In addition to all [Element options](/docs/core/essentials/element#common-options), shapes accept:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `autoFill` | `boolean` | `true` | Automatically fill the path if `fillStyle` is set |
| `autoStroke` | `boolean` | `true` | Automatically stroke the path if `strokeStyle` is set |

```ts
const circle = createCircle({
    fillStyle: '#3a86ff',
    strokeStyle: '#1a56db',
    autoStroke: false,  // Don't stroke, only fill
    cx: 100,
    cy: 100,
    radius: 50,
});
```

## How Shape Rendering Works

When you call `shape.render(context)`, the following happens:

1. The element's `render` method saves the context state
2. All style properties (fillStyle, lineWidth, etc.) are applied to the context
3. A new **path** is created via `context.createPath()`
4. The shape's drawing callback builds the path geometry (e.g. `path.circle(x, y, r)`)
5. If `autoFill` is `true` and `fillStyle` is set, the path is filled
6. If `autoStroke` is `true` and `strokeStyle` is set, the path is stroked
7. The context state is restored

This is why shapes "just work" — you set `fillStyle` and/or `strokeStyle` and the shape handles the rest.

## Hit Testing

Shapes provide pixel-accurate hit testing through the `intersectsWith` method. Instead of using a simple bounding box check (like the base `Element`), shapes test whether a point is inside the actual path geometry:

```ts
// Pixel-accurate — tests against the actual circle path
circle.intersectsWith(mouseX, mouseY);
```

The `pointerEvents` property controls which parts of the shape respond to hits:

- `'all'` — fill area OR stroke area (default)
- `'fill'` — only the fill area
- `'stroke'` — only the stroke area
- `'none'` — no hit testing

## Demo

The demo below shows the difference between `autoFill` and `autoStroke`. The left circle has both enabled, the middle has only fill, and the right has only stroke.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createCircle,
} from '@ripl/core';

const context = createContext('.mount-element');
const r = Math.min(context.width, context.height) / 6;

// Both fill and stroke (default)
createCircle({
    fillStyle: '#3a86ff',
    strokeStyle: '#1a56db',
    lineWidth: 4,
    cx: context.width / 4,
    cy: context.height / 2,
    radius: r,
}).render(context);

// Fill only
createCircle({
    fillStyle: '#3a86ff',
    strokeStyle: '#1a56db',
    lineWidth: 4,
    autoStroke: false,
    cx: context.width / 2,
    cy: context.height / 2,
    radius: r,
}).render(context);

// Stroke only
createCircle({
    fillStyle: '#3a86ff',
    strokeStyle: '#1a56db',
    lineWidth: 4,
    autoFill: false,
    cx: context.width * 3 / 4,
    cy: context.height / 2,
    radius: r,
}).render(context);
```
:::

<script lang="ts" setup>
import { createCircle, createText } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 6;

    const render = () => {
        context.markRenderStart();

        createCircle({
            fillStyle: '#3a86ff', strokeStyle: '#1a56db', lineWidth: 4,
            cx: w / 4, cy: h / 2, radius: r,
        }).render(context);

        createText({
            x: w / 4, y: h / 2 + r + 20,
            content: 'Fill + Stroke',
            fillStyle: '#666', textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createCircle({
            fillStyle: '#3a86ff', strokeStyle: '#1a56db', lineWidth: 4,
            autoStroke: false,
            cx: w / 2, cy: h / 2, radius: r,
        }).render(context);

        createText({
            x: w / 2, y: h / 2 + r + 20,
            content: 'Fill Only',
            fillStyle: '#666', textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createCircle({
            fillStyle: '#3a86ff', strokeStyle: '#1a56db', lineWidth: 4,
            autoFill: false,
            cx: w * 3 / 4, cy: h / 2, radius: r,
        }).render(context);

        createText({
            x: w * 3 / 4, y: h / 2 + r + 20,
            content: 'Stroke Only',
            fillStyle: '#666', textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>
