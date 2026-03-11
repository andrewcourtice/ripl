---
outline: "deep"
---

# Renderer

A **Renderer** provides an automatic render loop for a [Scene](/docs/core/essentials/scene), powered by `requestAnimationFrame`. It continuously re-renders the scene each frame, enabling smooth animations and interactive effects. The renderer also provides a `transition()` method for animating element properties.

The Renderer is what brings your scene to life. Without it, you'd need to manually call `scene.render()` every time something changes. With a Renderer, you describe *what* should change (via transitions) and the renderer handles *when* and *how* — including easing, chaining, staggering, and automatic start/stop to conserve resources when idle.

## Creating a Renderer

```ts
import {
    createRenderer,
    createScene,
} from '@ripl/core';

const scene = createScene('.my-container', {
    children: [circle, rect],
});

const renderer = createRenderer(scene);
```

## Options

The renderer accepts `autoStart` (default `true`) and `autoStop` (default `true`). With `autoStop`, the renderer pauses when idle and restarts when needed:

```ts
const renderer = createRenderer(scene, {
    autoStart: false,
    autoStop: false,
});
```

## Debug Mode

The renderer includes built-in debug overlays to help you inspect and profile your scene. Pass the `debug` option to `createRenderer` to enable them.

Setting `debug: true` enables all overlays at once:

```ts
const renderer = createRenderer(scene, {
    debug: true,
});
```

For granular control, pass an object with the specific overlays you want:

```ts
const renderer = createRenderer(scene, {
    debug: {
        fps: true, // frames-per-second counter
        elementCount: true, // number of elements in the scene buffer
        boundingBoxes: true, // red outline around every element's bounding box
    },
});
```

| Option | Description |
|--------|-------------|
| `fps` | Displays a smoothed frames-per-second counter in an overlay badge |
| `elementCount` | Shows the total number of elements rendered each frame |
| `boundingBoxes` | Draws a red stroke rectangle around every element's bounding box |

When `fps` or `elementCount` is enabled, a semi-transparent overlay badge appears in the top-left corner of the scene. `boundingBoxes` renders directly onto the canvas after each element, making it easy to verify hit areas and layout.

### Demo

Toggle the debug overlays below to see them in action.

:::tabs
== Demo
<ripl-example @context-changed="debugContextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton :active="debugFps" @click="toggleDebug('fps')">FPS</RiplButton>
            <RiplButton :active="debugElementCount" @click="toggleDebug('elementCount')">Element Count</RiplButton>
            <RiplButton :active="debugBoundingBoxes" @click="toggleDebug('boundingBoxes')">Bounding Boxes</RiplButton>
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createCircle,
    createRect,
    createRenderer,
    createScene,
} from '@ripl/core';

const scene = createScene('.mount-element', {
    children: [
        createRect({
            x: 60,
            y: 80,
            width: 120,
            height: 80,
            fill: '#3a86ff',
            borderRadius: 6,
        }),
        createCircle({
            cx: 300,
            cy: 120,
            radius: 40,
            fill: '#ff006e',
        }),
        createCircle({
            cx: 200,
            cy: 200,
            radius: 25,
            fill: '#8338ec',
        }),
    ],
});

const renderer = createRenderer(scene, {
    debug: {
        fps: true,
        elementCount: true,
        boundingBoxes: true,
    },
});
```
:::

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
        fill: '#ff006e',
    },
});
```

### Easing Functions

Ripl provides a full set of easing functions:

```ts
import {
    easeInCubic,
    easeInOutCubic, easeInOutQuad, easeInOutQuart,
    easeInOutQuint, easeInQuad, easeInQuart,
    easeInQuint, easeLinear, easeOutCubic,
    easeOutQuad, easeOutQuart, easeOutQuint,
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
    state: { fill: '#ff006e' },
});
```

### Per-Element Options

Pass a function instead of an options object to customize the transition per element. This is useful for staggered animations:

