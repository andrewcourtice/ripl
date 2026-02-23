---
outline: "deep"
---

# Animations

Ripl provides two approaches to animation: **manual transitions** using the standalone `transition` function, and **renderer-based transitions** using `renderer.transition()`. Both are promise-based and support easing, keyframes, and custom interpolators.

## Manual Transitions

The `transition` function runs a timed animation loop using `requestAnimationFrame`. It's useful when you don't have a scene/renderer setup — for example, animating a single element rendered directly to a context.

```ts
import { transition, easeOutCubic } from '@ripl/core';

await transition({
    duration: 1000,
    ease: easeOutCubic,
}, (t) => {
    // t goes from 0 to 1 over the duration
    circle.radius = 50 + t * 50;
    context.clear();
    circle.render(context);
});
```

### Transition Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `duration` | `number` | `0` | Duration in milliseconds |
| `ease` | `Ease` | `easeLinear` | Easing function |
| `loop` | `boolean` | `false` | Loop the transition indefinitely |

### Cancelling a Transition

The `transition` function returns a `Transition` object (which extends `Task`). You can cancel it:

```ts
const t = transition({ duration: 2000 }, (t) => {
    circle.radius = 50 + t * 50;
});

// Cancel after 500ms
setTimeout(() => t.cancel(), 500);
```

## Renderer Transitions

When working with a scene and renderer, use `renderer.transition()` for a higher-level API that handles interpolation, re-rendering, and multi-element animations automatically.

```ts
import { createScene, createRenderer, easeOutCubic } from '@ripl/core';

const scene = createScene('.container', { children: [circle] });
const renderer = createRenderer(scene);

await renderer.transition(circle, {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        radius: 100,
        fillStyle: '#ff006e',
    },
});
```

The renderer automatically:
- Interpolates each property using the appropriate [interpolator](/docs/core/advanced/interpolators)
- Re-renders the scene each frame
- Starts/stops the render loop as needed (with `autoStart`/`autoStop`)

## Easing Functions

Easing functions control the rate of change over time. Ripl provides 13 built-in easing functions:

| Function | Description |
| --- | --- |
| `easeLinear` | Constant speed (no easing) |
| `easeInQuad` | Accelerate from zero |
| `easeOutQuad` | Decelerate to zero |
| `easeInOutQuad` | Accelerate then decelerate |
| `easeInCubic` | Stronger acceleration |
| `easeOutCubic` | Stronger deceleration |
| `easeInOutCubic` | Stronger ease in/out |
| `easeInQuart` | Even stronger acceleration |
| `easeOutQuart` | Even stronger deceleration |
| `easeInOutQuart` | Even stronger ease in/out |
| `easeInQuint` | Strongest acceleration |
| `easeOutQuint` | Strongest deceleration |
| `easeInOutQuint` | Strongest ease in/out |

```ts
import { easeOutCubic } from '@ripl/core';

await renderer.transition(circle, {
    duration: 800,
    ease: easeOutCubic,
    state: { radius: 100 },
});
```

### Custom Easing

An easing function takes a value from 0–1 and returns a transformed value:

```ts
// Bounce easing
const easeBounce = (t: number) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) return n1 * t * t;
    if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
    if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

await renderer.transition(circle, {
    duration: 1000,
    ease: easeBounce,
    state: { cy: 250 },
});
```

## Chaining Animations

Transitions are awaitable, so you can chain them sequentially:

```ts
async function animate() {
    await renderer.transition(circle, {
        duration: 500, ease: easeOutCubic,
        state: { radius: 100, fillStyle: '#ff006e' },
    });

    await renderer.transition(circle, {
        duration: 500, ease: easeInOutQuad,
        state: { radius: 50, fillStyle: '#3a86ff' },
    });
}
```

## Parallel Animations

Run multiple transitions simultaneously with `Promise.all`:

```ts
await Promise.all([
    renderer.transition(circle, {
        duration: 800, ease: easeOutCubic,
        state: { cx: 300 },
    }),
    renderer.transition(rect, {
        duration: 800, ease: easeOutCubic,
        state: { x: 100 },
    }),
]);
```

## Keyframe Animations

