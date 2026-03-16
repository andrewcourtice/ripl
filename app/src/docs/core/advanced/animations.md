---
outline: "deep"
---

# Animations

Ripl provides two approaches to animation: **manual transitions** using the standalone `transition` function, and **renderer-based transitions** using `renderer.transition()`. Both are promise-based and support easing, keyframes, and custom interpolators.

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="runSequence">Sequence</RiplButton>
            <RiplButton @click="runKeyframes">Keyframes</RiplButton>
            <RiplButton @click="runCustom">Custom</RiplButton>
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
    easeInOutQuad,
    easeOutCubic,
} from '@ripl/web';

const scene = createScene('.container', {
    children: [
        createCircle({
            fill: '#3a86ff',
            cx: 200,
            cy: 150,
            radius: 50,
        }),
    ],
});

const renderer = createRenderer(scene);
const circle = scene.query('circle');

// Sequential animation
await renderer.transition(circle, {
    duration: 800,
    ease: easeOutCubic,
    state: {
        radius: 100,
        fill: '#ff006e',
    },
});

await renderer.transition(circle, {
    duration: 800,
    ease: easeInOutQuad,
    state: {
        radius: 50,
        fill: '#3a86ff',
    },
});
```
:::

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/@ripl/core/).

## Manual Transitions

The `transition` function runs a timed animation loop using `requestAnimationFrame`. It's useful when you don't have a scene/renderer setup — for example, animating a single element rendered directly to a context.

```ts
import {
    easeOutCubic,
    transition,
} from '@ripl/web';

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

The transition accepts `duration` (milliseconds), `ease` (easing function, defaults to `easeLinear`), and `loop` (repeat indefinitely).

### Aborting a Transition

The `transition` function returns a `Transition` object (which extends `Task`). You can abort it:

```ts
const t = transition({ duration: 2000 }, (t) => {
    circle.radius = 50 + t * 50;
});

// Abort after 500ms
setTimeout(() => t.abort(), 500);
```

### Playback Control

A `Transition` can be paused, resumed, and seeked to any position. These methods are chainable and do not resolve the underlying promise until the transition completes normally.

```ts
const t = transition((time) => {
    circle.radius = 50 + time * 50;
    context.clear();
    circle.render(context);
}, { duration: 2000 });

// Pause after 500ms
setTimeout(() => t.pause(), 500);

// Resume 1 second later
setTimeout(() => t.play(), 1500);

// Jump to 75% and pause
t.seek(0.75);

// Check state
console.log(t.paused); // true
```

- **`pause()`** — stops the animation frame loop but keeps the promise pending
- **`play()`** — resumes from the paused position
- **`seek(position)`** — jumps to a normalised position (0–1), invokes the callback once with the eased time at that position, and pauses

### Reversing a Transition

Every `Transition` exposes an `inverse` property — a factory function that creates a new `Transition` running in the opposite direction. Both the standalone `transition()` function and `renderer.transition()` set this automatically:

```ts
const grow = transition((t) => {
    circle.radius = 50 + t * 50;
}, { duration: 800,
    ease: easeOutCubic });

await grow;

// Shrink back
await grow.inverse();
```

For renderer transitions, `inverse` re-schedules the same element transition with the flipped direction:

```ts
const t = await renderer.transition(circle, {
    duration: 800,
    ease: easeOutCubic,
    state: { radius: 100 },
});

// Reverse back to original state
await t.inverse();
```

## Renderer Transitions

When working with a scene and renderer, use `renderer.transition()` for a higher-level API that handles interpolation, re-rendering, and multi-element animations automatically.

```ts
import {
    createRenderer,
    createScene,
    easeOutCubic,
} from '@ripl/web';

const scene = createScene('.container', { children: [circle] });
const renderer = createRenderer(scene);

await renderer.transition(circle, {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        radius: 100,
        fill: '#ff006e',
    },
});
```

The renderer automatically:
- Interpolates each property using the appropriate [interpolator](/docs/core/advanced/interpolators)
- Re-renders the scene each frame
- Starts/stops the render loop as needed (with `autoStart`/`autoStop`)

## Looping

Both `transition()` and `renderer.transition()` support looping via the `loop` option. A looping transition repeats indefinitely and **never resolves** — you must call `abort()` to stop it.

### Restart Loop

Set `loop: true` to restart the animation from the beginning each iteration:

```ts
const t = renderer.transition(circle, {
    duration: 1000,
    ease: easeInOutQuad,
    loop: true,
    state: { radius: 100 },
});

// Stop after 5 seconds
setTimeout(() => t.abort(), 5000);
```

### Alternate (Ping-Pong) Loop

Set `loop: 'alternate'` to reverse direction each iteration, creating a ping-pong effect:

```ts
const t = renderer.transition(circle, {
    duration: 1000,
    ease: easeInOutQuad,
    loop: 'alternate',
    state: { cx: 300 },
});

// Stop after 5 seconds
setTimeout(() => t.abort(), 5000);
```

