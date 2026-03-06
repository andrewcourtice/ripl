# Transitions

The `<ripl-transition>` component enables animated prop changes for child shape elements. When props change on a shape inside a transition, the values are smoothly interpolated rather than applied instantly.

## Basic Usage

```vue
<script setup>
import { ref } from 'vue';
import {
  RiplContext,
  RiplScene,
  RiplRenderer,
  RiplTransition,
  RiplRect,
} from '@ripl/vue';

const width = ref(100);

function toggle() {
  width.value = width.value === 100 ? 300 : 100;
}
</script>

<template>
  <button @click="toggle">Toggle</button>
  <ripl-context :width="400" :height="200">
    <ripl-scene>
      <ripl-renderer>
        <ripl-transition :duration="500" ease="easeInOutCubic">
          <ripl-rect
            :x="50"
            :y="50"
            :width="width"
            :height="80"
            fill-style="#3b82f6"
          />
        </ripl-transition>
      </ripl-renderer>
    </ripl-scene>
  </ripl-context>
</template>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `duration` | `Number` | `300` | Transition duration in milliseconds |
| `ease` | `String` | `'easeLinear'` | Easing function name |
| `delay` | `Number` | `0` | Delay before transition starts (ms) |
| `loop` | `Boolean` | `false` | Whether the transition loops |
| `direction` | `String` | `'forward'` | Transition direction (`'forward'` or `'reverse'`) |

## Easing Functions

The `ease` prop accepts any of the built-in easing function names from `@ripl/core`:

- `easeLinear`
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`
- `easeInQuart`, `easeOutQuart`, `easeInOutQuart`
- `easeInQuint`, `easeOutQuint`, `easeInOutQuint`
- `easeInSine`, `easeOutSine`, `easeInOutSine`
- `easeInExpo`, `easeOutExpo`, `easeInOutExpo`
- `easeInCirc`, `easeOutCirc`, `easeInOutCirc`
- `easeInBack`, `easeOutBack`, `easeInOutBack`

## How It Works

The transition component uses two strategies depending on what's available:

1. **Renderer-driven** (preferred) — when a `<ripl-renderer>` is present, transitions use `renderer.transition()` which is managed within the renderer's animation loop for optimal performance.

2. **Standalone fallback** — when no renderer is available, transitions use the standalone `transition()` function from `@ripl/core` which creates its own `requestAnimationFrame` loop and manually calls `scene.render()`.

This fallback mechanism ensures transitions work in any configuration, while preferring the more efficient renderer-driven approach when possible.

## Nested Transitions

Transition components can be nested. The innermost `<ripl-transition>` takes precedence for its children:

```vue
<ripl-transition :duration="1000" ease="easeInOutCubic">
  <ripl-rect ... />

  <ripl-transition :duration="200" ease="easeOutQuad">
    <ripl-circle ... />  <!-- Uses 200ms, easeOutQuad -->
  </ripl-transition>
</ripl-transition>
```
