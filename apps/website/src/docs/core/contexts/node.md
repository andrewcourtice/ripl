---
outline: "deep"
---

# Node Runtime

The `@ripl/node` package provides Node.js runtime bindings for Ripl. It configures the global factory with Node-compatible implementations and re-exports everything from `@ripl/core` and `@ripl/terminal`, so you only need a single import to get started.

## Installation

```bash
npm install @ripl/node
```

## Usage

Import `@ripl/node` at the top of your entry point to configure the runtime factory. This is equivalent to importing `@ripl/web` in a browser environment:

```ts
import '@ripl/node';

import {
    createCircle,
    createContext,
    createRenderer,
    createScene,
    createTerminalOutput,
} from '@ripl/node';

// Create a terminal context bound to process.stdout
const output = createTerminalOutput();
const context = createContext(output);

// Use the scene and renderer as normal
const scene = createScene(context);
const renderer = createRenderer(scene);

renderer.start();

createCircle({
    fill: '#3a86ff',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: 40,
}).render(context);
```

## Factory Configuration

`@ripl/node` sets the following factory implementations:

| Factory Method | Node Implementation |
|---|---|
| `requestAnimationFrame` | `setTimeout(cb, 16)` (~60fps) |
| `cancelAnimationFrame` | `clearTimeout` |
| `now` | `performance.now()` |
| `devicePixelRatio` | `1` |
| `createContext` | Creates a `TerminalContext` with `createTerminalOutput()` |
| `measureText` | Monospace approximation (8px per character) |
| `getDefaultState` | Sensible defaults for terminal rendering |

## `createTerminalOutput()`

Creates a `TerminalOutput` adapter backed by `process.stdout`:

- **`write`**: writes ANSI escape sequences to stdout
- **`columns` / `rows`**: reads terminal dimensions from `process.stdout.columns` and `process.stdout.rows`
- **`onResize`**: listens for `SIGWINCH` signals to detect terminal resize events

## Comparison with `@ripl/web`

| | `@ripl/web` | `@ripl/node` |
|---|---|---|
| **Environment** | Browser | Node.js |
| **Rendering** | Canvas 2D / SVG | Braille characters (ANSI) |
| **Animation** | `requestAnimationFrame` | `setTimeout(cb, 16)` |
| **Interaction** | Mouse/pointer events | None |
| **Text** | Full font metrics | Monospace approximation |
| **Gradients** | CSS gradient strings | Solid colors only |
| **Output** | DOM element | `process.stdout` / any `TerminalOutput` |

## Rendering Charts

Charts from `@ripl/charts` accept a terminal context as their target like any other context; see [Server-Side Rendering](/charts/advanced/server-side-rendering) for a complete headless charting example.
