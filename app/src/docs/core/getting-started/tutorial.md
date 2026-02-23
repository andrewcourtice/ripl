---
outline: "deep"
---

# Tutorial

This tutorial walks you through Ripl step-by-step, starting from the most basic use-case and progressively adding complexity. By the end, you'll understand how to draw elements, organize them into groups and scenes, and add interactivity and animation.

## The Basics

### Render a Basic Element

The most basic usage of Ripl involves 3 steps:

1. **Create a context** — the rendering target (Canvas by default)
2. **Create an element** — specify the element's properties
3. **Render** — draw the element to the context

:::tabs
== Code
```ts
import { createContext, createCircle } from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fillStyle: '#3a86ff',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: Math.min(context.width, context.height) / 3,
});

circle.render(context);
```
== Demo
<ripl-example @context-changed="basicContextChanged"></ripl-example>
:::

> [!TIP]
> Ripl renders to a Canvas context by default. To render to SVG instead, import `createContext` from `@ripl/svg` instead of `@ripl/core`. Try toggling between Canvas and SVG using the buttons above the demo!

### Change Element Properties

An element can be modified at any point by changing its properties and re-rendering. Use the slider below to change the circle's radius in real time.

:::tabs
== Code
```ts
// Change any property directly
circle.radius = 80;
circle.fillStyle = '#ff006e';

// Then re-render
context.clear();
circle.render(context);
```
== Demo
<ripl-example @context-changed="changeContextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <span>Radius</span>
            <input class="ripl-input-range" type="range" v-model.number="changePropsRadius" :min="changePropsMin" :max="changePropsMax" step="1" style="flex: 1;"/>
        </div>
    </template>
</ripl-example>
:::

## Creating Structure

### Using Groups

Groups let you organize elements into a hierarchy — just like the DOM. A group can hold any number of child elements and even other groups. Properties set on a group are **inherited** by its children, so you can set a shared `fillStyle` once on the group instead of on every element.

:::tabs
== Code
```ts
import { createContext, createCircle, createRect, createGroup } from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    cx: context.width / 3,
    cy: context.height / 2,
    radius: Math.min(context.width, context.height) / 5,
});

const rect = createRect({
    x: context.width / 2,
    y: context.height / 3,
    width: context.width / 4,
    height: context.height / 3,
});

// Both children inherit fillStyle from the group
const group = createGroup({
    fillStyle: '#3a86ff',
    children: [circle, rect],
});

group.render(context);
```
== Demo
<ripl-example @context-changed="groupContextChanged"></ripl-example>
:::

Groups also support querying elements using familiar DOM-like methods:

```ts
group.getElementById('my-circle');
group.getElementsByType('circle');
group.getElementsByClass('highlighted');
group.query('circle.highlighted');
group.queryAll('.shape');
```

### Using Scenes

A **Scene** is a special group that binds to a context. It manages the full rendering lifecycle — clearing the context, rendering all children in z-index order, and automatically re-rendering when the context resizes.

:::tabs
== Code
```ts
import { createContext, createCircle, createRect, createScene } from '@ripl/core';

const scene = createScene('.mount-element', {
    children: [
        createCircle({
            fillStyle: '#3a86ff',
            cx: 200, cy: 150,
            radius: 60,
        }),
        createRect({
            fillStyle: '#ff006e',
            x: 280, y: 100,
            width: 120, height: 100,
        }),
    ],
});

scene.render();
```
== Demo
<ripl-example @context-changed="sceneContextChanged"></ripl-example>
:::

> [!TIP]
> When you use a Scene, you don't need to manage `context.clear()` or `context.markRenderStart()`/`markRenderEnd()` yourself — the scene handles all of that.

## Interactivity and Animation

### Using Renderers

A **Renderer** provides an automatic render loop powered by `requestAnimationFrame`. It continuously re-renders the scene, which is essential for animations and interactive hover/click effects.

The renderer also provides a `transition()` method that smoothly animates element properties from their current values to new values.

:::tabs
== Code
```ts
import {
    createScene, createRenderer, createCircle, easeOutCubic
} from '@ripl/core';

const scene = createScene('.mount-element', {
    children: [
        createCircle({
            id: 'my-circle',
            fillStyle: '#3a86ff',
            cx: 200, cy: 150,
            radius: 60,
        }),
    ],
});

const renderer = createRenderer(scene);

// Animate the circle
const circle = scene.query('#my-circle');

await renderer.transition(circle, {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        radius: 100,
        fillStyle: '#ff006e',
    },
});
```
== Demo
<ripl-example @context-changed="rendererContextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="animateRenderer">Animate</button>
            <button class="ripl-button" @click="resetRenderer">Reset</button>
        </div>
    </template>
</ripl-example>
:::

### Adding Animation

Transitions are **awaitable**, so you can chain animations sequentially. You can also animate multiple elements at once and use different easing functions.

:::tabs
== Code
```ts
async function animate() {
    // Animate one element
    await renderer.transition(circle, {
        duration: 800,
        ease: easeOutCubic,
        state: { radius: 100, fillStyle: '#ff006e' },
    });

    // Then animate it back
    await renderer.transition(circle, {
        duration: 800,
        ease: easeInOutQuad,
        state: { radius: 60, fillStyle: '#3a86ff' },
    });
}
```
== Demo
<ripl-example @context-changed="animationContextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="runAnimation">Run Sequence</button>
        </div>
    </template>
</ripl-example>
:::

## Next Steps

Now that you understand the basics, explore the rest of the documentation:

- **[Essentials](/docs/core/essentials/context)** — Deep dive into each core concept
- **[Elements](/docs/core/elements/arc)** — Reference for all built-in elements
- **[Advanced](/docs/core/advanced/events)** — Events, animations, gradients, and custom elements

