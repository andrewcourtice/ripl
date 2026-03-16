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
    createNodeOutput,
    createRenderer,
    createScene,
    createTerminalContext,
} from '@ripl/node';

// Create a terminal context bound to process.stdout
const output = createNodeOutput();
const context = createTerminalContext(output);

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
| `createContext` | Creates a `TerminalContext` with `createNodeOutput()` |
| `measureText` | Monospace approximation (8px per character) |
| `getDefaultState` | Sensible defaults for terminal rendering |

## `createNodeOutput()`

Creates a `TerminalOutput` adapter backed by `process.stdout`:

- **`write`** — Writes ANSI escape sequences to stdout
- **`columns` / `rows`** — Reads terminal dimensions from `process.stdout.columns` and `process.stdout.rows`
- **`onResize`** — Listens for `SIGWINCH` signals to detect terminal resize events

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

## Running Demos

See `apps/node-demo/` in the repository for working examples:

```bash
# Static scene
npx tsx apps/node-demo/static.ts

# Animated shapes
npx tsx apps/node-demo/animated.ts

# Bar chart
npx tsx apps/node-demo/chart.ts
```
