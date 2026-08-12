---
title: Rendering
description: "How <ripl-context>, <ripl-scene> and <ripl-renderer> layer up, what each one adds, and why every Ripl object exists before any child's setup runs."
---

# Rendering

Three components map onto Ripl's three rendering concerns. Each is optional above the one before it, and an element picks up the highest tier declared above it.

## `<ripl-context>`

Creates the drawing surface and provides it to everything below. It renders a plain element that the canvas fills, so it needs a size — from a class, an inline style, or its parent's layout.

```vue
<template>
    <ripl-context
        class="chart"
        :interactive="true"
        :drag-threshold="3"
        @ready="onReady"
        @resize="onResize"
    >
        <ripl-circle :cx="20" :cy="20" :radius="10" />
    </ripl-context>
</template>
```

| Prop | Description |
| --- | --- |
| `context` | An existing `Context` to draw into instead of creating one. Use this for a non-canvas backend, or to keep a context alive across re-mounts. |
| `interactive` | Whether the context listens for and emits pointer and drag events. Defaults to `true`. |
| `dragThreshold` | Minimum pointer movement, in pixels, before a drag is recognised. Defaults to `3`. |
| `meta` | Arbitrary metadata attached to the context. |

It emits `ready` with the context once its host element is in the document, plus `resize`, `render`, and every [pointer event](/docs/vue/essentials/events).

Resizing is handled by the context itself through a `ResizeObserver`. Do not add your own.

To render through SVG or another backend, build the context and pass it in:

```vue
<template>
    <ripl-context :context="context" />
</template>

<script setup lang="ts">
import {
    createContext,
} from '@ripl/svg';

import {
    shallowRef,
} from 'vue';

const host = shallowRef<HTMLElement>();
const context = shallowRef(createContext(host.value!));
</script>
```

A context you supply is yours to destroy; one the component creates is destroyed with it.

## `<ripl-scene>`

Creates a scene bound to the enclosing context and parents its subtree to it. A scene hoists the element tree into a flat instruction stream, which is what makes z-ordering, group clipping and large graphs efficient.

A scene is also an element, so its state props cascade to every descendant that does not set its own:

```vue
<template>
    <ripl-context>
        <ripl-scene fill="#333" font="14px sans-serif" :render-on-resize="true">
            <ripl-text :x="10" :y="20" content="Inherits the fill and font" />
        </ripl-scene>
    </ripl-context>
</template>
```

`renderOnResize` (default `true`) controls whether the scene repaints automatically when the context resizes.

## `<ripl-renderer>`

Drives the enclosing scene with a `requestAnimationFrame` loop, and makes [transitions](/docs/vue/essentials/transitions) available to its subtree.

```vue
<template>
    <ripl-context>
        <ripl-scene>
            <ripl-renderer :auto-stop="false" :debug="{ fps: true }" @tick="onTick">
                <ripl-circle :cx="x" :cy="50" :radius="20" />
            </ripl-renderer>
        </ripl-scene>
    </ripl-context>
</template>
```

| Prop | Description |
| --- | --- |
| `autoStart` | Whether the loop starts on creation. Defaults to `true`. |
| `autoStop` | Whether the loop stops when idle: no active transitions and the pointer has left. Defaults to `true`. |
| `immediate` | Whether transitions apply their final state immediately rather than animating. |
| `debug` | Debug overlays: `true` for all, or an object toggling `fps`, `elementCount` and `boundingBoxes`. |

It emits `start`, `stop` and `tick`.

> [!NOTE]
> A stopped renderer is woken automatically when a prop changes. Ripl's own loop only restarts on graph changes, pointer movement or a transition, so the adapter restarts it explicitly whenever it writes state.

## Ordering, and why it works

Vue runs `setup()` top-down (parent before child) but mount hooks bottom-up (child before parent). Every one of these components therefore builds its Ripl object during `setup()`, not `onMounted`: the context is constructed against a detached host element, which the component attaches on mount.

Two things follow from that, both of which you can rely on:

- A descendant's `setup()` already sees a live context, scene and renderer — [compositions](/docs/vue/essentials/compositions) resolve immediately, with no watching.
- Paint order matches template order, because `setup()` runs in template order.

Reordering a keyed `v-for` moves components rather than remounting them, so `setup()` does not run again. The adapter detects those moves separately and replays them onto the group, which means paint order tracks the template in that case too.
