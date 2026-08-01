---
outline: "deep"
---

# Clip Paths

A **clip path** turns a shape into a clipping mask. Instead of being filled or stroked, the shape defines a visible region. Any sibling elements rendered after the clip shape (within the same group) are only visible where they overlap with the clip region.

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
} from '@ripl/web';

const context = createContext('.mount-element');
const cx = context.width / 2;
const cy = context.height / 2;
const r = Math.min(context.width, context.height) / 3;

const group = createGroup({
    children: [
        createCircle({
            clip: true,
            cx,
            cy,
            radius: r,
        }),
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

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/@ripl/core/).

## Usage

Set `clip: true` on any shape to use it as a clip path:

```ts
import {
    createCircle,
    createGroup,
    createRect,
} from '@ripl/web';

const group = createGroup({
    children: [
        // Clip shape: defines the visible region
        createCircle({
            clip: true,
            cx: 150,
            cy: 100,
            radius: 80,
        }),

        // Clipped content: only visible inside the circle
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

This means clips are **scoped to their group**, so they don't leak to elements outside the group.

## The `clip` Property

The `clip` option is available on all [Shape](/docs/core/essentials/shape) types. Set `clip: true` to use the shape as a clipping mask instead of rendering it visually. When active, `autoFill`, `autoStroke`, `fill`, and `stroke` have no effect: the shape is never drawn, only used to define the visible region.

## Combining with Transforms

Clip shapes support all the same transforms as regular shapes: `translateX`, `translateY`, `rotation`, `transformScaleX`, `transformScaleY`, etc. The clip region will be transformed accordingly.

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

<script lang="ts" setup>
import {
    useDemoElements,
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createGroup,
    createLine,
    createRect,
    createText,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    ref,
} from 'vue';

const clipRadiusPct = ref(100);
let currentContext: Context | undefined;

// Built once, on first render, so ids stay stable and every id-keyed cache hits.
const getElements = useDemoElements(() => {
    const clipCircle = createCircle({
        clip: true,
        cx: 0,
        cy: 0,
        radius: 0,
    });

    const backdrop = createRect({
        fill: '#3a86ff',
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });

    const hatching = Array.from({ length: 20 }, () => createLine({
        stroke: '#ffffff44',
        lineWidth: 2,
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    }));

    const clippedGroup = createGroup({
        children: [clipCircle, backdrop, ...hatching],
    });

    const outline = createCircle({
        stroke: '#1a56db',
        lineWidth: 3,
        autoFill: false,
        cx: 0,
        cy: 0,
        radius: 0,
    });

    const label = createText({
        x: 0,
        y: 0,
        content: '',
        fill: '#666',
        textAlign: 'center',
        font: '13px sans-serif',
    });

    return {
        clipCircle,
        backdrop,
        hatching,
        clippedGroup,
        outline,
        label,
    };
});

function renderDemo(context: Context) {
    const {
        clipCircle,
        backdrop,
        hatching,
        clippedGroup,
        outline,
        label,
    } = getElements();

    const w = context.width;
    const h = context.height;
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) / 3;
    const r = maxR * (clipRadiusPct.value / 100);

    clipCircle.cx = cx;
    clipCircle.cy = cy;
    clipCircle.radius = r;

    backdrop.x = cx - maxR;
    backdrop.y = cy - maxR;
    backdrop.width = maxR * 2;
    backdrop.height = maxR * 2;

    hatching.forEach((line, index) => {
        const offset = (index - 10) * (maxR / 5);

        line.x1 = cx - maxR + offset;
        line.y1 = cy - maxR;
        line.x2 = cx + maxR + offset;
        line.y2 = cy + maxR;
    });

    outline.cx = cx;
    outline.cy = cy;
    outline.radius = r;

    label.x = cx;
    label.y = cy + maxR + 24;
    label.content = `Clip radius: ${Math.round(r)}px`;

    context.batch(() => {
        clippedGroup.render(context);
        outline.render(context);
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
