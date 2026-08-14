---
title: 3D
description: "@ripl/vue-3d wraps Ripl's 3D context, shapes, camera and lights as Vue components, reusing the core scene, renderer and transition unchanged."
---

# 3D

`@ripl/vue-3d` adds a `<ripl-context-3d>` and the 3D shapes to the declarative surface. Everything else you already know still applies: a 3D context is an ordinary Ripl context and a 3D shape is an ordinary element, so [`<ripl-scene>`](/docs/vue/essentials/rendering), [`<ripl-renderer>`](/docs/vue/essentials/rendering) and [`<ripl-transition>`](/docs/vue/essentials/transitions) drive a 3D scene with no changes at all.

```bash
npm install @ripl/vue-3d
```

`@ripl/vue` arrives as a dependency, so a single plugin registers both sets of components:

```ts
import {
    createRipl3D,
} from '@ripl/vue-3d';

createApp(App).use(createRipl3D()).mount('#app');
```

`createRipl3D()` installs the core components too, and applying `createRipl()` as well is harmless in either order.

## A scene

:::tabs
== Demo
<example-vue-3d />
== Code
```vue
<template>
    <ripl-context-3d :lights="lights">
        <ripl-scene>
            <ripl-renderer :auto-stop="false" @tick="onTick">
                <ripl-camera :position="[0, 2.4, 6]" :fov="45" :interactions="true" />

                <ripl-group-3d :rotation-y="spin">
                    <ripl-cube
                        v-for="block in blocks"
                        :key="block.key"
                        :size="block.size"
                        :x="block.x"
                        :z="block.z"
                        :fill="block.fill"
                    />
                </ripl-group-3d>
            </ripl-renderer>
        </ripl-scene>
    </ripl-context-3d>
</template>
```
:::

`auto-stop="false"` is the norm in 3D. Camera orbit and light changes ask the context to repaint rather than changing element state, so a renderer that idles when no transition is running would stop before they land.

## `<ripl-context-3d>`

Replaces `<ripl-context>`, and nothing else changes. It builds its context during `setup()` against a detached host, exactly as the 2D one does, so every descendant finds a live context in its own `setup()`.

| Prop | Description |
| --- | --- |
| `context` | An existing `Context3D` to draw into instead of creating one. |
| `fov`, `near`, `far` | The perspective frustum. Defaults: `60`, `0.1`, `1000`. |
| `lights` | The lights illuminating the scene, replacing the default rig. See [Lighting](/docs/vue/3d/lighting). |
| `lightDirection`, `lightMode`, `ambientIntensity` | Tune the default rig, when you have not replaced it. |
| `fog` | Atmospheric haze blending distant geometry towards a colour. |
| `interactive`, `dragThreshold`, `meta` | As on `<ripl-context>`. |

It emits `ready` with the context, plus `resize`, `render` and every pointer event. Hit testing is by ray rather than paint order, so `@mouseenter` on a torus correctly ignores the hole.

## Where to go next

- **[Shapes](/docs/vue/3d/shapes)**: the nine built-in shapes and `<ripl-group-3d>`
- **[Camera](/docs/vue/3d/camera)**: framing and pointer interactions
- **[Lighting](/docs/vue/3d/lighting)**: the five light types and the default rig
