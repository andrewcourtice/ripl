---
outline: "deep"
---

# Terminal Context

The **Terminal context** renders elements to a character-based terminal using Unicode braille patterns (U+2800–U+28FF). Each terminal cell encodes a 2×4 grid of sub-pixel dots, giving 8× the resolution of plain text. It supports ANSI truecolor for full-color output.

## Demo

The demo below renders a bar chart live in an xterm.js terminal widget — the same `@ripl/terminal` code that runs in Node.js:

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

Since `@ripl/terminal` is runtime-agnostic, you can wire it to any output that implements the `TerminalOutput` interface — including an xterm.js instance in the browser:

```ts
import { Terminal } from '@xterm/xterm';
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
2. Rasterizes them onto a sub-pixel grid using algorithms like Bresenham's line, midpoint circle, and adaptive Bézier subdivision
3. Applies scanline fill for filled shapes
4. Maps CSS colors to ANSI truecolor escape sequences
5. Encodes each 2×4 cell into a Unicode braille character
6. Flushes the serialized output to the `TerminalOutput` adapter

## Extensible Rasterizer

The default `BrailleRasterizer` can be swapped for alternative character sets by implementing the `Rasterizer` interface:

```ts
interface Rasterizer {
    readonly pixelWidth: number;
    readonly pixelHeight: number;
    resize(cols: number, rows: number): void;
    setPixel(x: number, y: number, color: string): void;
    setChar(col: number, row: number, char: string, color: string): void;
    clear(): void;
    serialize(): string;
}
```

Pass a custom rasterizer via the `rasterizer` option when creating a context.

## Limitations

- **No interaction** — Terminal contexts do not support pointer events or hit testing
- **No gradients** — CSS gradient strings are not supported; use solid colors
- **No image drawing** — `drawImage` is a no-op
- **Monospace text** — Text is placed at character-grid positions; font metrics are approximate
- **No transforms** — `rotate`, `scale`, `translate` are currently no-ops
- **Resolution** — Limited by braille dot density (2×4 per cell)

## When to Use Terminal

Terminal is the best choice when:

- **Server-side rendering** — Visualize data in CI/CD pipelines, monitoring dashboards, or CLI tools
- **No browser available** — Render charts and graphics in headless environments
- **Quick prototyping** — See rendering output without setting up a browser environment

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
