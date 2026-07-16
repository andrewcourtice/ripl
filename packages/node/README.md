# @ripl/node

Node.js runtime bindings for [Ripl](https://www.ripl.run) — render Ripl graphics in headless environments.

## Installation

```bash
npm install @ripl/node
```

## Overview

`@ripl/node` configures Ripl's platform factory for Node.js and provides a `TerminalOutput` adapter backed by `process.stdout`. Importing it wires the [`@ripl/terminal`](https://www.npmjs.com/package/@ripl/terminal) context and stubbed platform helpers so scenes can render to the terminal (braille/ANSI) without a browser or DOM.

## Usage

```typescript
import {
    createTerminalOutput,
} from '@ripl/node';

import {
    createContext,
} from '@ripl/terminal';

import {
    createCircle,
} from '@ripl/core';

const output = createTerminalOutput(); // backed by process.stdout
const context = createContext(output);

createCircle({
    stroke: '#38bdf8',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: context.width / 3,
}).render(context);
```

## Documentation

Full documentation and interactive demos are available at [ripl.run](https://www.ripl.run).

## License

[MIT](../../LICENSE)
