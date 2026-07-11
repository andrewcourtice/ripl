# @ripl/test-utils

Internal test utilities for [Ripl](https://www.ripl.rocks).

## Overview

This is an internal, non-published package used across the Ripl monorepo's test suites. It provides helpers for exercising rendering code under [Vitest](https://vitest.dev/) with `jsdom`, where a real canvas backend is unavailable:

- **`mockCanvasContext()`** — stubs `HTMLCanvasElement.prototype.getContext` with a spyable `CanvasRenderingContext2D`.
- **`polyfillPath2D()`** — installs a minimal `Path2D` polyfill on `globalThis`.

## Usage

```typescript
import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

beforeEach(() => {
    mockCanvasContext();
});
```

## License

[MIT](../../LICENSE)
