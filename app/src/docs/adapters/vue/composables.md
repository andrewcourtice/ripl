# Composables

`@ripl/vue` provides composables to access Ripl instances from within the component tree via Vue's provide/inject system.

## `useContext()`

Returns the current Ripl `Context` instance.

```vue
<script setup>
import { useContext } from '@ripl/vue';

const context = useContext();
// context.value is the Context instance
</script>
```

## `useScene()`

Returns the current Ripl `Scene` instance.

```vue
<script setup>
import { useScene } from '@ripl/vue';

const scene = useScene();
// scene.value is the Scene instance
</script>
```

## `useRenderer()`

Returns the current Ripl `Renderer` instance.

```vue
<script setup>
import { useRenderer } from '@ripl/vue';

const renderer = useRenderer();
// renderer.value is the Renderer instance
</script>
```

## `useParent()`

Returns the nearest parent `Group` or `Scene` instance. This is used internally by shape components to add themselves to the scene graph.

```vue
<script setup>
import { useParent } from '@ripl/vue';

const parent = useParent();
// parent.value is a Group or Scene instance
</script>
```

## Usage in Custom Components

These composables are useful for building custom Ripl Vue components that need direct access to the underlying Ripl instances:

```vue
<script setup>
import { onMounted } from 'vue';
import { useParent, useRenderer } from '@ripl/vue';
import { createCircle } from '@ripl/core';

const parent = useParent();
const renderer = useRenderer();

onMounted(() => {
  const circle = createCircle({
    cx: 100,
    cy: 100,
    radius: 50,
    fillStyle: '#3b82f6',
  });

  parent.value?.add(circle);

  // Use the renderer for transitions
  renderer.value?.transition(circle, {
    duration: 1000,
    state: { radius: 80 },
  });
});
</script>

<template>
  <slot />
</template>
```
