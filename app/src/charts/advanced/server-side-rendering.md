---
outline: "deep"
---

# Server-Side Rendering

Ripl charts can render without a browser. The `@ripl/node` package configures Ripl's platform factory for Node.js — animation timing, text measurement, default state — and re-exports everything from `@ripl/core` and `@ripl/terminal`, so a single import gets you a working headless pipeline.

> [!NOTE]
> For the platform details (which factory bindings `@ripl/node` installs), see the [Node runtime docs](/docs/core/contexts/node).

## Setup

```bash
npm install @ripl/node @ripl/charts
```

Import `@ripl/node` at the top of your entry point. The import itself configures the runtime — it is the Node equivalent of importing `@ripl/web` in the browser:

```ts
import '@ripl/node';
```

Without a DOM, there is no Canvas or SVG backend; the built-in headless rendering target is the **terminal context**, which rasterizes the scenegraph into braille characters with ANSI truecolor.

## Rendering a Chart Headlessly

Create a terminal context from the stdout-backed output adapter and pass it to any chart factory:

```ts
import '@ripl/node';

import {
    createContext,
    createTerminalOutput,
} from '@ripl/node';

import {
    createBarChart,
} from '@ripl/charts';

const output = createTerminalOutput(); // backed by process.stdout
const context = createContext(output, {
    logicalWidth: 800,
    logicalHeight: 480,
});

const chart = createBarChart(context, {
    data: [
        { month: 'Jan',
            sales: 120 },
        { month: 'Feb',
            sales: 200 },
        { month: 'Mar',
            sales: 150 },
    ],
    key: 'month',
    series: [
        { id: 'sales',
            label: 'Sales',
            value: 'sales' },
    ],
    animation: false,
});
```

Two options matter in headless environments:

- **`animation: false`** — renders the final frame immediately. Animations do run headlessly (`@ripl/node` shims `requestAnimationFrame` onto `setTimeout`), but for a one-shot render or a CI snapshot you want the settled state, not a tween.
- **`logicalWidth` / `logicalHeight`** — author the chart in CSS-pixel coordinates; the terminal context scales and letterboxes that space into the character grid.

Interactive features (tooltips, hover highlights, crosshair) are inert in the terminal — it has no pointer events.

## Exporting

Every context snapshots its output via `export()`; charts forward it with `chart.export()`:

```ts
const snapshot = chart.export();

// The rendered chart as plain braille text — log it, write it to a file,
// or embed it in CLI output.
const text = snapshot.toString();

// Raw pixel data (ImageData) rasterized from the braille grid — pass it to
// any PNG encoder to produce an image file.
const image = await snapshot.toImage();
```

`toString()` is the natural fit for CLI tools and logs. `toImage()` returns environment-agnostic `ImageData` (width, height, and an RGBA byte array); Node has no built-in PNG encoder, so pair it with one of your choosing to write image files. (`toURL()` relies on browser object URLs and is not useful in Node.)

## Awaiting a Render

`render()` is async and resolves when the render pass (including any transitions) completes. When you need to export deterministically — for example in a test or a build step — disable `autoRender` and await an explicit render:

```ts
const chart = createBarChart(context, {
    data,
    key: 'month',
    series,
    animation: false,
    autoRender: false,
});

await chart.render();

const text = chart.export().toString();
```

## What About Headless Canvas or SVG?

`@ripl/node` deliberately ships no DOM emulation: its factory stubs return inert elements, so the Canvas (`@ripl/canvas`) and SVG (`@ripl/svg`) contexts are not supported out of the box in Node. If you need raster or vector output server-side, render to the terminal context and encode `toImage()` yourself, or run the browser contexts in an environment that provides a real DOM and canvas implementation.
