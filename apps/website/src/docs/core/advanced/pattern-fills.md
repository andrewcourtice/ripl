---
outline: "deep"
---

# Pattern Fills

Ripl supports repeating pattern paint strings directly in `fill` and `stroke` properties. A pattern string describes a small square tile (diagonal lines, cross-hatching, dots) that repeats across the shape. The string is parsed at render time and converted to the appropriate native pattern for the current context (Canvas or SVG).

Patterns keep shapes distinguishable without relying on color alone, which helps with accessibility and print-friendly output: two series can share a hue and still read differently.

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Tile size</span>
            <RiplInputRange v-model="tileSize" :min="4" :max="24" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createContext,
    createRect,
} from '@ripl/web';

const context = createContext('.mount-element');

createRect({
    fill: 'pattern(diagonal, #3a86ff, #eff6ff, 8)',
    x: 50,
    y: 50,
    width: 200,
    height: 120,
}).render(context);

createRect({
    fill: 'pattern(dots, #8338ec)',
    x: 300,
    y: 50,
    width: 200,
    height: 120,
}).render(context);
```
:::

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/@ripl/core/).

## Pattern Syntax

```
pattern(<type>[, <foreground>[, <background>[, <size>]]])
```

Only the type is required; the remaining arguments default sensibly when omitted:

| Argument | Default | Description |
| --- | --- | --- |
| `type` | required | One of the built-in pattern types below |
| `foreground` | `#000000` | CSS color used to draw the tile's lines or dots |
| `background` | `transparent` | CSS color painted behind the motif (`transparent` leaves the tile see-through) |
| `size` | `8` | Width and height of the square repeating tile, in pixels (an optional `px` suffix is accepted) |

```ts
// Black diagonal lines on a transparent tile
'pattern(diagonal)';

// Pink dots, transparent background
'pattern(dots, #ff006e)';

// Blue grid on a light background
'pattern(cross-hatch, #3a86ff, #eff6ff)';

// Explicit 12px tile, px suffix optional
'pattern(horizontal, #8338ec, transparent, 12px)';
```

A string that does not conform to the grammar (unknown type, empty argument, zero or negative size) is not treated as a pattern: parsing fails silently and no pattern is drawn.

## Pattern Types

| Type | Tile |
| --- | --- |
| `diagonal` | Parallel lines at 45 degrees |
| `cross-hatch` | A grid of crossing horizontal and vertical lines |
| `dots` | A single filled dot centered in the tile |
| `horizontal` | A horizontal line through the middle of the tile |
| `vertical` | A vertical line through the middle of the tile |

Line thickness and dot radius scale with the tile: lines are drawn at `size / 8` pixels thick and dots at a radius of `size / 6` pixels, each with a 1 pixel minimum. A larger tile therefore produces a coarser, bolder motif, and a smaller tile a finer one.

## Using Patterns

Patterns work anywhere a fill or stroke color is accepted, including both properties at once:

```ts
const rect = createRect({
    fill: 'pattern(diagonal, #3a86ff, #eff6ff, 8)',
    stroke: '#1a56db',
    lineWidth: 2,
    x: 50,
    y: 50,
    width: 200,
    height: 120,
});
```

Because chart options that select colors are ultimately applied as fills and strokes, pattern strings can be used there too, for example as a series color in `@ripl/charts`.

Patterns tile in user space (aligned to the canvas, not to each shape), so adjacent shapes sharing the same pattern string line up seamlessly.

## How It Works

When Ripl encounters a pattern string in a style property:

1. The string is **parsed** into a structured `Pattern` object (type, foreground, background, size)
2. The shared **tile geometry** is resolved: the primitive lines and dots that make up one tile, so every context draws the same motif
3. The context materializes a **native pattern**:
   - **Canvas**: draws the tile to an offscreen canvas and creates a repeating `CanvasPattern`, cached per pattern string
   - **SVG**: creates a `<pattern>` element in a `<defs>` block (tiled in user space) and references it via `url(#id)`, updating the definition in place when the paint changes
4. The native pattern is applied as the fill or stroke style

Unlike [gradients](/docs/core/advanced/gradients), pattern paints are not interpolated during transitions. Set them directly rather than animating between two pattern values.

## Working with Patterns Programmatically

The parsing utilities behind pattern strings are exported from `@ripl/core`:

```ts
import {
    isPatternString,
    parsePattern,
    serializePattern,
} from '@ripl/core';

isPatternString('pattern(dots)'); // true

const pattern = parsePattern('pattern(diagonal, #1a6, #fff0, 8)');
// {
//     type: 'diagonal',
//     foreground: '#1a6',
//     background: '#fff0',
//     size: 8,
// }

if (pattern) {
    serializePattern(pattern); // 'pattern(diagonal, #1a6, #fff0, 8)'
}
```

- **`parsePattern(value)`** parses a pattern string into a `Pattern` object, applying defaults for omitted arguments, and returns `null` when the string is invalid.
- **`serializePattern(pattern)`** turns a `Pattern` object back into its canonical string form.
- **`isPatternString(value)`** is a cheap shape check (does the string look like `pattern(...)`); use `parsePattern` to validate fully.
- **`PATTERN_TYPES`** lists the valid `PatternType` values, useful for building pattern pickers.
- **`DEFAULT_PATTERN_FOREGROUND`**, **`DEFAULT_PATTERN_BACKGROUND`**, and **`DEFAULT_PATTERN_SIZE`** expose the defaults applied when arguments are omitted.

Custom contexts can call `getPatternTileGeometry(pattern)` to obtain the renderer-agnostic tile geometry (the tile size plus the lines and dots to draw within it) and reproduce the same motifs in their own backend.

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createRect,
    createText,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    ref,
} from 'vue';

const tileSize = ref(8);
let currentContext: Context | undefined;

const swatches = [
    {
        label: 'Diagonal',
        fill: (size: number) => `pattern(diagonal, #3a86ff, #eff6ff, ${size})`,
    },
    {
        label: 'Cross-hatch',
        fill: (size: number) => `pattern(cross-hatch, #ff006e, transparent, ${size})`,
    },
    {
        label: 'Dots',
        fill: (size: number) => `pattern(dots, #8338ec, #f5f3ff, ${size})`,
    },
    {
        label: 'Horizontal',
        fill: (size: number) => `pattern(horizontal, #fb5607, transparent, ${size})`,
    },
    {
        label: 'Vertical',
        fill: (size: number) => `pattern(vertical, #0ea5e9, transparent, ${size})`,
    },
];

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const gap = w * 0.03;
    const width = (w * 0.9 - gap * (swatches.length - 1)) / swatches.length;
    const height = Math.min(h * 0.5, width);
    const left = (w - (width * swatches.length + gap * (swatches.length - 1))) / 2;
    const top = h / 2 - height / 2;

    context.batch(() => {
        swatches.forEach((swatch, index) => {
            const x = left + index * (width + gap);

            createRect({
                fill: swatch.fill(tileSize.value),
                stroke: '#d0d0d0',
                lineWidth: 1,
                x,
                y: top,
                width,
                height,
                borderRadius: 8,
            }).render(context);

            createText({
                content: swatch.label,
                fill: '#666',
                font: '13px sans-serif',
                textAlign: 'center',
                x: x + width / 2,
                y: top + height + 20,
            }).render(context);
        });
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
    if (currentContext) {
        renderDemo(currentContext);
    }
}
</script>