Transitions support CSS-like keyframe arrays for multi-step animations within a single transition.

### Implicit Offsets

Values are evenly distributed across the duration:

```ts
await renderer.transition(circle, {
    duration: 2000,
    state: {
        fillStyle: [
            '#3a86ff',  // offset 0.33
            '#ff006e',  // offset 0.66
            '#8338ec',  // offset 1.0
        ],
    },
});
```

### Explicit Offsets

Specify exact positions for each keyframe:

```ts
await renderer.transition(circle, {
    duration: 2000,
    state: {
        fillStyle: [
            { value: '#ff006e', offset: 0.25 },
            { value: '#8338ec', offset: 0.5 },
            { value: '#3a86ff', offset: 1.0 },
        ],
    },
});
```

## Custom Interpolator Functions

Pass a function instead of a target value for full control over the interpolation:

```ts
await renderer.transition(circle, {
    duration: 1000,
    state: {
        // t goes from 0 to 1 (after easing)
        radius: t => 50 + Math.sin(t * Math.PI * 4) * 20,
    },
});
```

## Demo

:::tabs
== Code
```ts
import {
    createScene, createRenderer, createCircle,
    easeOutCubic, easeInOutQuad
} from '@ripl/core';

const scene = createScene('.container', {
    children: [createCircle({
        fillStyle: '#3a86ff', cx: 200, cy: 150, radius: 50,
    })],
});

const renderer = createRenderer(scene);
const circle = scene.query('circle');

// Sequential animation
await renderer.transition(circle, {
    duration: 800, ease: easeOutCubic,
    state: { radius: 100, fillStyle: '#ff006e' },
});

await renderer.transition(circle, {
    duration: 800, ease: easeInOutQuad,
    state: { radius: 50, fillStyle: '#3a86ff' },
});
```
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="runSequence">Sequence</button>
            <button class="ripl-button" @click="runKeyframes">Keyframes</button>
            <button class="ripl-button" @click="runCustom">Custom</button>
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

let dScene: Scene;
let dRenderer: Renderer;
let dCircle: Circle;

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;

    dCircle = createCircle({
        fillStyle: '#3a86ff',
        cx: w / 2, cy: h / 2,
        radius: Math.min(w, h) / 5,
    });

    dScene = createScene(context, { children: [dCircle] });
    dRenderer = createRenderer(dScene);
    dScene.render();
});

async function runSequence() {
    if (!dRenderer || !dCircle || !dScene) return;
    const s = Math.min(dScene.width, dScene.height);

    await dRenderer.transition(dCircle, {
        duration: 600, ease: easeOutCubic,
        state: { radius: s / 3, fillStyle: '#ff006e' },
    });
    await dRenderer.transition(dCircle, {
        duration: 600, ease: easeInOutQuad,
        state: { radius: s / 5, fillStyle: '#3a86ff' },
    });
}

async function runKeyframes() {
    if (!dRenderer || !dCircle) return;

    await dRenderer.transition(dCircle, {
        duration: 2000, ease: easeInOutQuad,
        state: {
            fillStyle: [
                { value: '#3a86ff', offset: 0 },
                { value: '#ff006e', offset: 0.25 },
                { value: '#8338ec', offset: 0.5 },
                { value: '#fb5607', offset: 0.75 },
                { value: '#3a86ff', offset: 1 },
            ],
        },
    });
}

async function runCustom() {
    if (!dRenderer || !dCircle || !dScene) return;
    const baseRadius = Math.min(dScene.width, dScene.height) / 5;

    await dRenderer.transition(dCircle, {
        duration: 2000, ease: easeInOutQuad,
        state: {
            radius: (t: number) => baseRadius + Math.sin(t * Math.PI * 4) * baseRadius * 0.4,
        },
    });
}

async function reset() {
    if (!dRenderer || !dCircle || !dScene) return;

    await dRenderer.transition(dCircle, {
        duration: 400, ease: easeOutCubic,
        state: {
            radius: Math.min(dScene.width, dScene.height) / 5,
            fillStyle: '#3a86ff',
            cx: dScene.width / 2,
        },
    });
}
</script>
