---
title: Camera
---

# Camera

The camera is created alongside the scene and renderer. It manages the view matrix on the `Context3D` and supports orbit, pan, zoom, and lookAt operations. Property changes are batched via microtasks for efficient updates.

## Creation

```ts
import { createCamera } from '@ripl/3d';

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

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `Vector3` | `[0, 0, 5]` | Camera position in world space |
| `target` | `Vector3` | `[0, 0, 0]` | Point the camera looks at |
| `up` | `Vector3` | `[0, 1, 0]` | Up direction |
| `fov` | `number` | `60` | Field of view in degrees |
| `near` | `number` | `0.1` | Near clipping plane |
| `far` | `number` | `1000` | Far clipping plane |
| `projection` | `string` | `'perspective'` | `'perspective'` or `'orthographic'` |

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
        zoom: { enabled: true, sensitivity: 5 },
        pivot: true,
        pan: true,
    },
});
```

### Interaction Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `interactions` | `boolean \| CameraInteractions` | `undefined` | Enable/disable all interactions or configure individually |

Each interaction (`zoom`, `pivot`, `pan`) accepts `boolean` or `CameraInteractionConfig`:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `enabled` | `boolean` | `true` | Whether the interaction is active |
| `sensitivity` | `number` | `1` | Multiplier for the interaction speed |

### Controls

| Action | Input |
| --- | --- |
| Orbit / Pivot | Left-click + drag |
| Pan | Middle-click + drag, or Shift + left-click + drag |
| Zoom | Scroll wheel |

### dispose()

Removes all interaction event listeners.

```ts
camera.dispose();
```

## Demo

:::tabs
== Auto-Rotate
<ripl-3d-example @context-changed="autoRotateChanged"></ripl-3d-example>
== Interactive
<p style="margin-bottom: 8px; font-size: 0.9em; color: var(--vp-c-text-2);">Scroll to zoom, drag to orbit, Shift+drag to pan.</p>
<ripl-3d-example @context-changed="interactiveChanged"></ripl-3d-example>
== Code
```ts
import { createContext, createCube, createCamera } from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
    interactions: true,
});

const cube = createCube({ size: 1.5, fillStyle: '#4488ff' });

function loop() {
    camera.flush();
    context.clear();
    context.markRenderStart();
    cube.render(context);
    context.markRenderEnd();
    requestAnimationFrame(loop);
}
loop();
```
:::

<script lang="ts" setup>
import { createCube, createCamera } from '@ripl/3d';
import { useRipl3DExample } from '../../../.vitepress/compositions/example-3d';

const { contextChanged: autoRotateChanged, startRotation } = useRipl3DExample((ctx, camera) => {
    const cube = createCube({ size: 1.5, fillStyle: '#4488ff' });

    startRotation(camera, ctx, () => {
        cube.render(ctx);
    });
});

const { contextChanged: interactiveChanged, startInteractive } = useRipl3DExample((ctx, camera) => {
    const cube = createCube({ size: 1.5, fillStyle: '#4488ff' });

    startInteractive(camera, ctx, () => {
        cube.render(ctx);
    });
}, {
    interactions: true,
});
</script>
