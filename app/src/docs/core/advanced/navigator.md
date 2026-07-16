---
outline: "deep"
---

# Navigator

A **navigator** is an interactive pan / zoom / brush controller — the flat-scene analogue of the 3D `Camera`. It owns a single affine **view transform** (`{ k, x, y }` — a uniform scale plus a translation) and an optional rectangular **brush**, and it emits events as that transform changes. The navigator never repaints anything itself; you react to its events and re-render your scene under the new transform.

The controller is split in two, mirroring the `Context` / `DOMContext` split:

- **`Navigator`** (in `@ripl/core`) is context-agnostic. It owns the view model and the imperative commands that mutate it (`panBy`, `zoomBy`, `fitBounds`, …) but attaches no input listeners. Non-DOM environments can drive it programmatically.
- **`DOMNavigator`** (in `@ripl/dom`, via `createNavigator`) extends it to translate real wheel / pointer / touch gestures into those commands.

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/@ripl/core/).

## Demo

Drag to pan, use the wheel (or pinch) to zoom toward the pointer, and **shift-drag** to zoom into a region. Translation is unbounded, so you can roam past the framed content — use the buttons to jump back.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="frameAll">Frame all</RiplButton>
            <RiplButton @click="resetView">Reset</RiplButton>
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createNavigator,
} from '@ripl/dom';

const navigator = createNavigator(context, {
    interactions: {
        zoom: true,
        pan: true,
        brush: true,
    },
});

// Re-render the scene whenever the view transform changes.
navigator.on('change', () => redraw());

// Frame a content-space box — even one that sits entirely off-screen.
navigator.fitBounds({ x0: 0, y0: 0, x1: 1800, y1: 1100 }, { padding: 24 });
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    COLOR_SCHEME_VIRIDIS,
    createCircle,
    createRect,
    createText,
    scaleSequential,
    setColorAlpha,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    createNavigator,
} from '@ripl/dom';

import type {
    DOMNavigator,
} from '@ripl/dom';

import {
    onUnmounted,
} from 'vue';

const WORLD = {
    width: 1800,
    height: 1100,
};

const COLUMNS = 9;
const ROWS = 6;
const MARGIN = 160;
const NODE_COUNT = COLUMNS * ROWS;

const swatch = scaleSequential(COLOR_SCHEME_VIRIDIS, [0, NODE_COUNT - 1]);

const nodes = Array.from({ length: NODE_COUNT }, (_, index) => {
    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);

    return {
        index,
        x: MARGIN + column * ((WORLD.width - MARGIN * 2) / (COLUMNS - 1)),
        y: MARGIN + row * ((WORLD.height - MARGIN * 2) / (ROWS - 1)),
        radius: 24 + (index % 5) * 8,
    };
});

let currentNavigator: DOMNavigator | undefined;

function renderDemo(context: Context, navigator: DOMNavigator) {
    const w = context.width;
    const h = context.height;
    const transform = navigator.transform;

    context.batch(() => {
        createRect({
            fill: '#0d1117', x: 0, y: 0, width: w, height: h,
        }).render(context);

        const [ox, oy] = navigator.applyPoint([0, 0]);

        createRect({
            stroke: '#30363d', lineWidth: 1,
            x: ox, y: oy,
            width: WORLD.width * transform.k,
            height: WORLD.height * transform.k,
        }).render(context);

        nodes.forEach(node => {
            const [cx, cy] = navigator.applyPoint([node.x, node.y]);
            const radius = node.radius * transform.k;

            if (cx + radius < 0 || cx - radius > w || cy + radius < 0 || cy - radius > h) {
                return;
            }

            createCircle({
                fill: swatch(node.index),
                cx, cy, radius,
            }).render(context);
        });

        const brush = navigator.brush;

        if (brush) {
            createRect({
                fill: setColorAlpha('#3a86ff', 0.15),
                stroke: '#3a86ff', lineWidth: 1, lineDash: [4, 4],
                x: brush.x0, y: brush.y0,
                width: brush.x1 - brush.x0,
                height: brush.y1 - brush.y0,
            }).render(context);
        }

        createText({
            fill: '#8b949e', x: 12, y: h - 14,
            content: `zoom ${transform.k.toFixed(2)}× · drag to pan · wheel to zoom · shift-drag to zoom to region`,
            font: '12px sans-serif',
        }).render(context);
    });
}

function frameWorld(navigator: DOMNavigator) {
    navigator.fitBounds({
        x0: 0,
        y0: 0,
        x1: WORLD.width,
        y1: WORLD.height,
    }, {
        padding: 24,
    });
}

