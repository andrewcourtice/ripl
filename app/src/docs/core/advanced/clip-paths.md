---
outline: "deep"
---

# Clip Paths

A **clip path** turns a shape into a clipping mask — instead of being filled or stroked, the shape defines a visible region. Any sibling elements rendered after the clip shape (within the same group) are only visible where they overlap with the clip region.

## Usage

Set `clip: true` on any shape to use it as a clip path:

```ts
import { createCircle, createRect, createGroup } from '@ripl/core';

const group = createGroup({
    children: [
        // Clip shape — defines the visible region
        createCircle({ clip: true, cx: 150, cy: 100, radius: 80 }),

        // Clipped content — only visible inside the circle
        createRect({ fillStyle: '#3a86ff', x: 0, y: 0, width: 300, height: 200 }),
    ],
});
```

The rect fills the entire area, but only the portion inside the circle is visible.

## How It Works

When a shape has `clip: true`:

1. The shape's path geometry is built as normal
2. Instead of calling `fill()` or `stroke()`, the context's `clip()` method is called
3. The clip region remains active for all subsequent siblings in the same group
4. When the group finishes rendering, the clip is automatically removed (via save/restore scoping)

This means clips are **scoped to their group** — they don't leak to elements outside the group.

## Properties

The `clip` option is available on all [Shape](/docs/core/essentials/shape) types:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `clip` | `boolean` | `false` | When `true`, the shape acts as a clip path instead of rendering visually |

When `clip` is `true`, the `autoFill`, `autoStroke`, `fillStyle`, and `strokeStyle` properties have no effect — the shape is never drawn, only used as a clipping mask.

## Combining with Transforms

Clip shapes support all the same transforms as regular shapes — `translateX`, `translateY`, `rotation`, `transformScaleX`, `transformScaleY`, etc. The clip region will be transformed accordingly.

```ts
createCircle({
    clip: true,
    cx: 150,
    cy: 100,
    radius: 80,
    transformScaleX: 1.5,  // Elliptical clip
});
```

## Works with Both Contexts

Clip paths work identically with both the **Canvas** and **SVG** contexts:

- **Canvas**: Uses the native `CanvasRenderingContext2D.clip()` method
- **SVG**: Creates a `<clipPath>` element in `<defs>` and applies `clip-path="url(#...)"` to subsequent sibling elements

## Demo

The demo below shows a circle clip path masking a gradient-filled rectangle and a pattern of lines. Only the portions inside the circle are visible.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createCircle,
    createRect,
    createLine,
    createGroup,
} from '@ripl/core';

const context = createContext('.mount-element');
const cx = context.width / 2;
const cy = context.height / 2;
const r = Math.min(context.width, context.height) / 3;

const group = createGroup({
    children: [
        // Circle clip — defines the visible region
        createCircle({ clip: true, cx, cy, radius: r }),

        // Background rect — clipped to circle
        createRect({
            fillStyle: '#3a86ff',
            x: cx - r, y: cy - r,
            width: r * 2, height: r * 2,
        }),

        // Diagonal lines — also clipped
        ...Array.from({ length: 12 }, (_, i) => {
            const offset = (i - 6) * 20;
            return createLine({
                strokeStyle: '#ffffff44',
                lineWidth: 2,
                x1: cx - r + offset, y1: cy - r,
                x2: cx + r + offset, y2: cy + r,
            });
        }),
    ],
});

group.render(context);
```
:::

<script lang="ts" setup>
import { createCircle, createRect, createLine, createText, createGroup } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;

    const render = () => {
        context.clear();
        context.markRenderStart();

        const cx = w / 2;
        const cy = h / 2;
        const r = Math.min(w, h) / 3;

        // --- Clipped group ---
        const clippedGroup = createGroup({
            children: [
                createCircle({ clip: true, cx, cy, radius: r }),
                createRect({
                    fillStyle: '#3a86ff',
                    x: cx - r, y: cy - r,
                    width: r * 2, height: r * 2,
                }),
                ...Array.from({ length: 20 }, (_, i) => {
                    const offset = (i - 10) * (r / 5);
                    return createLine({
                        strokeStyle: '#ffffff44',
                        lineWidth: 2,
                        x1: cx - r + offset, y1: cy - r,
                        x2: cx + r + offset, y2: cy + r,
                    });
                }),
            ],
        });

        clippedGroup.render(context);

        // --- Unclipped ring to show boundary ---
        createCircle({
            strokeStyle: '#1a56db',
            lineWidth: 3,
            cx, cy, radius: r,
            autoFill: false,
        }).render(context);

        createText({
            x: cx, y: cy + r + 24,
            content: 'Circle Clip Path',
            fillStyle: '#666', textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => render());
});
</script>
