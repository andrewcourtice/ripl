---
outline: "deep"
---

# Rendering Targets

Every Ripl chart draws through the core `Context` abstraction, so the chart itself is target-agnostic. The `target` argument of any `createXChart` factory accepts:

- a **CSS selector** or **`HTMLElement`** — the chart creates a Canvas context inside it (the default), or
- a **`Context`** — any Ripl rendering context: Canvas, SVG, or terminal.

Because charts never talk to a specific backend directly, switching a chart from Canvas to SVG — or to a terminal — is a change to how you construct the target, not to the chart code.

## Canvas (Default)

Pass a selector or element and the chart renders to a `<canvas>`:

```ts
import {
    createBarChart,
} from '@ripl/charts';

const chart = createBarChart('#chart-container', {
    data,
    key: 'month',
    series,
});
```

Canvas is the best default for charts: it handles frequent animated redraws with a flat per-frame cost regardless of DOM size.

## SVG

To render the same chart as SVG, create an SVG context with `createContext` from `@ripl/svg` and pass it as the target:

```ts
import {
    createBarChart,
} from '@ripl/charts';

import {
    createContext,
} from '@ripl/svg';

const context = createContext('#chart-container');

const chart = createBarChart(context, {
    data,
    key: 'month',
    series,
});
```

Everything else — options, animations, tooltips, events, `update()` — behaves identically. The SVG context diffs its DOM output between frames, so animated charts update the existing SVG elements rather than rebuilding the tree.

Choose SVG when you need:

- **Crisp output at any zoom level** — vector output scales without rasterization artifacts.
- **Inspectable/exportable markup** — `context.export().toString()` returns the SVG markup itself.
- **CSS/DOM integration** — the chart's elements are real SVG nodes.

## Terminal

The terminal context (`@ripl/terminal`) rasterizes the same scenegraph into Unicode braille characters with ANSI truecolor. It implements the `Context` contract, so a chart accepts it like any other target. A terminal context is constructed from a `TerminalOutput` adapter — an object with `write`, `columns`, `rows`, and an optional `onResize`:

```ts
import {
    createLineChart,
} from '@ripl/charts';

import {
    createContext,
} from '@ripl/terminal';

// `output` implements { write, columns, rows, onResize? } — e.g. an
// xterm.js instance in the browser, or process.stdout in Node.
const context = createContext(output, {
    logicalWidth: 800,
    logicalHeight: 600,
});

const chart = createLineChart(context, {
    data,
    key: 'month',
    series,
    animation: false,
});
```

In Node, `@ripl/node` supplies the stdout-backed adapter (`createTerminalOutput()`) and configures the platform factory — see [Server-Side Rendering](/charts/advanced/server-side-rendering).

The optional `logicalWidth`/`logicalHeight` options let you author in CSS-pixel coordinates; the context scales and letterboxes that space into the character grid, so the chart renders proportionally in any terminal size.

> [!WARNING]
> The terminal context is a pure rasterizer: pointer events and hit-testing, gradients, images, and transforms are not supported. Interactive features (tooltips, hover highlights, crosshair) are inert there, and charts render best with `animation: false`.

For the full terminal context reference, see the [Terminal context docs](/docs/core/contexts/terminal).

## Switching Targets at Runtime

A chart binds to its context at construction, so switching backends means creating a new chart against a new context:

```ts
import {
    createBarChart,
} from '@ripl/charts';

import {
    createContext,
} from '@ripl/svg';

let chart = createBarChart('#container', options);

function switchToSVG() {
    chart.destroy(); // tears down the old context, scene, and listeners

    chart = createBarChart(createContext('#container'), options);
}
```

Always `destroy()` the outgoing chart first — it destroys the chart's scene and context and cleans up all event subscriptions.

## Exporting from Any Target

Whatever the backend, `chart.export()` snapshots the underlying context:

```ts
const snapshot = chart.export();

snapshot.toString(); // Canvas: PNG data URL · SVG: markup · Terminal: braille text
snapshot.toURL(); // object URL you can open or download
await snapshot.toImage(); // low-level ImageData
```
