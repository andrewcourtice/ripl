# @ripl/terminal

[![npm](https://img.shields.io/npm/v/@ripl/terminal)](https://www.npmjs.com/package/@ripl/terminal)
[![license](https://img.shields.io/npm/l/@ripl/terminal)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/terminal)](https://bundlephobia.com/package/@ripl/terminal)

> A terminal rendering context for [Ripl](https://www.ripl.run): draws the same 2D graphics and charts as Unicode braille characters with ANSI truecolor, without a DOM.

## Features

- **No DOM** — implements Ripl's `Context` abstraction directly, so a scene written for [Canvas](https://www.npmjs.com/package/@ripl/canvas) or [SVG](https://www.npmjs.com/package/@ripl/svg) renders unchanged in a terminal.
- **Braille sub-pixels** — each character cell packs a 2×4 dot grid (U+2800–U+28FF), quadrupling the vertical resolution a text grid would otherwise give.
- **Source-over compositing** — pixels are held as an RGBA framebuffer at dot resolution, so overlapping translucent shapes blend rather than the later one claiming the whole cell. A cell emits the alpha-weighted mean of its lit dots.
- **Logical coordinates** — optional `logicalWidth`/`logicalHeight` let you author in CSS pixels; the context uniformly scales and letterboxes that space into the character grid, so a canvas-sized scene renders proportionally at any terminal size.
- **Transforms, clipping and hit testing** are all honored — geometry maps through the full affine matrix, nested clips intersect rather than replace, and `isPointInPath`/`isPointInStroke` test the flattened contours in logical space under both fill rules.
- **Runtime-agnostic output** — writes to any `TerminalOutput` (`write`, `columns`, `rows`, optional `onResize`): `process.stdout` via [`@ripl/node`](https://www.npmjs.com/package/@ripl/node), or an [xterm.js](https://xtermjs.org/) instance in a browser.
- **Pluggable rasterizer** — `BrailleRasterizer` is the default; the `Rasterizer` interface takes any cell geometry via `cellWidth`/`cellHeight`.
- **Snapshot export** — braille text, `ImageData`, or a PNG object URL.

## Installation

```bash
# npm
npm install @ripl/terminal @ripl/node

# yarn
yarn add @ripl/terminal @ripl/node

# pnpm
pnpm add @ripl/terminal @ripl/node
```

[`@ripl/node`](https://www.npmjs.com/package/@ripl/node) supplies the `process.stdout`-backed output adapter and the headless platform bindings. In a browser driving xterm.js, install `@ripl/terminal` alone.

## Quick start

```typescript
import {
    createContext,
} from '@ripl/terminal';

import {
    createCircle,
} from '@ripl/core';

import {
    createTerminalOutput,
} from '@ripl/node';

const context = createContext(createTerminalOutput(), {
    logicalWidth: 800,
    logicalHeight: 600,
});

createCircle({
    stroke: '#38bdf8',
    lineWidth: 3,
    cx: 400,
    cy: 300,
    radius: 150,
}).render(context);
```

## Key API

| Export | What it does |
| --- | --- |
| [`createContext`](https://www.ripl.run/docs/core/contexts/terminal) | Binds a `TerminalContext` to a `TerminalOutput` |
| [`TerminalOutput`](https://www.ripl.run/docs/core/contexts/terminal) | The `write`/`columns`/`rows` adapter interface |
| [`BrailleRasterizer`](https://www.ripl.run/docs/core/contexts/terminal) | The default 2×4 braille rasterizer |
| [`Rasterizer`](https://www.ripl.run/docs/core/contexts/terminal) | The interface to implement for other cell geometry |

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

## Exporting

```typescript
const snapshot = context.export();

const text = snapshot.toString(); // plain braille art
const image = await snapshot.toImage(); // ImageData (rasterized)
const url = snapshot.toURL(); // PNG object URL (browser)

snapshot.release(); // revokes the object URL
```

A glyph occupies a whole cell, which is only 2×4 pixels in the exported image — too small for a letterform — so text rasterizes as a filled block rather than being dropped from the image.

## Related packages

- [`@ripl/node`](https://www.npmjs.com/package/@ripl/node) — stdout adapter and headless platform bindings
- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the elements and scene graph this context draws
- [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) — the same 25 chart types, in a terminal

## Documentation

Guides, a live demo and the full API reference are at [ripl.run/docs/core/contexts/terminal](https://www.ripl.run/docs/core/contexts/terminal). That page also covers implementing a custom `Rasterizer`.

## License

[MIT](../../LICENSE)
