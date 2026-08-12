---
title: Compositions
description: "useRiplContext, useRiplScene, useRiplRenderer and useRiplElement — reaching the underlying Ripl objects when the declarative surface is not enough."
---

# Compositions

Four compositions expose the objects the components build. Use them for the things a template cannot express: exporting an image, querying the graph, driving an ad-hoc transition.

```ts
import {
    useRiplContext,
    useRiplElement,
    useRiplRenderer,
    useRiplScene,
} from '@ripl/vue';

const context = useRiplContext();
const scene = useRiplScene();
const renderer = useRiplRenderer();
const element = useRiplElement();
```

Each returns a `ShallowRef`. Because the components construct during `setup()` rather than on mount, these already hold their value in a descendant's own `setup()` — you do not need to watch them:

```vue
<script setup lang="ts">
import {
    useRiplScene,
} from '@ripl/vue';

const scene = useRiplScene();

// Already resolved.
console.log(scene.value?.width, scene.value?.height);
</script>
```

They are `undefined` in two cases: outside the corresponding provider, and during server rendering. Both are ordinary, so guard with `?.` rather than asserting.

## `useRiplContext`

The rendering context — the drawing surface. Useful for exporting:

```vue
<script setup lang="ts">
import {
    useRiplContext,
} from '@ripl/vue';

const context = useRiplContext();

function download() {
    const url = context.value?.export().toURL();

    if (url) {
        window.open(url);
    }
}
</script>
```

## `useRiplScene`

The scene, when a `<ripl-scene>` encloses the caller. Gives you the graph query API:

```ts
const scene = useRiplScene();

const active = scene.value?.queryAll('.segment.active');
const byId = scene.value?.getElementById('total');
```

## `useRiplRenderer`

The renderer, when a `<ripl-renderer>` encloses the caller. Use it to drive a transition that no prop change describes:

```ts
const renderer = useRiplRenderer();
const element = useRiplElement();

function pulse() {
    if (!renderer.value || !element.value) {
        return;
    }

    return renderer.value.transition(element.value, {
        duration: 300,
        loop: 'alternate',
        state: {
            opacity: 0.4,
        },
    });
}
```

`renderer.transition` returns a cancelable promise, so it can be awaited or aborted.

## `useRiplElement`

The nearest enclosing element, group or scene. Called from a component nested inside a `<ripl-group>`, it returns that group — which lets you write a component that contributes to whatever group it is dropped into:

```vue
<script setup lang="ts">
import {
    useRiplElement,
} from '@ripl/vue';

import {
    isGroup,
} from '@ripl/web';

const parent = useRiplElement();

const bounds = computed(() => isGroup(parent.value)
    ? parent.value.getBoundingBox()
    : undefined);
</script>
```

## Holding Ripl objects

Ripl instances are deeply mutable and carry `Set`s, `Map`s and caches, so they should never go into `ref()` or `reactive()`. The compositions already return raw, `markRaw`'d instances inside a `shallowRef`. If you store one yourself, use `shallowRef` or a plain variable.
