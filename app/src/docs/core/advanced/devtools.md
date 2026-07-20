---
outline: "deep"
---

# Devtools

Ripl ships browser developer tools for inspecting and editing live scenes. They come in two parts: the **[@ripl/devtools](https://www.npmjs.com/package/@ripl/devtools)** package — a small runtime bridge you opt into in your app — and a **Chrome extension** that adds a **Ripl** panel to the browser devtools, much like the built-in Elements panel.

Once bound, the panel shows the full element tree of every Ripl context on the page, lets you edit element properties live, toggles renderer debug overlays, and reports which events have listeners attached.

> [!NOTE]
> For the full API, see the [Devtools API Reference](/docs/api/@ripl/devtools/).

## Demo

The scene below is bound to the devtools. In fact, **every demo on this site is devtools-bound** — install the extension, open your browser devtools, and select the **Ripl** panel to inspect any of them live.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createRenderer,
    createScene,
} from '@ripl/web';

import {
    createDevtools,
} from '@ripl/devtools';

const context = createContext('.container');
const scene = createScene(context);
const renderer = createRenderer(scene);

// Bind the devtools in development only.
if (import.meta.env.DEV) {
    createDevtools(context, scene, renderer);
}
```
:::

## Installation

```bash
npm install @ripl/devtools
```

## Setup

Call `createDevtools` once per context, passing the context and — optionally — its scene and renderer. Binding the scene enables the element tree; binding the renderer enables the debug overlay switches.

```ts
import {
    createContext,
    createRenderer,
    createScene,
} from '@ripl/web';

import {
    createDevtools,
} from '@ripl/devtools';

const context = createContext('.container');
const scene = createScene(context);
const renderer = createRenderer(scene);

if (import.meta.env.DEV) {
    const devtools = createDevtools(context, scene, renderer);

    // Later, when tearing the scene down:
    // devtools.dispose();
}
```

A few things worth knowing:

- **`scene` and `renderer` are optional.** With just a context you still get context detection and metadata; add the scene for the element tree and the renderer for debug overlays.
- **One binding per context.** Calling `createDevtools` again for the same context returns the existing binding.
- **Idle by default.** Until you open the **Ripl** panel, a binding only announces its presence — no scene serialization or event listening happens, so it is effectively zero-cost. This is why the example gates on `import.meta.env.DEV`: it is safe to ship, but there is rarely a reason to bind in production.
- **Self-cleaning.** A binding disposes automatically when its context, scene, or renderer is destroyed. Call `dispose()` yourself if you need to unbind sooner.

> [!TIP]
> Bindings are cheap, but you can leave them enabled in production too if you want your live app to be inspectable — the bridge stays idle until someone opens the panel.

## Options

`createDevtools` accepts an optional options object as its final argument.

| Option  | Type     | Description                                                                            |
| ------- | -------- | ------------------------------------------------------------------------------------- |
| `label` | `string` | Human-readable label shown for this binding in the devtools UI. Defaults to the context's type. |

```ts
createDevtools(context, scene, renderer, {
    label: 'Sales chart',
});
```

## Browser extension

The companion Chrome extension adds a **Ripl** panel to your browser devtools with:

- an **element tree** of every context on the page, rendered as pseudo-XML with each element's set properties as attributes;
- an **editable properties** panel — change numbers, strings, colors and more, and the edits round-trip to the live element;
- **renderer debug switches** for an FPS counter, element count, and bounding boxes;
- an **events** view showing which events the selected element emits and whether any listeners are attached.

A toolbar icon lights up when Ripl is detected on the page; clicking it lists the contexts it found.

<!-- TODO: replace with the real Chrome Web Store URL once the extension is published. -->
> [!TIP]
> **Coming soon to the Chrome Web Store.** Until then, you can build the extension from source and load it unpacked: build the `apps/devtools-extension` workspace and load its `dist/` folder via **Load unpacked** at `chrome://extensions` (with Developer mode enabled). See the extension's `README.md` for the full steps.

<script lang="ts" setup>
import {
    useAdvRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createGroup,
    createRect,
    createText,
} from '@ripl/web';

const {
    contextChanged,
} = useAdvRiplExample(({ context, scene }) => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 8;

    const rect = createRect({
        class: 'panel',
        fill: '#3a86ff',
        x: w * 0.2,
        y: h / 2 - r,
        width: r * 2,
        height: r * 2,
        borderRadius: 8,
    });

    const circle = createCircle({
        class: 'dot',
        fill: '#ff006e',
        cx: w * 0.65,
        cy: h / 2,
        radius: r,
    });

    const label = createText({
        fill: '#666',
        x: w / 2,
        y: h - 16,
        content: 'Open the Ripl devtools panel to inspect this scene',
        textAlign: 'center',
        font: '13px sans-serif',
    });

    const group = createGroup({
        class: 'shapes',
        children: [rect, circle],
    });

    scene.add([group, label]);
    scene.render();
});
</script>
