# Installation

## Package

::: tabs

== npm
```bash
npm install @ripl/vue @ripl/core
```

== yarn
```bash
yarn add @ripl/vue @ripl/core
```

== pnpm
```bash
pnpm add @ripl/vue @ripl/core
```

:::

## Optional Peer Dependencies

For SVG rendering, also install `@ripl/svg`:

```bash
npm install @ripl/svg
```

For 3D rendering, also install `@ripl/3d`:

```bash
npm install @ripl/3d
```

## Plugin Registration

Register all components globally using the plugin:

```typescript
import { createApp } from 'vue';
import { createRiplPlugin } from '@ripl/vue';

import App from './App.vue';

const app = createApp(App);
app.use(createRiplPlugin());
app.mount('#app');
```

This registers all Ripl components globally with kebab-case names (e.g. `<ripl-context>`, `<ripl-rect>`).

## Tree-Shaking

If you prefer to import components individually for smaller bundles:

```vue
<script setup>
import { RiplContext, RiplScene, RiplRenderer, RiplRect } from '@ripl/vue';
</script>

<template>
  <ripl-context width="400" height="300">
    <ripl-scene>
      <ripl-renderer>
        <ripl-rect :x="10" :y="10" :width="100" :height="80" fill-style="#3b82f6" />
      </ripl-renderer>
    </ripl-scene>
  </ripl-context>
</template>
```
