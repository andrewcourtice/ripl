---
outline: "deep"
---

# Path

The **Path** element is a general-purpose shape that delegates its geometry to a user-supplied callback function. Instead of having fixed geometry like a circle or rect, you provide a `pathRenderer` function that draws arbitrary commands onto a `ContextPath`. This makes it ideal for custom icons, complex outlines, or any shape that doesn't fit the built-in elements.

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/core/elements).

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplSelect v-model="currentShape" @change="redraw">
                <option value="star">Star</option>
                <option value="heart">Heart</option>
                <option value="arrow">Arrow</option>
                <option value="cross">Cross</option>
            </RiplSelect>
            <span>Size</span>
            <RiplInputRange v-model="size" :min="40" :max="160" :step="4" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createPath,
} from '@ripl/core';

const star = createPath({
    fill: '#ff006e',
    x: 100,
    y: 50,
    width: 100,
    height: 100,
    pathRenderer: (path, { x, y, width, height }) => {
        const cx = x + width / 2;
        const cy = y + height / 2;
        const r = Math.min(width, height) / 2;
        const inner = r * 0.4;
        const points = 5;
        const step = Math.PI / points;

        path.moveTo(cx, cy - r);
        for (let i = 1; i <= 2 * points; i++) {
            const radius = i % 2 === 0 ? r : inner;
            const angle = i * step - Math.PI / 2;
            path.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
        }
        path.closePath();
    },
});
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createPath,
    createText,
} from '@ripl/core';

import type {
    Context,
    ContextPath,
    PathState,
} from '@ripl/core';

import {
    ref,
    watch,
} from 'vue';

const currentShape = ref('star');
const size = ref(100);
let currentContext: Context | undefined;

function starRenderer(path: ContextPath, { x, y, width, height }: PathState) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const r = Math.min(width, height) / 2;
    const inner = r * 0.4;
    const points = 5;
    const step = Math.PI / points;
    path.moveTo(cx, cy - r);
    for (let i = 1; i <= 2 * points; i++) {
        const radius = i % 2 === 0 ? r : inner;
        const angle = i * step - Math.PI / 2;
        path.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
    }
    path.closePath();
}

function heartRenderer(path: ContextPath, { x, y, width, height }: PathState) {
    const cx = x + width / 2;
    const top = y + height * 0.3;
    const bottom = y + height;
    const left = x;
    const right = x + width;
    path.moveTo(cx, bottom);
    path.bezierCurveTo(left - width * 0.1, top + height * 0.1, left, top - height * 0.2, cx, top);
    path.moveTo(cx, bottom);
    path.bezierCurveTo(right + width * 0.1, top + height * 0.1, right, top - height * 0.2, cx, top);
}

function arrowRenderer(path: ContextPath, { x, y, width, height }: PathState) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const hw = width / 2;
    const hh = height / 2;
    path.moveTo(cx + hw, cy);
    path.lineTo(cx, cy - hh);
    path.lineTo(cx, cy - hh * 0.35);
    path.lineTo(cx - hw, cy - hh * 0.35);
    path.lineTo(cx - hw, cy + hh * 0.35);
    path.lineTo(cx, cy + hh * 0.35);
    path.lineTo(cx, cy + hh);
    path.closePath();
}

function crossRenderer(path: ContextPath, { x, y, width, height }: PathState) {
    const t = 0.3;
    const tw = width * t;
    const th = height * t;
    const cx = x + width / 2;
    const cy = y + height / 2;
    path.moveTo(cx - tw / 2, y);
    path.lineTo(cx + tw / 2, y);
    path.lineTo(cx + tw / 2, cy - th / 2);
    path.lineTo(x + width, cy - th / 2);
    path.lineTo(x + width, cy + th / 2);
    path.lineTo(cx + tw / 2, cy + th / 2);
    path.lineTo(cx + tw / 2, y + height);
    path.lineTo(cx - tw / 2, y + height);
    path.lineTo(cx - tw / 2, cy + th / 2);
    path.lineTo(x, cy + th / 2);
    path.lineTo(x, cy - th / 2);
    path.lineTo(cx - tw / 2, cy - th / 2);
    path.closePath();
}

const renderers: Record<string, (path: ContextPath, state: PathState) => void> = {
    star: starRenderer,
    heart: heartRenderer,
    arrow: arrowRenderer,
    cross: crossRenderer,
};

const colors: Record<string, string> = {
    star: '#ff006e',
    heart: '#e63946',
    arrow: '#3a86ff',
    cross: '#8338ec',
};

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const s = size.value;

    context.batch(() => {
        createPath({
            fill: colors[currentShape.value],
            x: w / 2 - s / 2,
            y: h / 2 - s / 2,
            width: s,
            height: s,
            pathRenderer: renderers[currentShape.value],
        }).render(context);

        createText({
            fill: '#666', x: w / 2, y: h / 2 + s / 2 + 24,
            content: `Path: ${currentShape.value} (${s}×${s})`,
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);
    });
}

const {
    contextChanged,
} = useRiplExample(context => {
    currentContext = context;
    renderDemo(context);
    context.on('resize', () => renderDemo(context));
});

function redraw() {
    if (currentContext) renderDemo(currentContext);
}

watch(currentShape, redraw);
</script>

## Usage

```ts
import {
    createPath,
} from '@ripl/core';

const path = createPath({
    fill: '#3a86ff',
    x: 50,
    y: 50,
    width: 100,
    height: 100,
    pathRenderer: (path, { x, y, width, height }) => {
        // Draw any geometry using the ContextPath API
        path.moveTo(x, y);
        path.lineTo(x + width, y + height / 2);
        path.lineTo(x, y + height);
        path.closePath();
    },
});

path.render(context);
```

## Properties

- **`x`** — X position of the bounding area
- **`y`** — Y position of the bounding area
- **`width`** — Width of the bounding area
- **`height`** — Height of the bounding area
- **`pathRenderer`** — Callback `(path: ContextPath, state: PathState) => void` that draws the geometry

## The Path Renderer

The `pathRenderer` callback receives:

1. **`path`** — A `ContextPath` instance with methods like `moveTo`, `lineTo`, `arc`, `bezierCurveTo`, `quadraticCurveTo`, `rect`, `circle`, `ellipse`, and `closePath`
2. **`state`** — The current `{ x, y, width, height }` of the element

This separation means the geometry is always defined relative to the element's position and size, making the shape responsive and animatable.

## Updating the Renderer

You can swap the path renderer at any time via `setPathRenderer`:

```ts
path.setPathRenderer((p, { x, y, width, height }) => {
    p.circle(x + width / 2, y + height / 2, width / 2);
});
```

## Animation

Since `x`, `y`, `width`, and `height` are standard numeric properties, they can be animated with transitions:

```ts
await renderer.transition(path, {
    duration: 500,
    state: {
        x: 200,
        y: 100,
        width: 150,
        height: 150,
    },
});
```

The path renderer is called on every frame with the interpolated values, producing smooth size and position animations.

## Icon Rendering

The Path element is useful for rendering custom SVG-style icons at arbitrary sizes:

```ts
function iconCheck(path, { x, y, width, height }) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const s = Math.min(width, height) * 0.4;
    path.moveTo(cx - s, cy);
    path.lineTo(cx - s * 0.3, cy + s * 0.7);
    path.lineTo(cx + s, cy - s * 0.5);
}

createPath({
    stroke: '#2ecc71',
    lineWidth: 3,
    autoFill: false,
    x: 0,
    y: 0,
    width: 32,
    height: 32,
    pathRenderer: iconCheck,
});
```
