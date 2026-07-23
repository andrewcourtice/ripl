# @ripl/devtools

Runtime devtools bridge for [Ripl](https://www.ripl.run): connects Ripl contexts, scenes, and renderers to the Ripl Devtools browser extension for live scene-graph inspection and editing.

## Installation

```bash
npm install @ripl/devtools
```

## Overview

`@ripl/devtools` is the page-side half of the Ripl devtools. Calling `createDevtools` binds a context (and optionally a scene and renderer) to the devtools message protocol: the binding announces itself to the Ripl Devtools extension, streams the scene graph on demand, and applies commands sent back from the extension: element property edits, renderer debug overlay toggles, and hover highlighting.

The bridge is idle by default. Until the devtools panel connects, a binding only announces its presence; no scene serialization or event listening occurs, so shipping a binding has effectively zero runtime cost. When the panel connects, tree snapshots are serialized during browser idle time and streamed in small chunks so large scenes never block rendering.

## Usage

```typescript
import {
    createContext,
    createRenderer,
    createScene,
} from '@ripl/web';

import {
    createDevtools,
} from '@ripl/devtools';

const context = createContext('.mount-element');
const scene = createScene(context);
const renderer = createRenderer(scene);

if (import.meta.env.DEV) {
    const devtools = createDevtools(context, scene, renderer); // scene and renderer are optional

    // Later, if needed:
    // devtools.dispose();
}
```

Multiple contexts on one page are supported; call `createDevtools` once per context. Calling it again for an already-bound context returns the existing binding.

## The extension

The companion browser extension lives in the Ripl repository under `apps/devtools-extension`. It adds a **Ripl** panel to the browser devtools with an element tree, editable properties, renderer debug switches, and event listener information, plus a toolbar icon indicating whether Ripl is detected on the current page.

## Documentation

Full documentation and interactive demos are available at [ripl.run](https://www.ripl.run).

## License

[MIT](../../LICENSE)
