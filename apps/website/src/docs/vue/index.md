---
title: Introduction
description: "@ripl/vue wraps Ripl in declarative Vue 3 components, so a scene graph is a template: props drive element state, v-if and v-for drive the graph, and <ripl-transition> animates it."
---

# Vue

The `@ripl/vue` package lets you describe a Ripl scene as a Vue template instead of building it imperatively. Every built-in element is a component, props map onto element state, and `v-if` / `v-for` drive the graph. Compositions give you the underlying context, scene, renderer and element whenever the declarative surface is not enough.

This adapter targets [`@ripl/web`](/docs/core/contexts/canvas), i.e. Canvas 2D. To draw through another backend, construct the context yourself and hand it to `<ripl-context>` via its `context` prop.

> [!NOTE]
> For the full component and composition API, see the [Vue API Reference](/docs/api/@ripl/vue/).

## Installation

```bash
npm install @ripl/vue
```

`vue` (3.5 or later) is a peer dependency you already have. Ripl's own packages arrive as dependencies of this one.

## Quick Start

Register every component globally with the plugin:

```ts
import {
    createRipl,
} from '@ripl/vue';

import {
    createApp,
} from 'vue';

import App from './app.vue';

createApp(App).use(createRipl()).mount('#app');
```

Or import the components you use directly, in which case the plugin is unnecessary.

Then describe a scene. `<ripl-context>` renders a plain element that the canvas fills, so give it a size:

```vue
<template>
    <ripl-context style="width: 400px; height: 300px">
        <ripl-scene>
            <ripl-renderer>
                <ripl-transition :update="{ duration: 400, ease: easeOutCubic }">
                    <ripl-circle
                        :cx="200"
                        :cy="150"
                        :radius="grown ? 90 : 50"
                        :fill="grown ? '#ff006e' : '#3a86ff'"
                        @click="grown = !grown"
                    />
                </ripl-transition>
            </ripl-renderer>
        </ripl-scene>
    </ripl-context>
</template>

<script lang="ts" setup>
import {
    ref,
} from 'vue';

import {
    easeOutCubic,
} from '@ripl/web';

const grown = ref(false);
</script>
```

Click the circle:

<example-vue-quick-start />

That is the whole thing: props drive the element's state, `@click` is an ordinary Vue listener, and wrapping the element in a `<ripl-transition>` animates every prop change through it.

Both casings work: `<ripl-circle>` and `<RiplCircle>` resolve to the same component, exported as `RiplCircle`.

## The three tiers

Ripl separates the drawing surface, the scene graph and the animation loop, and the adapter keeps that separation. Each level adds capability, and every element picks up the highest one declared above it.

| Template | What it adds |
| --- | --- |
| `<ripl-context>` | Elements paint directly to the surface. Pointer events and hit testing work. |
| `+ <ripl-scene>` | A hoisted, flat instruction stream: z-ordering, group clipping, efficient large graphs. |
| `+ <ripl-renderer>` | A `requestAnimationFrame` loop, and `<ripl-transition>`. |

A context on its own is enough for static or lightly-updated graphics:

```vue
<template>
    <ripl-context style="width: 200px; height: 200px">
        <ripl-group fill="#e5484d">
            <ripl-circle :cx="60" :cy="60" :radius="40" />
            <ripl-rect :x="100" :y="100" :width="60" :height="60" stroke="#1e6978" />
        </ripl-group>
    </ripl-context>
</template>
```

Add a scene once you need z-ordering or many elements, and a renderer once you need animation. See [Rendering](/docs/vue/essentials/rendering) for what each one changes.

## Where to go next

- [Rendering](/docs/vue/essentials/rendering) — the context, scene and renderer components.
- [Elements](/docs/vue/essentials/elements) — groups, the built-in elements, and how props map to state.
- [Transitions](/docs/vue/essentials/transitions) — animating enter, update and leave.
- [Events](/docs/vue/essentials/events) — pointer and drag listeners.
- [Compositions](/docs/vue/essentials/compositions) — reaching the underlying Ripl objects.
- [Bar chart](/docs/vue/examples/bar-chart) — a live, interactive chart built from the elements above.

Two companion packages extend the same surface:

- [3D](/docs/vue/3d/) — `@ripl/vue-3d` adds a 3D context, nine shapes, a camera and lights. The scene, renderer and transition components above drive it unchanged.
- [Charts](/docs/vue/charts/) — `@ripl/vue-charts` turns all 25 of Ripl's chart types into components whose props are the chart's options.
