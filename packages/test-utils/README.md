# @ripl/test-utils

> Canvas mocks and polyfills for [Ripl](https://www.ripl.run)'s own test suites, running under [Vitest](https://vitest.dev/) with `jsdom`.

**Internal to the Ripl monorepo.** This package is marked `private` and is never published to npm, so there is nothing to install — it resolves through the workspace. It is documented here for contributors.

## Features

- **`mockCanvasContext()`** — stubs `HTMLCanvasElement.prototype.getContext` with a spyable `CanvasRenderingContext2D`, so a test can assert which drawing calls a context issued.
- **`mockCanvasState(stub)`** — upgrades that stub with a real save/restore stack and a real CTM, plus `getMatrix()` and `getSaveDepth()` readouts. The default stub's `save`/`restore` are no-ops with no CTM, which structurally hides every state-stack and transform defect; reach for this whenever a test asserts the state after a scope closes, the transform in force at a draw call, or that a frame left no `save()` outstanding.
- **`mockTextMetrics(stub, options)`** — reports anchor-relative `actualBoundingBox*` metrics that shift with `textAlign`/`textBaseline`, matching how a real canvas measures.
- **`polyfillPath2D()`** and **`polyfillImageData()`** — install minimal `Path2D` and `ImageData` implementations on `globalThis`, neither of which jsdom ships.

## Usage

```typescript
import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    mockCanvasContext,
    mockCanvasState,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Context', () => {

    test('Should leave no save outstanding after a frame', () => {
        const stub = mockCanvasState(mockCanvasContext());

        expect(stub.getSaveDepth()).toBe(0);
    });

});
```

## Key API

| Export | What it does |
| --- | --- |
| `mockCanvasContext` | Spyable `CanvasRenderingContext2D` stub |
| `mockCanvasState` | Real save/restore stack and CTM on top of that stub |
| `mockTextMetrics` | Anchor-relative text metrics honoring alignment |
| `polyfillPath2D` | Minimal `Path2D` on `globalThis` |
| `polyfillImageData` | Minimal `ImageData` on `globalThis` |

## Related packages

- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the rendering core whose tests use these mocks
- [`@ripl/canvas`](https://www.npmjs.com/package/@ripl/canvas) — the Canvas 2D context they stand in for
- [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) — chart tests that assert drawing calls

## Documentation

Testing conventions live in [`AGENTS.md`](../../AGENTS.md); the rest of the library is documented at [ripl.run](https://www.ripl.run).

## License

[MIT](../../LICENSE)
