---
outline: "deep"
---

# Renderer

A **Renderer** provides an automatic render loop for a [Scene](/docs/core/essentials/scene), powered by `requestAnimationFrame`. It continuously re-renders the scene each frame, enabling smooth animations and interactive effects. The renderer also provides a `transition()` method for animating element properties.

## Creating a Renderer

```ts
import { createScene, createRenderer } from '@ripl/core';

const scene = createScene('.my-container', {
    children: [circle, rect],
});

const renderer = createRenderer(scene);
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `autoStart` | `boolean` | `true` | Start the render loop immediately |
| `autoStop` | `boolean` | `true` | Stop the render loop when idle (no transitions, mouse leaves) |

```ts
const renderer = createRenderer(scene, {
    autoStart: false,
    autoStop: false,
});
```

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `isBusy` | `boolean` | Whether any transitions are currently running |
| `autoStart` | `boolean` | Whether the renderer auto-starts |
| `autoStop` | `boolean` | Whether the renderer auto-stops when idle |

## Render Loop

When running, the renderer executes a tick on every animation frame:

1. Clears the context
2. Advances all active transitions
3. Renders every element in the scene buffer
4. Requests the next frame

With `autoStop` enabled (default), the renderer automatically stops when there are no active transitions and the mouse leaves the scene. It restarts when the mouse re-enters or a new transition is created.

## Transitions

The `transition()` method smoothly animates element properties from their current values to new target values. It returns a `Promise`-like `Transition` that resolves when the animation completes.

### Basic Transition

```ts
await renderer.transition(circle, {
    duration: 1000,
    state: {
        radius: 100,
        fillStyle: '#ff006e',
    },
});
```

### Transition Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `duration` | `number` | `0` | Duration in milliseconds |
| `ease` | `Ease` | `easeLinear` | Easing function |
| `delay` | `number` | `0` | Delay before starting (ms) |
| `loop` | `boolean` | `false` | Loop the transition |
| `direction` | `'forward' \| 'reverse'` | `'forward'` | Playback direction |
| `state` | `object` | — | Target property values |
| `onComplete` | `(element) => void` | — | Callback when each element completes |

### Easing Functions

Ripl provides a full set of easing functions:

```ts
import {
    easeLinear,
    easeInQuad, easeOutQuad, easeInOutQuad,
    easeInCubic, easeOutCubic, easeInOutCubic,
    easeInQuart, easeOutQuart, easeInOutQuart,
    easeInQuint, easeOutQuint, easeInOutQuint,
} from '@ripl/core';

await renderer.transition(circle, {
    duration: 800,
    ease: easeOutCubic,
    state: { radius: 100 },
});
```

### Chaining Transitions

Because `transition()` returns a promise, you can chain animations sequentially:

```ts
await renderer.transition(circle, {
    duration: 500,
    ease: easeOutCubic,
    state: { radius: 100 },
});

await renderer.transition(circle, {
    duration: 500,
    ease: easeOutCubic,
    state: { radius: 50 },
});
```

### Animating Multiple Elements

Pass an array of elements or a group to animate them all with the same options:

```ts
await renderer.transition([circle, rect], {
    duration: 800,
    ease: easeOutCubic,
    state: { fillStyle: '#ff006e' },
});
```

### Per-Element Options

Pass a function instead of an options object to customize the transition per element. This is useful for staggered animations:

```ts
await renderer.transition(group, (element, index, total) => ({
    duration: 500,
    delay: index * 100,  // stagger by 100ms
    ease: easeOutCubic,
    state: { fillStyle: '#ff006e' },
}));
```

## Manual Control

### `start()`

Manually start the render loop:

```ts
renderer.start();
```

### `stop()`

Manually stop the render loop. Clears all active transitions:

```ts
renderer.stop();
```

## Events

| Event | Payload | Description |
| --- | --- | --- |
| `start` | `{ startTime }` | Render loop started |
| `stop` | `{ startTime, endTime }` | Render loop stopped |

```ts
renderer.on('start', (event) => {
    console.log('Renderer started at', event.data.startTime);
});
```

## Cleanup

The renderer automatically destroys itself when the scene is destroyed. You can also destroy it manually:

```ts
renderer.destroy(); // stops the loop and cleans up
```

## Demo

Click "Animate" to run a transition. Click "Stagger" to see per-element staggered animation.

:::tabs
== Code
```ts
import {
    createScene, createRenderer, createCircle, easeOutCubic
} from '@ripl/core';

const scene = createScene('.mount-element', {
    children: [
        createCircle({ id: 'c1', fillStyle: '#3a86ff', cx: 100, cy: 150, radius: 40 }),
        createCircle({ id: 'c2', fillStyle: '#3a86ff', cx: 200, cy: 150, radius: 40 }),
        createCircle({ id: 'c3', fillStyle: '#3a86ff', cx: 300, cy: 150, radius: 40 }),
    ],
});

const renderer = createRenderer(scene);

await renderer.transition(scene, (el, i) => ({
    duration: 600,
    delay: i * 150,
    ease: easeOutCubic,
    state: { fillStyle: '#ff006e' },
}));
```
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="animateAll">Animate</button>
            <button class="ripl-button" @click="stagger">Stagger</button>
            <button class="ripl-button" @click="reset">Reset</button>
        </div>
    </template>
</ripl-example>
:::

<script lang="ts" setup>
import {
    createCircle, createScene, createRenderer,
    Scene, Renderer, Circle,
    easeOutCubic, easeInOutQuad,
} from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

let rScene: Scene;
let rRenderer: Renderer;
let circles: Circle[] = [];

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 8;

    circles = [
        createCircle({ id: 'c1', fillStyle: '#3a86ff', cx: w * 0.25, cy: h / 2, radius: r }),
        createCircle({ id: 'c2', fillStyle: '#3a86ff', cx: w * 0.5, cy: h / 2, radius: r }),
        createCircle({ id: 'c3', fillStyle: '#3a86ff', cx: w * 0.75, cy: h / 2, radius: r }),
    ];

    rScene = createScene(context, { children: circles });
    rRenderer = createRenderer(rScene);
    rScene.render();
});

function animateAll() {
    if (!rRenderer) return;
    rRenderer.transition(circles, {
        duration: 800,
        ease: easeOutCubic,
        state: { fillStyle: '#ff006e' },
    });
}

function stagger() {
    if (!rRenderer) return;
    rRenderer.transition(circles, (el, index) => ({
        duration: 600,
        delay: index * 150,
        ease: easeOutCubic,
        state: { fillStyle: '#8338ec' },
    }));
}

function reset() {
    if (!rRenderer) return;
    rRenderer.transition(circles, (el, index) => ({
        duration: 400,
        delay: index * 80,
        ease: easeInOutQuad,
        state: { fillStyle: '#3a86ff' },
    }));
}
</script>
