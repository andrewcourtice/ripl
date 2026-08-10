# @ripl/devtools

[![npm](https://img.shields.io/npm/v/@ripl/devtools)](https://www.npmjs.com/package/@ripl/devtools)
[![license](https://img.shields.io/npm/l/@ripl/devtools)](https://github.com/andrewcourtice/ripl/blob/main/LICENSE)
[![size](https://img.shields.io/bundlephobia/minzip/@ripl/devtools)](https://bundlephobia.com/package/@ripl/devtools)

> The page-side bridge between a [Ripl](https://www.ripl.run) context and the [Ripl Devtools browser extension](https://chromewebstore.google.com/detail/ripl-devtools/fbcceifmhbcmmbmkphpjepigabdiamjb): live scene-graph inspection, property editing and event recording.

## Features

- **One call to bind** — `createDevtools(context, scene?, renderer?)` announces the binding to the extension, streams the scene graph on request, and applies commands sent back: element property edits, renderer debug overlay toggles and hover highlighting.
- **Idle until connected** — until the devtools panel connects, a binding only announces itself. No serialization, no listeners, effectively no runtime cost from shipping one.
- **Chunked, idle-time snapshots** — once connected, tree snapshots serialize during browser idle time and stream in small chunks, so a large scene never blocks rendering.
- **Event recording is a second opt-in** — nothing is observed until the panel's Events tab asks, and the subscription is torn down when it stops. It subscribes through `EventBus`'s `'*'` wildcard, which `has()` cannot see, so recording never turns an element into a hit-test target. High-frequency types (`updated`, `render`, `tick`) are excluded by default and filtering happens in the page, so suppressed events never reach the wire.
- **Version and capability reporting** — each binding reports the Ripl version it was built against (`RIPL_VERSION`, `ContextInfo.riplVersion`) and the optional protocol features it implements (`ContextInfo.capabilities`), so a newer extension paired with an older bridge degrades with an explanation rather than showing nothing.
- **Multiple contexts per page** — call `createDevtools` once per context; calling it again for an already-bound context returns the existing binding.

## Installation

```bash
# npm
npm install @ripl/devtools

# yarn
yarn add @ripl/devtools

# pnpm
pnpm add @ripl/devtools
```

Pair it with the [Ripl Devtools browser extension](https://chromewebstore.google.com/detail/ripl-devtools/fbcceifmhbcmmbmkphpjepigabdiamjb), which adds a **Ripl** panel with an **Elements** tab (element tree, editable properties, renderer debug switches, listener information) and an **Events** tab (scrubbable timeline, event list, payload details), plus a toolbar icon showing whether Ripl was detected on the page.

## Quick start

```typescript
import {
    createDevtools,
} from '@ripl/devtools';

import {
    createContext,
    createRenderer,
    createScene,
} from '@ripl/web';

const context = createContext('.mount-element');
const scene = createScene(context);
const renderer = createRenderer(scene);

if (import.meta.env.DEV) {
    const devtools = createDevtools(context, scene, renderer);

    // devtools.dispose();
}
```

The scene and renderer are optional; a context alone is enough to inspect.

## Key API

| Export | What it does |
| --- | --- |
| [`createDevtools`](https://www.ripl.run/docs/core/advanced/devtools) | Binds a context, scene and renderer to the extension |
| [`Devtools`](https://www.ripl.run/docs/core/advanced/devtools) | The binding itself, with `dispose()` for teardown |
| [`DevtoolsOptions`](https://www.ripl.run/docs/core/advanced/devtools) | `label` for identifying a binding in the UI |
| [`RIPL_VERSION`](https://www.ripl.run/docs/core/advanced/devtools) | The Ripl version a binding was built against |

## Related packages

- [`@ripl/web`](https://www.npmjs.com/package/@ripl/web) — the browser entry point supplying the context, scene and renderer
- [`@ripl/core`](https://www.npmjs.com/package/@ripl/core) — the scene graph and event bus this bridge observes
- [`@ripl/charts`](https://www.npmjs.com/package/@ripl/charts) — charts expose `chart.scene` and `chart.renderer`, so they bind the same way

## Documentation

Guides and the full API reference are at [ripl.run/docs/core/advanced/devtools](https://www.ripl.run/docs/core/advanced/devtools). The extension source lives in this repository under `apps/devtools-extension`.

## License

[MIT](../../LICENSE)
