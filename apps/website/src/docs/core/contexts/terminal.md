---
title: Terminal
description: "Render Ripl scenes to a terminal as Unicode braille art with ANSI truecolor, affine transforms, clipping, hit testing and path rasterization for TUI dashboards."
outline: "deep"
---

# Terminal Context

The **Terminal context** is a full Ripl rendering backend whose surface is a character grid. It rasterizes elements into Unicode braille patterns (U+2800–U+28FF), where each cell encodes a 2×4 grid of sub-pixel dots for 8× the resolution of plain text, and paints them with ANSI truecolor escape sequences.

It is a rasterizer, not a text formatter. `@ripl/terminal` implements Bresenham line drawing, midpoint circles, adaptive Bézier and arc/ellipse flattening, scanline polygon fill, round-brush stroke thickening and dash patterns, so every built-in element — arcs, paths, polylines, rects, text — draws to a TUI unchanged. Affine transforms are honored through the full matrix, clip paths become raster stencils, overlapping shapes composite in an RGBA framebuffer, and `isPointInPath`/`isPointInStroke` hit testing runs against the same contours, so a host with a pointer (xterm.js, say) gets the same interaction model as the browser. Rotated text is the one approximation: a glyph fills a whole cell, so a rotated run advances along the nearest of eight compass directions.

## Demo

The demo below renders a bar chart live in an xterm.js terminal widget, using the same `@ripl/terminal` code that runs in Node.js:

<ClientOnly>
<example-terminal @ready="onTerminalReady" />
</ClientOnly>

## Installation

The terminal context is provided by the `@ripl/terminal` package. For Node.js usage, also install `@ripl/node`:

```bash
npm install @ripl/terminal @ripl/node
```

## Usage

### Node.js

Import from `@ripl/node` to automatically configure the runtime factory:

```ts
import '@ripl/node';

import {
    createCircle,
    createNodeOutput,
    createRect,
    createTerminalContext,
} from '@ripl/node';

const output = createNodeOutput();
const context = createTerminalContext(output);

createCircle({
    fill: '#3a86ff',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: 40,
}).render(context);
```

### Browser (xterm.js)

Since `@ripl/terminal` is runtime-agnostic, you can wire it to any output that implements the `TerminalOutput` interface, including an xterm.js instance in the browser:

```ts
import {
    Terminal,
} from '@xterm/xterm';

import {
    BrailleRasterizer,
    TerminalContext,
} from '@ripl/terminal';

const xterm = new Terminal({ disableStdin: true });
xterm.open(document.getElementById('terminal'));

const output = {
    write: (data) => xterm.write(data),
    columns: xterm.cols,
    rows: xterm.rows,
};

const context = new TerminalContext(output, {
    rasterizer: new BrailleRasterizer(xterm.cols, xterm.rows),
});
```

## How It Works

The terminal context:

1. Records drawing commands (lines, arcs, curves, rects) from elements
2. Maps each command through the current transform onto the sub-pixel grid, rasterizing with Bresenham's line, midpoint circle, and adaptive Bézier subdivision
3. Applies scanline fill for filled shapes, and a round-brush stamp with optional dashing for strokes
4. Masks every plotted pixel against the active clip stencil
5. Maps CSS colors to ANSI truecolor escape sequences, compositing alpha into the RGBA framebuffer
6. Encodes each 2×4 cell into a Unicode braille character
7. Flushes the serialized output to the `TerminalOutput` adapter

## Logical Sizing

By default the context's coordinate space **is** the braille pixel grid: `columns × 2` wide by
`rows × 4` tall (an 80×24 terminal is a 160×96 space). A scene authored in typical screen pixels
(fixed radii, offsets in the hundreds) will overflow that space entirely.

Pass `logicalWidth`/`logicalHeight` to author in a larger logical space instead. The context then
reports the logical size via `context.width`/`context.height` and uniformly scales + centers
(letterboxes) it into the character grid, the same way the canvas context maps CSS pixels onto its
device-pixel backing store:

```ts
// A scene written for a 800×600 canvas renders proportionally in any terminal.
const context = createContext(output, {
    logicalWidth: 800,
    logicalHeight: 600,
});
```

The scale factor is uniform on both axes, so circles stay circular. Text glyphs remain cell-sized
(inherent to terminals); only their position follows the logical space, and `measureText` reports
metrics in logical units. On terminal resize the logical size is preserved and the mapping is
recomputed. The docs playground's Terminal mode uses this to render examples with the same
proportions as the Canvas and SVG modes.

## Extensible Rasterizer

The default `BrailleRasterizer` can be swapped for alternative character sets by implementing the `Rasterizer` interface:

