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
import {
    createCircle,
    createContext,
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fill: '#3a86ff',
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
circle.fill = '#ff006e';

// Then re-render
context.clear();
circle.render(context);
```
== Demo
<ripl-example @context-changed="changeContextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Radius</span>
            <RiplInputRange v-model.number="changePropsRadius" :min="changePropsMin" :max="changePropsMax" step="1" style="flex: 1;"/>
        </RiplControlGroup>
    </template>
</ripl-example>
:::

## Creating Structure

### Using Groups

Groups let you organize elements into a hierarchy — just like the DOM. A group can hold any number of child elements and even other groups. Properties set on a group are **inherited** by its children, so you can set a shared `fill` once on the group instead of on every element.

:::tabs
== Code
```ts
import {
    createCircle,
    createContext,
    createGroup,
    createRect,
} from '@ripl/core';

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

// Both children inherit fill from the group
const group = createGroup({
    fill: '#3a86ff',
    children: [circle, rect],
});

group.render(context);
```
== Demo
<ripl-example @context-changed="groupContextChanged"></ripl-example>
:::

### Querying Elements

Groups and scenes support DOM-like querying methods — `getElementById`, `getElementsByType`, `query`, and `queryAll`. This makes it easy to find elements deep in the tree without keeping references to every element.

:::tabs
== Code
```ts
import {
    createCircle,
    createContext,
    createGroup,
    createRect,
} from '@ripl/core';

const context = createContext('.mount-element');

const group = createGroup({
    fill: '#3a86ff',
    children: [
        createCircle({ id: 'c1',
            class: 'shape',
            cx: 80,
            cy: 100,
            radius: 40 }),
        createCircle({ id: 'c2',
            class: 'shape',
            cx: 200,
            cy: 100,
            radius: 30 }),
        createRect({ id: 'r1',
            class: 'shape',
            x: 260,
            y: 70,
            width: 80,
            height: 60 }),
    ],
});

group.render(context);

// Find by ID
group.getElementById('c1');

// Find by type
group.getElementsByType('circle');

// CSS-like selectors
group.query('#c1');
group.queryAll('.shape');
```
== Demo
<ripl-example @context-changed="queryContextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="runQuery('circle')">circles</RiplButton>
            <RiplButton @click="runQuery('rect')">rects</RiplButton>
            <RiplButton @click="runQuery('#c1')">id: c1</RiplButton>
            <RiplButton @click="runQuery('.highlight')">class: highlight</RiplButton>
        </RiplControlGroup>
    </template>
</ripl-example>
:::

## Interaction

Ripl's context automatically handles pointer event delegation via hit testing. You can listen for events like `mouseenter`, `mouseleave`, `click`, `dragstart`, `drag`, and `dragend` directly on any element — no scene or renderer required.

:::tabs
== Code
```ts
import {
    createCircle,
    createContext,
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fill: '#3a86ff',
    cx: 200,
    cy: 150,
    radius: 60,
});

function render() {
    context.clear();
    context.markRenderStart();
    circle.render(context);
    context.markRenderEnd();
}

render();

circle.on('mouseenter', () => {
    circle.fill = '#ff006e';
    render();
});

circle.on('mouseleave', () => {
    circle.fill = '#3a86ff';
    render();
});

circle.on('click', () => {
    circle.radius = circle.radius === 60 ? 90 : 60;
    render();
});
```
== Demo
<ripl-example @context-changed="interactionContextChanged"></ripl-example>
:::

> [!TIP]
> Hover over and click the circle to see the events in action.

> [!TIP]
> After changing element properties, re-render to see the updates. The `markRenderStart()`/`markRenderEnd()` calls tell the context which elements are on screen for hit testing.

## Animation

Ripl provides a standalone `transition()` function for animating values over time. Combined with an element's `interpolate()` method, you can smoothly animate element properties without a renderer.

The `transition()` function calls your callback on each animation frame with an eased time value (0–1). The element's `interpolate()` method creates an interpolator that maps that time value to intermediate property states.

:::tabs
== Code
```ts
import {
    createCircle,
    createContext,
    easeOutCubic,
    transition,
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fill: '#3a86ff',
    cx: 200,
    cy: 150,
    radius: 60,
});

