# Getting Started

## Basic Example

Here's a minimal example that renders a blue rectangle on a canvas:

```vue
<script setup>
import {
  RiplContext,
  RiplScene,
  RiplRenderer,
  RiplRect,
} from '@ripl/vue';
</script>

<template>
  <ripl-context :width="400" :height="300">
    <ripl-scene>
      <ripl-renderer>
        <ripl-rect
          :x="50"
          :y="50"
          :width="200"
          :height="100"
          fill-style="#3b82f6"
        />
      </ripl-renderer>
    </ripl-scene>
  </ripl-context>
</template>
```

## Component Hierarchy

Every Ripl Vue scene requires this nesting order:

1. **`<ripl-context>`** — creates the rendering context (canvas element)
2. **`<ripl-scene>`** — creates the scene graph
3. **`<ripl-renderer>`** — drives the `requestAnimationFrame` loop

Shape and group components go inside the renderer:

```vue
<template>
  <ripl-context :width="600" :height="400">
    <ripl-scene>
      <ripl-renderer>
        <ripl-group>
          <ripl-circle :cx="100" :cy="100" :radius="40" fill-style="#ef4444" />
          <ripl-circle :cx="200" :cy="100" :radius="40" fill-style="#22c55e" />
        </ripl-group>
        <ripl-rect :x="50" :y="200" :width="300" :height="50" fill-style="#8b5cf6" />
      </ripl-renderer>
    </ripl-scene>
  </ripl-context>
</template>
```

## Reactive Props

All shape props are reactive. When a bound value changes, the element updates automatically:

```vue
<script setup>
import { ref } from 'vue';
import { RiplContext, RiplScene, RiplRenderer, RiplCircle } from '@ripl/vue';

const radius = ref(30);

function grow() {
  radius.value += 10;
}
</script>

<template>
  <button @click="grow">Grow</button>
  <ripl-context :width="400" :height="300">
    <ripl-scene>
      <ripl-renderer>
        <ripl-circle :cx="200" :cy="150" :radius="radius" fill-style="#f59e0b" />
      </ripl-renderer>
    </ripl-scene>
  </ripl-context>
</template>
```

## Events

Listen to element events using Vue's `@event` syntax:

```vue
<ripl-circle
  :cx="100"
  :cy="100"
  :radius="40"
  fill-style="#3b82f6"
  @click="handleClick"
  @mouseenter="handleHover"
/>
```

Supported events: `click`, `mouseenter`, `mouseleave`, `mousemove`.

## SVG Context

To render to SVG instead of canvas, use `<ripl-svg-context>`:

```vue
<template>
  <ripl-svg-context :width="400" :height="300">
    <ripl-scene>
      <ripl-renderer>
        <ripl-rect :x="10" :y="10" :width="100" :height="80" fill-style="#3b82f6" />
      </ripl-renderer>
    </ripl-scene>
  </ripl-svg-context>
</template>
```

::: warning
`@ripl/svg` must be installed as a peer dependency for SVG context to work.
:::