```ts
interface Rasterizer {
    readonly pixelWidth: number;
    readonly pixelHeight: number;
    readonly cellWidth: number;
    readonly cellHeight: number;
    resize(cols: number, rows: number): void;
    setPixel(x: number, y: number, color: TerminalColor): void;
    setChar(col: number, row: number, char: string, color: TerminalColor): void;
    clear(): void;
    serialize(): string;
    toImageData(): ImageData;
}
```

A `TerminalColor` is an `[r, g, b, a]` tuple, or `null` for the terminal's own default foreground.
`cellWidth`/`cellHeight` describe the rasterizer's cell geometry; text placement reads them, so a
non-braille cell size positions text correctly.

Pass a custom rasterizer via the `rasterizer` option when creating a context.

## Transforms

Element and group transforms are honored. Geometry is mapped through the full affine matrix, so a
rotated marker draws rotated and a translated group draws where the transform puts it.

Text is the one place a terminal cannot follow exactly: a glyph fills a whole cell and cannot itself
be rotated. A rotated run instead advances along whichever of eight compass directions the transform
is nearest, so a quarter-turn axis title reads down the side of a chart rather than across it.

## Limitations

- **No gradients**: a cell cannot interpolate, so a gradient or pattern paints as its first
  non-transparent color
- **No image drawing**: `drawImage` is a no-op
- **Monospace text**: text is placed at character-grid positions; font metrics are approximate
- **No pointer source**: hit testing works, but `@ripl/terminal` has no pointer input of its own — a
  host that has one (xterm.js in a browser) drives `Context.hitTest` itself
- **Resolution**: limited by braille dot density (2×4 per cell)

## When to Use Terminal

Terminal is the best choice when:

- **Server-side rendering**: visualize data in CI/CD pipelines, monitoring dashboards, or CLI tools
- **No browser available**: render charts and graphics in headless environments
- **Quick prototyping**: see rendering output without setting up a browser environment

<script lang="ts" setup>
import {
    createLine,
    createRect,
    createText,
    scaleBand,
    scaleContinuous,
} from '@ripl/web';

import type {
    TerminalContext,
} from '@ripl/terminal';

const data = [
    { label: 'Mon', value: 42 },
    { label: 'Tue', value: 78 },
    { label: 'Wed', value: 55 },
    { label: 'Thu', value: 91 },
    { label: 'Fri', value: 63 },
    { label: 'Sat', value: 35 },
    { label: 'Sun', value: 48 },
];

const barColors = [
    '#3a86ff',
    '#8338ec',
    '#ff006e',
    '#fb5607',
    '#ffbe0b',
    '#06d6a0',
    '#118ab2',
];

function onTerminalReady(context: TerminalContext) {
    const w = context.width;
    const h = context.height;
    const maxValue = Math.max(...data.map(d => d.value));

    const padding = {
        top: 24,
        right: 16,
        bottom: 24,
        left: 40,
    };

    const chartWidth = w - padding.left - padding.right;
    const chartHeight = h - padding.top - padding.bottom;

    const xScale = scaleBand(
        data.map(d => d.label),
        [0, chartWidth],
        { innerPadding: 0.2 }
    );

    const yScale = scaleContinuous(
        [0, maxValue],
        [chartHeight, 0]
    );

    context.clear();

    context.batch(() => {
        createText({
            fill: '#e0e0e0',
            x: 8,
            y: 0,
            content: 'Weekly Activity',
        }).render(context);

        createLine({
            stroke: '#444444',
            x1: padding.left,
            y1: padding.top,
            x2: padding.left,
            y2: padding.top + chartHeight,
        }).render(context);

        createLine({
            stroke: '#444444',
            x1: padding.left,
            y1: padding.top + chartHeight,
            x2: padding.left + chartWidth,
            y2: padding.top + chartHeight,
        }).render(context);

        const tickCount = 4;
        for (let i = 0; i <= tickCount; i++) {
            const value = Math.round((maxValue / tickCount) * i);
            const yPos = padding.top + yScale(value);

            createLine({
                stroke: '#333333',
                x1: padding.left + 1,
                y1: yPos,
                x2: padding.left + chartWidth,
                y2: yPos,
            }).render(context);

            createText({
                fill: '#888888',
                x: 0,
                y: yPos - 8,
                content: String(value).padStart(4),
            }).render(context);
        }

        data.forEach((item, index) => {
            const barX = padding.left + (xScale(item.label) ?? 0);
            const barWidth = xScale.bandwidth;
            const barHeight = chartHeight - yScale(item.value);
            const barY = padding.top + yScale(item.value);

            createRect({
                fill: barColors[index % barColors.length],
                x: barX,
                y: barY,
                width: barWidth,
                height: barHeight,
            }).render(context);

            createText({
                fill: '#888888',
                x: barX,
                y: padding.top + chartHeight + 8,
                content: item.label,
            }).render(context);
        });
    });
}
</script>
