# @ripl/test-utils

Internal test utilities for [Ripl](https://www.ripl.run).

## Overview

This is an internal, non-published package used across the Ripl monorepo's test suites. It provides helpers for exercising rendering code under [Vitest](https://vitest.dev/) with `jsdom`, where a real canvas backend is unavailable:

- **`mockCanvasContext()`**: stubs `HTMLCanvasElement.prototype.getContext` with a spyable `CanvasRenderingContext2D`.
- **`mockCanvasState(stub)`**: upgrades that stub with a real save/restore stack and a real CTM, plus `getMatrix()` and `getSaveDepth()` readouts. Needed for any assertion about state after a scope closes, the transform in force at a draw call, or a leaked `save()`.
- **`mockTextMetrics(stub, options)`**: reports anchor-relative `actualBoundingBox*` metrics that shift with `textAlign`/`textBaseline`.
- **`polyfillPath2D()`**: installs a minimal `Path2D` polyfill on `globalThis`.

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
