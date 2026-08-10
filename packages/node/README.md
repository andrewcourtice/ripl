# @ripl/node

[![npm](https://img.shields.io/npm/v/@ripl/node)](https://www.npmjs.com/package/@ripl/node)
[![license](https://img.shields.io/npm/l/@ripl/node)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/node)](https://bundlephobia.com/package/@ripl/node)

> The Node.js entry point for [Ripl](https://www.ripl.run): renders scenes and charts to a terminal with no browser and no DOM emulation.

## Features

- **Platform bindings on import** — importing the package registers frame scheduling, `performance.now`, a device pixel ratio of 1, default drawing state, text measurement and element stubs, so `@ripl/core` runs off-browser without a DOM shim.
- **Re-exports `@ripl/core` and `@ripl/terminal`** — one import gives you the elements, scene, renderer and the terminal context together.
- **`createTerminalOutput()`** — a `process.stdout`-backed `TerminalOutput`. Resize subscribers are multiplexed behind a single `SIGWINCH` handler, so ten scenes do not trip Node's `MaxListenersExceededWarning`.
- **Terminal-accurate text metrics** — measurement matches what the terminal actually paints (one braille cell per character, scaled by the requested font size), so a box does not jump between the first layout pass and the first frame.
- **Unref'd frame timer** — the render loop never keeps an otherwise-idle process alive.
- **Charts included** — [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) draws through the same `Context`, so every chart type works from a script.

## Installation

```bash
# npm
npm install @ripl/node

# yarn
yarn add @ripl/node

# pnpm
pnpm add @ripl/node
```

`@ripl/core` and `@ripl/terminal` arrive as dependencies and are re-exported, so this is the only package a terminal project installs. Add [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) for charts.

## Quick start

```typescript
import {
    createCircle,
    createContext,
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
| [`createTerminalOutput`](https://www.ripl.run/docs/core/contexts/node) | A `TerminalOutput` backed by `process.stdout` |
| [`createContext`](https://www.ripl.run/docs/core/contexts/terminal) | The terminal context, re-exported from `@ripl/terminal` |
| [`createScene` / `createRenderer`](https://www.ripl.run/docs/core/essentials/scene) | The scene graph and render loop, re-exported from `@ripl/core` |

## Related packages

- [`@ripl/terminal`](https://www.npmjs.com/package/@ripl/terminal) — the braille/ANSI rendering context itself
- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the elements, scene graph and animation
- [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) — 25 chart types, renderable from a Node script

## Documentation

Guides and the full API reference are at [ripl.run/docs/core/contexts/node](https://www.ripl.run/docs/core/contexts/node).

## License

[MIT](../../LICENSE)