function render() {
    context.clear();
    context.markRenderStart();
    circle.render(context);
    context.markRenderEnd();
}

render();

const interpolator = circle.interpolate({
    radius: 100,
    fill: '#ff006e',
});

await transition(time => {
    interpolator(time);
    render();
}, {
    duration: 1000,
    ease: easeOutCubic,
});
```
== Demo
<ripl-example @context-changed="transitionContextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="runTransition">Animate</RiplButton>
            <RiplButton @click="resetTransition">Reset</RiplButton>
        </RiplControlGroup>
    </template>
</ripl-example>
:::

> [!NOTE]
> The `transition()` function returns a `Transition` (which extends `Task`) — it is both **awaitable** and **cancellable** via `transition.abort()`.

The standalone `transition()` gives you full control, but for most use-cases a **Scene** and **Renderer** provide a more convenient approach.

## Using Scenes

A **Scene** is a special group that binds to a context. It manages the full rendering lifecycle — clearing the context, rendering all children in z-index order, and automatically re-rendering when the context resizes.

:::tabs
== Code
```ts
import {
    createCircle,
    createRect,
    createScene,
} from '@ripl/core';

const scene = createScene('.mount-element', {
    children: [
        createCircle({
            fill: '#3a86ff',
            cx: 200,
            cy: 150,
            radius: 60,
        }),
        createRect({
            fill: '#ff006e',
            x: 280,
            y: 100,
            width: 120,
            height: 100,
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

## Using a Renderer

A **Renderer** provides an automatic render loop powered by `requestAnimationFrame`. It continuously re-renders the scene each frame, and its `transition()` method handles interpolation and re-rendering for you — no manual `scene.render()` calls needed.

:::tabs
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
            id: 'my-circle',
            fill: '#3a86ff',
            cx: 200,
            cy: 150,
            radius: 60,
        }),
    ],
});

const renderer = createRenderer(scene);

const circle = scene.query('#my-circle');

