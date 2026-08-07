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
| **Transforms** (`translate`/`rotate`/`scale`, and element/group transform state) | **Honored.** Geometry is mapped through the full affine matrix, so a rotated marker draws rotated and a translated group draws where the transform puts it. |
| **Rotated text** | A glyph fills a whole cell and cannot itself be rotated, so a rotated run advances along whichever of eight compass directions the transform is nearest. A quarter-turn axis title reads *down the side* of a chart. |
| **Stroke width under a transform** | A round pen is genuinely elliptical under a non-uniform scale, so `lineWidth` maps through the geometric mean of the transform's scale factors. |
| **Clipping** | Honored. `applyClip` intersects with any clip already in force, so nested clips narrow rather than replace, and glyphs clip on their cell centre. |
| **Hit testing** | Honored. `isPointInPath`/`isPointInStroke` test the path's flattened contours in logical space; both fill rules are supported. Note that `@ripl/terminal` has no pointer source of its own — a host that has one (xterm.js in a browser) drives `Context.hitTest` itself. |
| **Images** | `drawImage` is a no-op. |
| **Text metrics** | One terminal cell per glyph, regardless of `font`. The `font` state has no visual effect. |
| **Text on a path** | Drawn straight from the anchor; `pathData`/`startOffset` are ignored. |
| **Fill rule** | Even-odd only when rasterizing; a `nonzero` fill rule is ignored there, though hit testing honors both. |
| **Gradients and patterns** | Resolved to a single color — the gradient's first stop, or the pattern's foreground. |
| **Opacity and alpha** | Pixels are composited source-over in an RGBA framebuffer, so overlapping translucent shapes blend correctly. A cell emits one color — the alpha-weighted mean of its lit dots — and residual alpha composites against an assumed background (opaque black by default, configurable per rasterizer). Zero alpha draws nothing. |
| **Stroke geometry** | `lineWidth` **is** honored, by stamping a round brush along the path. The brush centres on a dot, so thickness quantises to an odd number of dots — widths of 1, 2, 3, 4 and 5 give strokes 1, 3, 3, 5 and 5 dots across. `lineCap`, `lineJoin` and `miterLimit` are ignored: the brush makes every cap and join round. `lineDash`/`lineDashOffset` **are** honored, with arc length measured along the centreline and approximated by plotted-pixel count. |
| **Shadows, filters, compositing** | Ignored. `globalCompositeOperation: 'destination-out'` warns: canvas *erases* where the terminal *draws*, so that geometry renders inverted rather than merely degraded. |

## Migrating a custom rasterizer

The `Rasterizer` interface changed so that pixels can be composited rather than overwritten. A custom implementation needs three changes:

- `setPixel(x, y, color)` and `setChar(col, row, char, color)` now take a `TerminalColor` — an
  `[r, g, b, a]` tuple, or `null` for the terminal's own default foreground — instead of a pre-baked
  ANSI escape string. Alpha is no longer folded into the color before it arrives.
- Add `cellWidth` and `cellHeight`. Text placement and teardown read them instead of assuming
  braille's 2×4 cell, so a rasterizer with different cell geometry now positions text correctly.
- A cell can only emit one color; deriving it from the pixels it covers is the implementation's job.
  `BrailleRasterizer` uses the alpha-weighted mean of its lit dots.

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
