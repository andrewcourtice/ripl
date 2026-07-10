# @ripl/canvas

Canvas 2D rendering context for [Ripl](https://www.ripl.rocks) — a unified API for drawing 2D graphics and data visualizations in the browser.

## Installation

```bash
npm install @ripl/canvas
```

> Most browser projects should install [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) instead, which re-exports the core library together with this Canvas context and the browser platform bindings.

## Overview

`@ripl/canvas` implements Ripl's `Context` abstraction on top of the native `CanvasRenderingContext2D`. Because every Ripl element renders through the shared `Context` API, the same drawing code runs unchanged on Canvas, [SVG](https://www.npmjs.com/package/@ripl/svg), or the [Terminal](https://www.npmjs.com/package/@ripl/terminal).

## Usage

```typescript
import {
    createContext,
} from '@ripl/canvas';

import {
    createCircle,
} from '@ripl/core';

const context = createContext('.mount-element');

createCircle({
    fill: 'rgb(30, 105, 120)',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: 50,
}).render(context);
```

## Exporting

Every context can snapshot its current output via `export()`:

```typescript
const url = context.export().toURL();        // PNG object URL
const dataUrl = context.export().toString();  // PNG data URL
const image = await context.export().toImage(); // ImageData
```

## Documentation

Full documentation and interactive demos are available at [ripl.rocks](https://www.ripl.rocks).

## License

[MIT](../../LICENSE)