await renderer.transition(circle, {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        radius: 100,
        fill: '#ff006e',
    },
});
```
== Demo
<ripl-example @context-changed="rendererContextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="animateRenderer">Animate</RiplButton>
            <RiplButton @click="resetRenderer">Reset</RiplButton>
        </RiplControlGroup>
    </template>
</ripl-example>
:::

### Chaining Transitions

Because `renderer.transition()` returns a promise, you can chain animations sequentially. You can also animate multiple elements at once and use different easing functions.

:::tabs
== Code
```ts
async function animate() {
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
            radius: 60,
            fill: '#3a86ff',
        },
    });
}
```
== Demo
<ripl-example @context-changed="animationContextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="runAnimation">Run Sequence</RiplButton>
        </RiplControlGroup>
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
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    Circle,
    clamp,
    createCircle,
    createGroup,
    createRect,
    createRenderer,
    createScene,
    createText,
    easeInOutQuad,
    easeOutCubic,
    Group,
    Renderer,
    Scene,
    transition,
} from '@ripl/core';

import type {
    Context,
    Element,
} from '@ripl/core';

import {
    ref,
    watch,
} from 'vue';

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
        fill: '#3a86ff'
    });

    const label = createText({
        x: circle.cx,
        y: circle.cy,
        content: context.type,
        fill: '#FFFFFF',
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
        fill: '#3a86ff'
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
        fill: '#3a86ff',
        children: [circle, rect],
    });

    group.render(context);

    context.on('resize', () => {
        context.clear();
        group.render(context);
    });
});


// Query example

let queryGroup: Group;
let queryContext: Context | undefined;
const queryColors = { default: '#3a86ff', highlight: '#ff006e' };

const {
    contextChanged: queryContextChanged
} = useRiplExample(context => {
    queryContext = context;
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 7;

    queryGroup = createGroup({
        fill: queryColors.default,
        children: [
            createCircle({ id: 'c1', class: 'highlight', cx: w * 0.2, cy: h / 2, radius: r }),
            createCircle({ id: 'c2', class: 'shape', cx: w * 0.45, cy: h / 2, radius: r * 0.7 }),
            createRect({ id: 'r1', class: 'highlight', x: w * 0.6, y: h / 2 - r * 0.7, width: r * 1.4, height: r * 1.4 }),
            createRect({ id: 'r2', class: 'shape', x: w * 0.8, y: h / 2 - r * 0.5, width: r, height: r }),
        ],
    });

    queryGroup.render(context);
    context.on('resize', () => { context.clear(); queryGroup.render(context); });
});

function runQuery(selector: string) {
    if (!queryGroup || !queryContext) return;

    queryGroup.queryAll('*').forEach((el: Element) => { el.fill = queryColors.default; });

    const matches = queryGroup.queryAll(selector);
    matches.forEach((el: Element) => { el.fill = queryColors.highlight; });

    queryContext.clear();
    queryGroup.render(queryContext);
}


// Interaction example

const {
    contextChanged: interactionContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;

    const circle = createCircle({
        fill: '#3a86ff',
        cx: width / 2,
        cy: height / 2,
        radius: Math.min(width, height) / 5,
    });

    const render = () => {
        context.clear();
        context.markRenderStart();
        circle.render(context);
        context.markRenderEnd();
    };

    render();

    circle.on('mouseenter', () => {
        circle.fill = '#ff006e';
        render();
    });

    circle.on('mouseleave', () => {
        circle.fill = '#3a86ff';
        render();
    });

    const baseRadius = Math.min(width, height) / 5;
    const expandedRadius = Math.min(width, height) / 3;

    circle.on('click', () => {
        circle.radius = circle.radius === baseRadius ? expandedRadius : baseRadius;
        render();
    });
});


// Transition example

let transitionContext: Context | undefined;
let transitionCircle: Circle;

const {
    contextChanged: transitionContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;

    transitionContext = context;

    transitionCircle = createCircle({
        fill: '#3a86ff',
        cx: width / 2,
        cy: height / 2,
        radius: Math.min(width, height) / 5,
    });

    const render = () => {
        context.clear();
        context.markRenderStart();
        transitionCircle.render(context);
        context.markRenderEnd();
    };

    render();
});

function transitionRender() {
    if (!transitionContext || !transitionCircle) return;
    transitionContext.clear();
    transitionContext.markRenderStart();
    transitionCircle.render(transitionContext);
    transitionContext.markRenderEnd();
}

function runTransition() {
    if (!transitionContext || !transitionCircle) return;

    const shortSize = Math.min(transitionContext.width, transitionContext.height);

    const interpolator = transitionCircle.interpolate({
        radius: shortSize / 3,
        fill: '#ff006e',
    });

    transition(time => {
        interpolator(time);
        transitionRender();
    }, {
        duration: 1000,
        ease: easeOutCubic,
    });
}

function resetTransition() {
    if (!transitionContext || !transitionCircle) return;

    const shortSize = Math.min(transitionContext.width, transitionContext.height);

    const interpolator = transitionCircle.interpolate({
        radius: shortSize / 5,
        fill: '#3a86ff',
    });

    transition(time => {
        interpolator(time);
        transitionRender();
    }, {
        duration: 600,
        ease: easeOutCubic,
    });
}


// Scene example

const {
    contextChanged: sceneContextChanged
} = useRiplExample(context => {
    const width = context.width;
    const height = context.height;

    const scene = createScene(context, {
        children: [
            createCircle({
                fill: '#3a86ff',
                cx: width / 3,
                cy: height / 2,
                radius: Math.min(width, height) / 5,
            }),
            createRect({
                fill: '#ff006e',
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
        fill: '#3a86ff',
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
            fill: '#ff006e',
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
            fill: '#3a86ff',
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
        fill: '#3a86ff',
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
            fill: '#ff006e',
        },
    });

    await animRenderer.transition(animCircle, {
        duration: 800,
        ease: easeInOutQuad,
        state: {
            radius: shortSize / 5,
            fill: '#3a86ff',
        },
    });

    await animRenderer.transition(animCircle, {
        duration: 600,
        ease: easeOutCubic,
        state: {
            cx: animScene.width / 4,
            fill: '#8338ec',
        },
    });

    await animRenderer.transition(animCircle, {
        duration: 600,
        ease: easeOutCubic,
        state: {
            cx: animScene.width / 2,
            fill: '#3a86ff',
        },
    });
}
</script>