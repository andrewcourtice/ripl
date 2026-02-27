# @ripl/svg

SVG rendering context for [Ripl](https://www.ripl.rocks) — a unified API for 2D graphics rendering in the browser.

## Installation

```bash
npm install @ripl/svg
```

## Overview

This package provides an SVG implementation of Ripl's `Context` interface. Swap a single import to switch your entire rendering pipeline from Canvas to SVG — all elements, scenes, animations, and events work identically.

## Usage

```typescript
import { createContext } from '@ripl/svg';
import { createCircle } from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fillStyle: 'rgb(30, 105, 120)',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: 50,
});

circle.render(context);
```

## Features

- **Drop-in replacement** — Replace `@ripl/core`'s `createContext` with `@ripl/svg`'s and everything just works
- **Efficient DOM updates** — Virtual DOM reconciler minimizes DOM mutations each frame
- **Full API parity** — Paths, text, images, gradients, transforms, clipping, and hit testing
- **Gradient support** — Linear and radial gradients rendered as native SVG gradient elements

## Documentation

Full documentation and interactive demos are available at [ripl.rocks](https://www.ripl.rocks).

## License

[MIT](../../LICENSE)
