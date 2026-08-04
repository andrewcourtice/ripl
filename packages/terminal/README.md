# @ripl/terminal

Terminal rendering context for [Ripl](https://www.ripl.run): draw the same 2D graphics and charts to a terminal as braille-character output with ANSI truecolor.

## Installation

```bash
npm install @ripl/terminal
```

## Overview

`@ripl/terminal` implements Ripl's `Context` abstraction without any DOM. It rasterizes elements into a grid of Unicode braille dots (each character cell packs a 2×4 sub-pixel grid) and writes them to a runtime-agnostic `TerminalOutput` adapter: `process.stdout` in Node, or an [xterm.js](https://xtermjs.org/) instance in the browser. Because every Ripl element renders through the shared `Context` API, scenes written for [Canvas](https://www.npmjs.com/package/@ripl/canvas) or [SVG](https://www.npmjs.com/package/@ripl/svg) render unchanged in the terminal.

Optional `logicalWidth`/`logicalHeight` options let you author a scene in CSS-pixel coordinates; the context uniformly scales and letterboxes that space into the character grid so it renders proportionally in any terminal size.

## Limitations

The terminal context is a rasterizer onto a character grid, so parts of the canvas contract cannot be honored. Everything below is deliberate; none of it errors.

| Feature | Behavior |
|---|---|
| **Transforms** (`translate`/`rotate`/`scale`, and element/group transform state) | **Discarded.** Not approximated — an element renders at its untransformed coordinates. A rotated axis title draws horizontally across the plot; a marker rotated by π/4 draws unrotated. Warns once per context. |
| **Hit testing** | Not supported. `isPointInPath`/`isPointInStroke` always return `false`, so pointer events never match elements. |
| **Clipping and images** | `applyClip` and `drawImage` are no-ops. |
| **Text metrics** | One terminal cell per glyph, regardless of `font`. The `font` state has no visual effect. |
| **Text on a path** | Drawn straight from the anchor; `pathData`/`startOffset` are ignored. |
| **Fill rule** | Even-odd only; a `nonzero` fill rule is ignored. |
| **Gradients and patterns** | Resolved to a single color — the gradient's first stop, or the pattern's foreground. |
| **Opacity and alpha** | A cell is lit or unlit, so `opacity` and a paint's own alpha darken the color toward an assumed dark background. Zero alpha draws nothing. |
| **Stroke geometry** | `lineWidth` **is** honored, by stamping a round brush along the path. The brush centres on a dot, so thickness quantises to an odd number of dots — widths of 1, 2, 3, 4 and 5 give strokes 1, 3, 3, 5 and 5 dots across. `lineCap`, `lineJoin` and `miterLimit` are ignored: the brush makes every cap and join round. `lineDash`/`lineDashOffset` **are** honored, with arc length measured along the centreline and approximated by plotted-pixel count. |
| **Shadows, filters, compositing** | Ignored. `globalCompositeOperation: 'destination-out'` warns: canvas *erases* where the terminal *draws*, so that geometry renders inverted rather than merely degraded. |

Charts that rely on transforms (rotated axis titles, rotated symbols) render legibly but not identically to canvas.

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
const snapshot = context.export();

const text = snapshot.toString(); // plain braille art
const image = await snapshot.toImage(); // ImageData (rasterized)
const url = snapshot.toURL(); // PNG object URL (browser)

snapshot.release(); // revokes the object URL
```

A glyph occupies a whole cell, which is only 2×4 pixels in the exported image — too small for a letterform — so text rasterizes as a filled block rather than being dropped from the image.

## Documentation

Full documentation and interactive demos are available at [ripl.run](https://www.ripl.run).

## License

[MIT](../../LICENSE)
