---
title: Camera
---

# Camera

The camera manages the view matrix on the `Context3D` and supports orbit, pan, zoom, and lookAt operations. Property changes like `position`, `target`, and `fov` are batched via microtasks so multiple changes in the same synchronous block result in a single matrix update. Built-in mouse interactions (scroll to zoom, drag to orbit, Shift+drag to pan) can be enabled with a single flag or fine-tuned per interaction.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Demo

:::tabs
== Auto-Rotate
<ripl-3d-example @context-changed="autoRotateChanged"></ripl-3d-example>
== Interactive
<p style="margin-bottom: 8px; font-size: 0.9em; color: var(--vp-c-text-2);">Scroll to zoom, drag to orbit, Shift+drag to pan.</p>
<ripl-3d-example @context-changed="interactiveChanged"></ripl-3d-example>
== Code
```ts
import {
    createCamera,
    createContext,
    createCube,
} from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
    interactions: true,
});

const cube = createCube({ size: 1.5, fill: '#4488ff' });

function loop() {
    camera.flush();
    context.batch(() => {
        cube.render(context);
    });
    requestAnimationFrame(loop);
}
loop();
```
:::

## Creation

```ts
import {
    createCamera,
} from '@ripl/3d';

const camera = createCamera(scene, {
    position: [0, 2, 5],
    target: [0, 0, 0],
    fov: 60,
    near: 0.1,
    far: 1000,
    projection: 'perspective',
});
```

## Options

- **`position`** — `Vector3` — Camera position in world space (default `[0, 0, 5]`)
- **`target`** — `Vector3` — Point the camera looks at (default `[0, 0, 0]`)
- **`up`** — `Vector3` — Up direction (default `[0, 1, 0]`)
- **`fov`** — Field of view in degrees (default `60`)
- **`near`** — Near clipping plane (default `0.1`)
- **`far`** — Far clipping plane (default `1000`)
- **`projection`** — `'perspective'` or `'orthographic'` (default `'perspective'`)

## Methods

### orbit(deltaTheta, deltaPhi)

Orbits the camera around the target point.

```ts
camera.orbit(0.1, 0.05);
```

### pan(deltaX, deltaY)

Pans the camera (shifts both position and target).

```ts
camera.pan(1, 0);
```

### zoom(delta)

Moves the camera along the eye-to-target vector.

```ts
camera.zoom(2);
```

### lookAt(target)

Points the camera at a new target.

```ts
camera.lookAt([5, 5, 5]);
```

### flush()

Immediately applies pending changes (bypasses microtask batching).

```ts
camera.flush();
```

## Reactive Updates

Setting properties like `camera.position`, `camera.target`, or `camera.fov` schedules a microtask to update the context. Multiple changes in the same synchronous block are batched into a single update.

```ts
camera.position = [1, 2, 3];
camera.target = [0, 0, 0];
camera.fov = 90;
// All three changes are applied in a single microtask
```

## Interactions

The camera supports built-in mouse interactions for zoom, pivot (orbit), and pan. Enable them via the `interactions` option:

```ts
const camera = createCamera(scene, {
    interactions: true, // enable all interactions with default sensitivity
});
```

For granular control, pass an object:

```ts
const camera = createCamera(scene, {
    interactions: {
        zoom: {
            enabled: true,
            sensitivity: 5,
        },
        pivot: true,
        pan: true,
    },
});
```

### Interaction Options

Pass `interactions: true` to enable all interactions with default sensitivity, or pass an object to configure each individually. Each interaction (`zoom`, `pivot`, `pan`) accepts `boolean` or `{ enabled, sensitivity }`.

### Controls

- **Orbit / Pivot** — Left-click + drag
- **Pan** — Middle-click + drag, or Shift + left-click + drag
- **Zoom** — Scroll wheel

### dispose()

Removes all interaction event listeners.

```ts
camera.dispose();
```

<script lang="ts" setup>
import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createCamera,
    createCube,
} from '@ripl/3d';

const { contextChanged: autoRotateChanged, startRotation } = useRipl3DExample((scene, camera) => {
    scene.add(createCube({ size: 1.5, fill: '#4488ff' }));
    startRotation(camera);
});

const { contextChanged: interactiveChanged } = useRipl3DExample((scene) => {
    scene.add(createCube({ size: 1.5, fill: '#4488ff' }));
}, {
    interactions: true,
});
</script>