Looping also works with the standalone `transition` function:

```ts
const t = transition((time) => {
    circle.radius = 50 + time * 50;
    context.clear();
    circle.render(context);
}, {
    duration: 1000,
    loop: 'alternate',
});
```

> [!TIP]
> Looping transitions support `pause()`, `play()`, and `seek()` — playback control operates within the current loop iteration.

## Easing Functions

Easing functions control the rate of change over time. Ripl ships with 13 built-in easing functions covering `Quad`, `Cubic`, `Quart`, and `Quint` curves, each available in `In`, `Out`, and `InOut` variants, plus `easeLinear` for constant speed.

```ts
import {
    easeOutCubic,
} from '@ripl/web';

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
        duration: 500,
        ease: easeOutCubic,
        state: {
            radius: 100,
            fill: '#ff006e',
        },
    });

    await renderer.transition(circle, {
        duration: 500,
        ease: easeInOutQuad,
        state: {
            radius: 50,
            fill: '#3a86ff',
        },
    });
}
```

## Parallel Animations

Run multiple transitions simultaneously with `Promise.all`:

```ts
await Promise.all([
    renderer.transition(circle, {
        duration: 800,
        ease: easeOutCubic,
        state: { cx: 300 },
    }),
    renderer.transition(rect, {
        duration: 800,
        ease: easeOutCubic,
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
        fill: [
            '#3a86ff', // offset 0.33
            '#ff006e', // offset 0.66
            '#8338ec', // offset 1.0
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
        fill: [
            {
                value: '#ff006e',
                offset: 0.25,
            },
            {
                value: '#8338ec',
                offset: 0.5,
            },
            {
                value: '#3a86ff',
                offset: 1.0,
            },
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

### Playback Control Demo

Use the controls below to start a transition, then pause, seek, and reverse it interactively.

:::tabs
== Demo
<ripl-example @context-changed="playbackContextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="startPlayback">Start</RiplButton>
            <RiplButton @click="togglePause" :active="isPaused">{{ isPaused ? 'Play' : 'Pause' }}</RiplButton>
            <RiplButton @click="reversePlayback">Reverse</RiplButton>
        </RiplControlGroup>
        <RiplControlGroup>
            <RiplInputRange v-model="seekValue" :min="0" :max="1" :step="0.01" @update:model-value="onSeek" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createCircle,
    createScene,
    easeInOutCubic,
    transition,
} from '@ripl/web';

const scene = createScene('.container', {
    children: [
        createCircle({
            fill: '#3a86ff',
            cx: 100,
            cy: 150,
            radius: 40,
        }),
    ],
});

const circle = scene.query('circle');

const t = transition((time) => {
    circle.cx = 100 + time * 200;
    circle.radius = 40 + time * 30;
    scene.render();
}, { duration: 2000,
    ease: easeInOutCubic });

// Pause at any time
t.pause();

// Seek to 50%
t.seek(0.5);

// Resume
t.play();

// Create and run the reverse
await t.inverse();
```
:::

### Looping Demo

:::tabs
== Demo
<ripl-example @context-changed="loopContextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="runLoop">Loop</RiplButton>
            <RiplButton @click="runAlternate">Alternate</RiplButton>
            <RiplButton @click="stopLoop">Stop</RiplButton>
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createCircle,
    createRenderer,
    createScene,
    easeInOutQuad,
} from '@ripl/web';

const scene = createScene('.container', {
    children: [
        createCircle({
            fill: '#3a86ff',
            cx: 100,
            cy: 150,
            radius: 40,
        }),
    ],
});

const renderer = createRenderer(scene);
const circle = scene.query('circle');

// Restart loop — circle pulses in size
const t = renderer.transition(circle, {
    duration: 800,
    ease: easeInOutQuad,
    loop: true,
    state: { radius: 80 },
});

// Alternate loop — circle bounces left to right
const t2 = renderer.transition(circle, {
    duration: 1200,
    ease: easeInOutQuad,
    loop: 'alternate',
    state: { cx: 300 },
});

// Stop looping
t.abort();
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
    createCircle,
    createRenderer,
    createScene,
    easeInOutCubic,
    easeInOutQuad,
    easeOutCubic,
    Renderer,
    Scene,
    Transition,
    transition,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

let dScene: Scene;
let dRenderer: Renderer;
let dCircle: Circle;

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;

    dCircle = createCircle({
        fill: '#3a86ff',
        cx: w / 2,
        cy: h / 2,
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
        duration: 600,
        ease: easeOutCubic,
        state: {
            radius: s / 3,
            fill: '#ff006e',
        },
    });
    await dRenderer.transition(dCircle, {
        duration: 600,
        ease: easeInOutQuad,
        state: {
            radius: s / 5,
            fill: '#3a86ff',
        },
    });
}

