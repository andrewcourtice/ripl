[Documentation](../../packages.md) / @ripl/svg

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
import {
    createContext,
} from '@ripl/svg';
import {
    createCircle,
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fill: 'rgb(30, 105, 120)',
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

[MIT](../../_media/LICENSE)

## Classes

| Class | Description |
| ------ | ------ |
| [SVGContext](classes/SVGContext.md) | SVG rendering context implementation, mapping the unified API to SVG DOM elements via virtual-DOM reconciliation. |
| [SVGImage](classes/SVGImage.md) | SVG-specific image element wrapping a `CanvasImageSource` as an SVG `<image>` tag. |
| [SVGPath](classes/SVGPath.md) | SVG-specific path implementation that builds an SVG `d` attribute string from drawing commands. |
| [SVGText](classes/SVGText.md) | SVG-specific text element mapping position and content to SVG `<text>` attributes. |
| [SVGTextPath](classes/SVGTextPath.md) | SVG `<textPath>` element for rendering text along a path defined in `<defs>`. |

## Interfaces

| Interface | Description |
| ------ | ------ |
| [SVGContextElement](interfaces/SVGContextElement.md) | An SVG-specific context element carrying its rendering definition. |
| [SVGContextElementDefinition](interfaces/SVGContextElementDefinition.md) | Definition for an SVG context element, describing its tag, inline styles, and attributes. |

## Functions

| Function | Description |
| ------ | ------ |
| [createContext](functions/createContext.md) | Creates an SVG rendering context attached to the given DOM target. |
