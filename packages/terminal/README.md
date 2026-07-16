# @ripl/terminal

Terminal rendering context for [Ripl](https://www.ripl.run) — draw the same 2D graphics and charts to a terminal as braille-character output with ANSI truecolor.

## Installation

```bash
npm install @ripl/terminal
```

## Overview

`@ripl/terminal` implements Ripl's `Context` abstraction without any DOM. It rasterizes elements into a grid of Unicode braille dots (each character cell packs a 2×4 sub-pixel grid) and writes them to a runtime-agnostic `TerminalOutput` adapter — `process.stdout` in Node, or an [xterm.js](https://xtermjs.org/) instance in the browser. Because every Ripl element renders through the shared `Context` API, scenes written for [Canvas](https://www.npmjs.com/package/@ripl/canvas) or [SVG](https://www.npmjs.com/package/@ripl/svg) render unchanged in the terminal.

Optional `logicalWidth`/`logicalHeight` options let you author a scene in CSS-pixel coordinates; the context uniformly scales and letterboxes that space into the character grid so it renders proportionally in any terminal size.

> Note: the terminal context is a rasterizer — pointer events/hit-testing, gradients, images, and transforms are not supported.

## Usage

```typescript
import {
    createContext,
} from '@ripl/terminal';

import {
    createCircle,
} from '@ripl/core';

// `output` implements { write, columns, rows, onResize? }
const context = createContext(output, {
    logicalWidth: 800,
    logicalHeight: 600,
});

createCircle({
    stroke: '#38bdf8',
    cx: 400,
    cy: 300,
    radius: 150,
}).render(context);
```

In Node, use [`@ripl/node`](https://www.npmjs.com/package/@ripl/node) to obtain a stdout-backed output adapter.

## Exporting

```typescript
const text = context.export().toString(); // plain braille art
const image = await context.export().toImage(); // ImageData (rasterized)
const url = context.export().toURL(); // PNG object URL (browser)
```

## Documentation

Full documentation and interactive demos are available at [ripl.run](https://www.ripl.run).

## License

[MIT](../../LICENSE)