const {
    contextChanged,
} = useRiplExample(context => {
    currentNavigator?.destroy();

    const navigator = createNavigator(context, {
        interactions: {
            zoom: true,
            pan: true,
            brush: true,
        },
    });

    currentNavigator = navigator;

    navigator.on('change', () => renderDemo(context, navigator));
    navigator.on('brush', () => renderDemo(context, navigator));

    navigator.on('brushend', event => {
        const brush = event.data;

        // `clearBrush()` below re-emits `brushend` with `null`; return early on that pass so the
        // handler doesn't recurse (emit is synchronous).
        if (!brush) {
            renderDemo(context, navigator);
            return;
        }

        if (Math.abs(brush.x1 - brush.x0) > 12 && Math.abs(brush.y1 - brush.y0) > 12) {
            const [x0, y0] = navigator.invertPoint([brush.x0, brush.y0]);
            const [x1, y1] = navigator.invertPoint([brush.x1, brush.y1]);

            navigator.fitBounds({ x0, y0, x1, y1 }, { padding: 24 });
        }

        navigator.clearBrush();
    });

    frameWorld(navigator);
    renderDemo(context, navigator);

    context.on('resize', () => renderDemo(context, navigator));
});

function frameAll() {
    if (currentNavigator) {
        frameWorld(currentNavigator);
    }
}

function resetView() {
    currentNavigator?.reset();
}

onUnmounted(() => currentNavigator?.destroy());
</script>

## Creating a navigator

`createNavigator` binds a `DOMNavigator` to a context's element and (optionally) wires up gestures. Pass `interactions: true` to enable everything, or an object to enable them individually — each interaction also accepts a `sensitivity` multiplier.

```ts
import {
    createNavigator,
} from '@ripl/dom';

const navigator = createNavigator(context, {
    // Clamp zoom between 0.5× and 20×.
    scaleExtent: [0.5, 20],
    interactions: {
        zoom: {
            sensitivity: 1.5,
        },
        pan: true,
        brush: true,
    },
});
```

The gesture model is intentionally Figma-like: click-and-hold (left or middle button, with or without ⌘/Ctrl) pans, the wheel and two-finger pinch zoom toward the pointer, and shift-drag brushes a rectangle. Call `navigator.destroy()` to detach every listener.

## The view transform

The transform is a plain `{ k, x, y }` object: a content-space point `p` maps to the screen as `k · p + [x, y]`. Two helpers convert between spaces:

```ts
navigator.applyPoint([100, 50]); // content → screen
navigator.invertPoint([320, 240]); // screen → content
```

`transform` returns a copy, so mutating it never affects the navigator — always go through a command.

## Commands

Every command clamps `k` to the scale extent and emits an event when it changes the view.

| Command | Description |
| --- | --- |
| `panBy(dx, dy)` | Pan by a pixel delta |
| `panTo(x, y)` | Pan to an absolute translation |
| `zoomBy(factor, center?)` | Multiply the zoom, keeping `center` (screen px) fixed |
| `zoomTo(k, center?)` | Set an absolute zoom factor |
| `centerOn(point, viewport?)` | Centre a content point in the viewport, keeping zoom |
| `fitBounds(bounds, options?)` | Zoom and pan so a content box fills the viewport |
| `reset()` | Return to the identity transform |
| `setTransform(transform)` | Replace the transform outright |

Because translation is unbounded, `fitBounds` and `centerOn` can jump the view to content that currently lies entirely outside the viewport — the "navigate anywhere" behaviour the demo's **Frame all** button relies on.

```ts
// Zoom to 2× toward the top-left corner of the viewport.
navigator.zoomTo(2, [0, 0]);

// Frame a bounding box with 24px of padding.
navigator.fitBounds({ x0: 40, y0: 40, x1: 520, y1: 300 }, { padding: 24 });
```

## Events

| Event | Payload | Fires when |
| --- | --- | --- |
| `zoom` | `NavigatorTransform` | The zoom factor changes |
| `pan` | `NavigatorTransform` | The translation changes |
| `change` | `NavigatorTransform` | Any transform change (zoom **or** pan) |
| `brush` | `NavigatorBrush` | The brush selection updates |
| `brushend` | `NavigatorBrush \| null` | A brush gesture finishes (or is cleared) |

Subscribe to `change` for the common "repaint on any view change" case; use `zoom` / `pan` when you need to react to just one.

```ts
navigator.on('change', event => scene.update(event.data));
navigator.on('brushend', event => event.data && zoomToSelection(event.data));
```

## Rescaling chart axes

A cartesian chart doesn't transform its rendered geometry — it rescales its **axis domains** and redraws. `rescaleDomain` does exactly that: it inverts the transformed pixel range back through a scale to produce the visible data domain.

```ts
import {
    rescaleDomain,
} from '@ripl/web';

navigator.on('change', transform => {
    const [x0, x1] = rescaleDomain(xScale, transform, [0, width]);
    chart.setDomain([x0, x1]);
});
```

This keeps geometry crisp at any zoom level (no scaled stroke widths or blurred text) and is how the opt-in navigator support on the cartesian charts works under the hood.

## Programmatic use

Because the base `Navigator` in `@ripl/core` owns the view model without any input wiring, you can drive it directly — for animations, tests, or non-DOM contexts — and consume the same events:

```ts
import {
    Navigator,
} from '@ripl/web';

const navigator = new Navigator({
    viewport: {
        width: 800,
        height: 600,
    },
});

navigator.on('change', ({ k, x, y }) => render(k, x, y));
navigator.zoomTo(4, [400, 300]);
```