<script lang="ts" setup>
import {
    ref,
    watch
} from 'vue';

import {
    createCircle,
    createRect,
    createText,
    createGroup,
    createScene,
    createRenderer,
    Circle,
    Renderer,
    Scene,
    clamp,
    easeOutCubic,
    easeInOutQuad,
} from '@ripl/core';

import type {
    Context,
} from '@ripl/core';

import {
    useRiplExample
} from '../../../.vitepress/compositions/example';

// Basic example

const {
    contextChanged: basicContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;

    const circle = createCircle({
        cx: width / 2,
        cy: height / 2,
        radius: Math.min(width, height) / 3,
        fillStyle: '#3a86ff'
    });

    const label = createText({
        x: circle.cx,
        y: circle.cy,
        content: context.type,
        fillStyle: '#FFFFFF',
        textAlign: 'center',
        textBaseline: 'middle',
        font: '24px sans-serif'
    });

    const render = () => {
        context.markRenderStart();
        circle.render(context);
        label.render(context);
        context.markRenderEnd();
    }

    render();

    context.on('resize', () => {
        context.clear();
        render();
    })
});


// Change props example

const changePropsMin = ref(0);
const changePropsMax = ref(0);
const changePropsRadius = ref(0);

let changeCircle: Circle;

const {
    context: changeContext,
    contextChanged: changeContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;
    const shortSize = Math.min(width, height);

    changePropsMin.value = shortSize / 10;
    changePropsMax.value = shortSize;
    changePropsRadius.value = shortSize / 3;

    changeCircle = createCircle({
        cx: width / 2,
        cy: height / 2,
        radius: shortSize / 3,
        fillStyle: '#3a86ff'
    });

    changeCircle.render(context);

    context.on('resize', () => {
        context.clear();
        changeCircle.render(context);
    })
});

watch(changePropsRadius, (radius) => {
    if (!changeCircle || !changeContext.value) {
        return;
    }

    changeCircle.radius = clamp(radius, changePropsMin.value, changePropsMax.value);

    changeContext.value.clear();
    changeCircle.render(changeContext.value);
});


// Group example

const {
    contextChanged: groupContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;

    const circle = createCircle({
        cx: width / 3,
        cy: height / 2,
        radius: Math.min(width, height) / 5,
    });

    const rect = createRect({
        x: width / 2,
        y: height / 3,
        width: width / 4,
        height: height / 3,
    });

    const group = createGroup({
        fillStyle: '#3a86ff',
        children: [circle, rect],
    });

    group.render(context);

    context.on('resize', () => {
        context.clear();
        group.render(context);
    });
});


// Scene example

const {
    contextChanged: sceneContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;

    const scene = createScene(context, {
        children: [
            createCircle({
                fillStyle: '#3a86ff',
                cx: width / 3,
                cy: height / 2,
                radius: Math.min(width, height) / 5,
            }),
            createRect({
                fillStyle: '#ff006e',
                x: width / 2,
                y: height / 3,
                width: width / 4,
                height: height / 3,
            }),
        ],
    });

    scene.render();
});


// Renderer example

let rendererScene: Scene;
let rendererInstance: Renderer;
let rendererCircle: Circle;

const {
    contextChanged: rendererContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;

    rendererCircle = createCircle({
        id: 'renderer-circle',
        fillStyle: '#3a86ff',
        cx: width / 2,
        cy: height / 2,
        radius: Math.min(width, height) / 5,
    });

    rendererScene = createScene(context, {
        children: [rendererCircle],
    });

    rendererInstance = createRenderer(rendererScene);
    rendererScene.render();
});

function animateRenderer() {
    if (!rendererInstance || !rendererCircle || !rendererScene) return;

    rendererInstance.transition(rendererCircle, {
        duration: 1000,
        ease: easeOutCubic,
        state: {
            radius: Math.min(rendererScene.width, rendererScene.height) / 3,
            fillStyle: '#ff006e',
        },
    });
}

function resetRenderer() {
    if (!rendererInstance || !rendererCircle || !rendererScene) return;

    rendererInstance.transition(rendererCircle, {
        duration: 600,
        ease: easeOutCubic,
        state: {
            radius: Math.min(rendererScene.width, rendererScene.height) / 5,
            fillStyle: '#3a86ff',
        },
    });
}


// Animation sequence example

let animScene: Scene;
let animRenderer: Renderer;
let animCircle: Circle;

const {
    contextChanged: animationContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;

    animCircle = createCircle({
        fillStyle: '#3a86ff',
        cx: width / 2,
        cy: height / 2,
        radius: Math.min(width, height) / 5,
    });

    animScene = createScene(context, {
        children: [animCircle],
    });

    animRenderer = createRenderer(animScene);
    animScene.render();
});

async function runAnimation() {
    if (!animRenderer || !animCircle || !animScene) return;

    const shortSize = Math.min(animScene.width, animScene.height);

    await animRenderer.transition(animCircle, {
        duration: 800,
        ease: easeOutCubic,
        state: {
            radius: shortSize / 3,
            fillStyle: '#ff006e',
        },
    });

    await animRenderer.transition(animCircle, {
        duration: 800,
        ease: easeInOutQuad,
        state: {
            radius: shortSize / 5,
            fillStyle: '#3a86ff',
        },
    });

    await animRenderer.transition(animCircle, {
        duration: 600,
        ease: easeOutCubic,
        state: {
            cx: animScene.width / 4,
            fillStyle: '#8338ec',
        },
    });

    await animRenderer.transition(animCircle, {
        duration: 600,
        ease: easeOutCubic,
        state: {
            cx: animScene.width / 2,
            fillStyle: '#3a86ff',
        },
    });
}
</script>