```ts
await renderer.transition(group, (element, index, total) => ({
    duration: 500,
    delay: index * 100, // stagger by 100ms
    ease: easeOutCubic,
    state: { fill: '#ff006e' },
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

The renderer emits `start` and `stop` events to track the render loop lifecycle:

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

> [!NOTE]
> For the full list of Renderer properties, methods, and events, see the [Renderer API Reference](/docs/api/@ripl/core/).

## Demo

Click "Animate" to run a transition. Click "Stagger" to see per-element staggered animation.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="animateAll">Animate</RiplButton>
            <RiplButton @click="stagger">Stagger</RiplButton>
            <RiplButton @click="reset">Reset</RiplButton>
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createCircle,
    createRenderer,
    createScene,
    easeOutCubic,
} from '@ripl/core';

const scene = createScene('.mount-element', {
    children: [
        createCircle({
            id: 'c1',
            fill: '#3a86ff',
            cx: 100,
            cy: 150,
            radius: 40,
        }),
        createCircle({
            id: 'c2',
            fill: '#3a86ff',
            cx: 200,
            cy: 150,
            radius: 40,
        }),
        createCircle({
            id: 'c3',
            fill: '#3a86ff',
            cx: 300,
            cy: 150,
            radius: 40,
        }),
    ],
});

const renderer = createRenderer(scene);

await renderer.transition(scene, (el, i) => ({
    duration: 600,
    delay: i * 150,
    ease: easeOutCubic,
    state: {
        fill: '#ff006e',
    },
}));
```
:::

<script lang="ts" setup>
import {
    ref,
} from 'vue';

import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    Circle,
    Context,
    createCircle,
    createRect,
    createRenderer,
    createScene,
    easeInOutQuad,
    easeOutCubic,
    Renderer,
    Scene,
} from '@ripl/core';

import type {
    RendererDebugOptions,
} from '@ripl/core';

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
        createCircle({ id: 'c1', fill: '#3a86ff', cx: w * 0.25, cy: h / 2, radius: r }),
        createCircle({ id: 'c2', fill: '#3a86ff', cx: w * 0.5, cy: h / 2, radius: r }),
        createCircle({ id: 'c3', fill: '#3a86ff', cx: w * 0.75, cy: h / 2, radius: r }),
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
        state: { fill: '#ff006e' },
    });
}

function stagger() {
    if (!rRenderer) return;
    rRenderer.transition(circles, (el, index) => ({
        duration: 600,
        delay: index * 150,
        ease: easeOutCubic,
        state: { fill: '#8338ec' },
    }));
}

function reset() {
    if (!rRenderer) return;
    rRenderer.transition(circles, (el, index) => ({
        duration: 400,
        delay: index * 80,
        ease: easeInOutQuad,
        state: { fill: '#3a86ff' },
    }));
}

// --- Debug demo ---

const debugFps = ref(true);
const debugElementCount = ref(true);
const debugBoundingBoxes = ref(true);

let debugContext: Context;
let debugScene: Scene;
let debugRenderer: Renderer;

function buildDebugScene() {
    debugRenderer?.destroy();
    debugScene?.destroy();

    const w = debugContext.width;
    const h = debugContext.height;

    debugScene = createScene(debugContext, {
        children: [
            createRect({
                id: 'dr1',
                x: w * 0.08,
                y: h * 0.25,
                width: w * 0.25,
                height: h * 0.4,
                fill: '#3a86ff',
                borderRadius: 6,
            }),
            createCircle({
                id: 'dc1',
                cx: w * 0.55,
                cy: h * 0.4,
                radius: Math.min(w, h) * 0.15,
                fill: '#ff006e',
            }),
            createCircle({
                id: 'dc2',
                cx: w * 0.8,
                cy: h * 0.6,
                radius: Math.min(w, h) * 0.1,
                fill: '#8338ec',
            }),
        ],
    });

    debugRenderer = createRenderer(debugScene, {
        debug: {
            fps: debugFps.value,
            elementCount: debugElementCount.value,
            boundingBoxes: debugBoundingBoxes.value,
        },
    });

    debugScene.render();
}

const {
    contextChanged: debugContextChanged,
} = useRiplExample(context => {
    debugContext = context;
    buildDebugScene();
});

function toggleDebug(key: keyof RendererDebugOptions) {
    if (key === 'fps') debugFps.value = !debugFps.value;
    if (key === 'elementCount') debugElementCount.value = !debugElementCount.value;
    if (key === 'boundingBoxes') debugBoundingBoxes.value = !debugBoundingBoxes.value;

    if (debugContext) {
        buildDebugScene();
    }
}
</script>
