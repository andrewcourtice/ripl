---
outline: "deep"
---

# Devtools

Ripl ships browser developer tools for inspecting and editing live scenes. They come in two parts: the **[@ripl/devtools](https://www.npmjs.com/package/@ripl/devtools)** package (a small runtime bridge you opt into in your app) and the **[Ripl Devtools Chrome extension](https://chromewebstore.google.com/detail/ripl-devtools/fbcceifmhbcmmbmkphpjepigabdiamjb)** that adds a **Ripl** panel to the browser devtools, much like the built-in Elements panel.

Once bound, the panel shows the full element tree of every Ripl context on the page, lets you edit element properties live, toggles renderer debug overlays, and records every event the scene fires onto a timeline.

> [!NOTE]
> For the full API, see the [Devtools API Reference](/docs/api/@ripl/devtools/).

## Demo

The scene below is bound to the devtools. In fact, **every demo on this site is devtools-bound**: [install the extension](https://chromewebstore.google.com/detail/ripl-devtools/fbcceifmhbcmmbmkphpjepigabdiamjb), open your browser devtools, and select the **Ripl** panel to inspect any of them live.

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

Call `createDevtools` once per context, passing the context and, optionally, its scene and renderer. Binding the scene enables the element tree; binding the renderer enables the debug overlay switches.

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

A few things to know:

- **`scene` and `renderer` are optional.** With just a context you still get context detection and metadata; add the scene for the element tree and the renderer for debug overlays.
- **One binding per context.** Calling `createDevtools` again for the same context returns the existing binding.
- **Idle by default.** Until you open the **Ripl** panel, a binding only announces its presence. No scene serialization or event listening happens, so it is effectively zero-cost. This is why the example gates on `import.meta.env.DEV`: it is safe to ship, but there is rarely a reason to bind in production.
- **Self-cleaning.** A binding disposes automatically when its context, scene, or renderer is destroyed. Call `dispose()` yourself if you need to unbind sooner.

> [!TIP]
> Bindings are cheap, but you can leave them enabled in production too if you want your live app to be inspectable. The bridge stays idle until someone opens the panel.

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

The companion Chrome extension adds a **Ripl** panel to your browser devtools, split into two tabs.

**Elements** shows:

- an **element tree** of every context on the page, rendered as pseudo-XML with each element's set properties as attributes, scrollable sideways to read long attribute lists, and expandable or collapsible in one click;
- an **editable properties** panel to change numbers, strings, colors and more, with edits that round-trip to the live element, badging Ripl's own elements as built-in and linking to their documentation;
- **renderer debug switches** for an FPS counter, element count, and bounding boxes;
- an **events** list showing which events the selected element emits and whether any listeners are attached.

**Events** records what the scene actually did:

- a **timeline** — itself drawn with Ripl — with a lane per event source, which you can drag to scrub and scroll to zoom;
- a **list** of every recorded event with its name, time and originating element;
- a **details** panel showing the full payload of the selected event, and a jump back to its element in the Elements tab.

Recording uses the [`'*'` wildcard subscription](/docs/core/advanced/events#wildcard), so it observes the scene without changing how it behaves — an observed element is still not a hit-test target.

`updated`, `render` and `tick` are excluded by default because they fire every frame or every state write; switch any of them back on from the toolbar. The filter is applied in the page, so events you have excluded are never sent.

A toolbar icon lights up when Ripl is detected on the page; clicking it lists the contexts it found.

> [!NOTE]
> Event recording needs a page-side bridge that supports it. A page running an older `@ripl/devtools` still works for everything else; the Events tab tells you to upgrade rather than showing an empty timeline.

> [!TIP]
> **[Install Ripl Devtools from the Chrome Web Store.](https://chromewebstore.google.com/detail/ripl-devtools/fbcceifmhbcmmbmkphpjepigabdiamjb)**
>
> Prefer to run it from source? Build the `apps/devtools-extension` workspace and load its `dist/` folder via **Load unpacked** at `chrome://extensions` (with Developer mode enabled). See the extension's `README.md` for the full steps.

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
