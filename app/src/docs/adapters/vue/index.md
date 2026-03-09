# Vue Adapter

`@ripl/vue` provides a set of renderless Vue 3 components and composables that integrate Ripl's 2D graphics rendering directly into your Vue application's component tree.

## Demo

An interactive solar system built entirely with `@ripl/vue` components. Hover planets to highlight, click to select, and use the controls to animate transitions.

<ClientOnly>
    <VueAdapterDemo />
</ClientOnly>

<script setup>
import VueAdapterDemo from './demo.vue';
</script>

## Why?

While Ripl's imperative API is powerful and flexible, Vue developers often prefer a declarative, template-driven approach. `@ripl/vue` bridges this gap by:

- **Declarative rendering** — describe your scene graph using Vue templates
- **Reactive props** — Vue's reactivity system automatically syncs prop changes to Ripl elements
- **Transition support** — animate prop changes using Ripl's transition system via the `<ripl-transition>` component
- **Event forwarding** — listen to Ripl element events (`click`, `mouseenter`, etc.) using standard Vue `@event` syntax
- **Provide/inject** — context, scene, renderer, and parent group are automatically provided down the component tree

## Architecture

The adapter is built around renderless components that manage Ripl instances behind the scenes:

```xml
<ripl-context>              <!-- Creates a Canvas/SVG/3D context -->
  <ripl-scene>              <!-- Creates and manages the scene -->
    <ripl-renderer>         <!-- Drives the animation loop -->
      <ripl-group>          <!-- Groups elements together -->
        <ripl-transition>   <!-- Animates prop changes -->
          <ripl-rect />     <!-- Ripl shape elements -->
          <ripl-circle />
        </ripl-transition>
      </ripl-group>
    </ripl-renderer>
  </ripl-scene>
</ripl-context>
```

## Features

- **All 10 built-in shapes** — `<ripl-rect>`, `<ripl-circle>`, `<ripl-arc>`, `<ripl-ellipse>`, `<ripl-line>`, `<ripl-polygon>`, `<ripl-polyline>`, `<ripl-path>`, `<ripl-text>`, `<ripl-image>`
- **3 context types** — Canvas, SVG, and 3D (optional peer dependencies)
- **Plugin system** — register all components globally with `createRiplPlugin()`
- **Tree-shakable** — import only the components you need
