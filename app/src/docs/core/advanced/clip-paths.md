---
outline: "deep"
---

# Clip Paths

A **clip path** turns a shape into a clipping mask — instead of being filled or stroked, the shape defines a visible region. Any sibling elements rendered after the clip shape (within the same group) are only visible where they overlap with the clip region.

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/@ripl/core/).

## Usage

Set `clip: true` on any shape to use it as a clip path:

```ts
import {
    createCircle,
    createGroup,
    createRect,
} from '@ripl/core';

const group = createGroup({
    children: [
        // Clip shape — defines the visible region
        createCircle({
            clip: true,
            cx: 150,
            cy: 100,
            radius: 80,
        }),

        // Clipped content — only visible inside the circle
        createRect({
            fill: '#3a86ff',
            x: 0,
            y: 0,
            width: 300,
            height: 200,
        }),
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

## The `clip` Property

The `clip` option is available on all [Shape](/docs/core/essentials/shape) types. Set `clip: true` to use the shape as a clipping mask instead of rendering it visually. When active, `autoFill`, `autoStroke`, `fill`, and `stroke` have no effect — the shape is never drawn, only used to define the visible region.

## Combining with Transforms

Clip shapes support all the same transforms as regular shapes — `translateX`, `translateY`, `rotation`, `transformScaleX`, `transformScaleY`, etc. The clip region will be transformed accordingly.

```ts
createCircle({
    clip: true,
    cx: 150,
    cy: 100,
    radius: 80,
    transformScaleX: 1.5, // Elliptical clip
});
```

## Works with Both Contexts

Clip paths work identically with both the **Canvas** and **SVG** contexts:

- **Canvas**: Uses the native `CanvasRenderingContext2D.clip()` method
- **SVG**: Creates a `<clipPath>` element in `<defs>` and applies `clip-path="url(#...)"` to subsequent sibling elements

## Demo

The demo below shows a circle clip path masking a gradient-filled rectangle and a pattern of lines. Only the portions inside the circle are visible. Use the slider to adjust the clip radius.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Clip Radius</span>
            <RiplInputRange v-model="clipRadiusPct" :min="10" :max="100" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createCircle,
    createContext,
    createGroup,
    createLine,
    createRect,
} from '@ripl/core';

const context = createContext('.mount-element');
const cx = context.width / 2;
const cy = context.height / 2;
const r = Math.min(context.width, context.height) / 3;

const group = createGroup({
    children: [
        createCircle({ clip: true,
            cx,
            cy,
            radius: r }),
        createRect({
            fill: '#3a86ff',
            x: cx - r,
            y: cy - r,
            width: r * 2,
            height: r * 2,
        }),
    ],
});

group.render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createGroup,
    createLine,
    createRect,
    createText,
} from '@ripl/core';

import type {
    Context,
} from '@ripl/core';

import {
    ref,
} from 'vue';

const clipRadiusPct = ref(100);
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) / 3;
    const r = maxR * (clipRadiusPct.value / 100);

    context.batch(() => {
        const clippedGroup = createGroup({
            children: [
                createCircle({ clip: true, cx, cy, radius: r }),
                createRect({
                    fill: '#3a86ff',
                    x: cx - maxR, y: cy - maxR,
                    width: maxR * 2, height: maxR * 2,
                }),
                ...Array.from({ length: 20 }, (_, i) => {
                    const offset = (i - 10) * (maxR / 5);
                    return createLine({
                        stroke: '#ffffff44',
                        lineWidth: 2,
                        x1: cx - maxR + offset, y1: cy - maxR,
                        x2: cx + maxR + offset, y2: cy + maxR,
                    });
                }),
            ],
        });

        clippedGroup.render(context);

        createCircle({
            stroke: '#1a56db',
            lineWidth: 3,
            cx, cy, radius: r,
            autoFill: false,
        }).render(context);

        createText({
            x: cx, y: cy + maxR + 24,
            content: `Clip radius: ${Math.round(r)}px`,
            fill: '#666', textAlign: 'center', font: '13px sans-serif',
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