async function runKeyframes() {
    if (!dRenderer || !dCircle) return;

    await dRenderer.transition(dCircle, {
        duration: 2000,
        ease: easeInOutQuad,
        state: {
            fill: [
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
        duration: 2000,
        ease: easeInOutQuad,
        state: {
            radius: (t: number) => baseRadius + Math.sin(t * Math.PI * 4) * baseRadius * 0.4,
        },
    });
}

async function reset() {
    if (!dRenderer || !dCircle || !dScene) return;

    await dRenderer.transition(dCircle, {
        duration: 400,
        ease: easeOutCubic,
        state: {
            radius: Math.min(dScene.width, dScene.height) / 5,
            fill: '#3a86ff',
            cx: dScene.width / 2,
        },
    });
}

// Playback control demo
let pbScene: Scene;
let pbCircle: Circle;
let pbContext: Context;
let activeTransition: Transition | undefined;

const isPaused = ref(false);
const seekValue = ref(0);

const {
    contextChanged: playbackContextChanged
} = useRiplExample(context => {
    pbContext = context;
    const w = context.width;
    const h = context.height;

    pbCircle = createCircle({
        fill: '#3a86ff',
        cx: w * 0.2,
        cy: h / 2,
        radius: Math.min(w, h) / 6,
    });

    pbScene = createScene(context, { children: [pbCircle] });
    pbScene.render();
});

function startPlayback() {
    if (!pbScene || !pbCircle || !pbContext) return;

    if (activeTransition && !activeTransition.hasAborted) {
        activeTransition.abort();
    }

    isPaused.value = false;
    seekValue.value = 0;

    const w = pbContext.width;
    const h = pbContext.height;
    const startX = w * 0.2;
    const endX = w * 0.8;
    const baseRadius = Math.min(w, h) / 6;

    activeTransition = transition((time) => {
        pbCircle.cx = startX + time * (endX - startX);
        pbCircle.radius = baseRadius + time * baseRadius * 0.5;
        pbCircle.fill = time < 0.5
            ? lerpColor('#3a86ff', '#ff006e', time * 2)
            : lerpColor('#ff006e', '#8338ec', (time - 0.5) * 2);
        pbScene.render();
    }, { duration: 3000, ease: easeInOutCubic });

    activeTransition.then(() => {
        isPaused.value = false;
        seekValue.value = 1;
    }).catch(() => {});
}

function togglePause() {
    if (!activeTransition) return;

    if (activeTransition.paused) {
        activeTransition.play();
        isPaused.value = false;
    } else {
        activeTransition.pause();
        isPaused.value = true;
    }
}

function onSeek(value: number) {
    if (!activeTransition) return;

    activeTransition.seek(value);
    isPaused.value = true;
}

function reversePlayback() {
    if (!activeTransition) return;

    if (!activeTransition.hasAborted) {
        activeTransition.abort();
    }

    isPaused.value = false;
    seekValue.value = 0;

    activeTransition = activeTransition.inverse();
    activeTransition.then(() => {
        isPaused.value = false;
        seekValue.value = 1;
    }).catch(() => {});
}

// Looping demo
let loopScene: Scene;
let loopRenderer: Renderer;
let loopCircle: Circle;
let loopTransition: Transition | undefined;

const {
    contextChanged: loopContextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;

    loopCircle = createCircle({
        fill: '#3a86ff',
        cx: w / 2,
        cy: h / 2,
        radius: Math.min(w, h) / 6,
    });

    loopScene = createScene(context, { children: [loopCircle] });
    loopRenderer = createRenderer(loopScene);
    loopScene.render();
});

function stopLoop() {
    if (loopTransition && !loopTransition.hasAborted) {
        loopTransition.abort();
        loopTransition = undefined;
    }
}

function runLoop() {
    if (!loopRenderer || !loopCircle || !loopScene) return;

    stopLoop();

    const s = Math.min(loopScene.width, loopScene.height);

    loopTransition = loopRenderer.transition(loopCircle, {
        duration: 800,
        ease: easeInOutQuad,
        loop: true,
        state: {
            radius: s / 3,
            fill: '#ff006e',
        },
    });

    loopTransition.catch(() => {});
}

function runAlternate() {
    if (!loopRenderer || !loopCircle || !loopScene) return;

    stopLoop();

    const w = loopScene.width;

    loopTransition = loopRenderer.transition(loopCircle, {
        duration: 1200,
        ease: easeInOutQuad,
        loop: 'alternate',
        state: {
            cx: w * 0.8,
            fill: '#8338ec',
        },
    });

    loopTransition.catch(() => {});
}

function lerpColor(from: string, to: string, t: number): string {
    const fr = parseInt(from.slice(1, 3), 16);
    const fg = parseInt(from.slice(3, 5), 16);
    const fb = parseInt(from.slice(5, 7), 16);

    const tr = parseInt(to.slice(1, 3), 16);
    const tg = parseInt(to.slice(3, 5), 16);
    const tb = parseInt(to.slice(5, 7), 16);

    const r = Math.round(fr + (tr - fr) * t);
    const g = Math.round(fg + (tg - fg) * t);
    const b = Math.round(fb + (tb - fb) * t);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
</script>
