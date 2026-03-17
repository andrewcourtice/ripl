---
outline: "deep"
---

# Scene

A **Scene** is a specialized [Group](/docs/core/essentials/group) that binds to a [Context](/docs/core/essentials/context) and manages the full rendering lifecycle. It handles clearing, rendering in z-index order, and automatic resize re-rendering.

Think of a Scene as your drawing surface brought to life. Where a raw Context requires you to manually clear and render, a Scene automates all of that. It maintains a flat, z-sorted render buffer for high-performance rendering. Pointer interactivity (hit testing and event delegation) is handled by the [Context](/docs/core/essentials/context) itself — see [Context: Interaction](/docs/core/essentials/context#interaction).

## Demo

Hover over, click, or drag the elements to see pointer events in action.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createCircle,
    createRect,
    createScene,
} from '@ripl/web';

const circle = createCircle({
    fill: '#3a86ff',
    cx: 150,
    cy: 150,
    radius: 60,
});

const rect = createRect({
    fill: '#ff006e',
    x: 250,
    y: 90,
    width: 120,
    height: 120,
});

const scene = createScene('.container', {
    children: [circle, rect],
});

scene.render();

circle.on('mouseenter', () => {
    circle.fill = '#8338ec';
    scene.render();
});

circle.on('mouseleave', () => {
    circle.fill = '#3a86ff';
    scene.render();
});

// Drag elements to reposition them
circle.on('drag', (event) => {
    circle.cx += event.data.deltaX;
    circle.cy += event.data.deltaY;
    scene.render();
});
```
:::

## Creating a Scene

A scene can be created from a CSS selector, an HTMLElement, or an existing Context:

```ts
import {
    createScene,
} from '@ripl/web';

// From a CSS selector (creates a canvas context automatically)
const scene = createScene('.my-container');

// From an existing context
const scene = createScene(context);

// With initial children
const scene = createScene('.my-container', {
    children: [circle, rect],
});
```

## Rendering

Call `render()` with no arguments — the scene uses its bound context:

```ts
scene.render();
```

This clears the context, marks the render start, renders all buffered elements in z-index order, and marks the render end. You don't need to manage any of this yourself.

### Render Buffer

When elements are added to or removed from the scene (or any nested group), the scene automatically rebuilds a **flat render buffer**. This buffer is a sorted array of all leaf elements in the scene graph, ordered by `zIndex`. This hoisting converts rendering from a recursive tree walk (O(n^c)) to a simple flat iteration (O(n)).

## Events

The scene extends the Group event system. Pointer interactivity — DOM event listening, hit testing, and event delegation — is handled by the [Context](/docs/core/essentials/context#interaction). The scene's role is to render elements so the context knows which elements are on screen for hit testing.

### Pointer Events

Because the context handles interaction automatically, pointer events work on any element that has been rendered to the context:

```ts
const circle = createCircle({
    fill: '#3a86ff',
    cx: 100,
    cy: 100,
    radius: 50,
});

const scene = createScene('.container', {
    children: [circle],
});

scene.render();

// Pointer events work because the context tracks rendered elements
circle.on('click', (event) => {
    console.log('Clicked!', event.data.x, event.data.y);
});

circle.on('mouseenter', () => {
    circle.fill = '#ff006e';
    scene.render();
});

circle.on('mouseleave', () => {
    circle.fill = '#3a86ff';
    scene.render();
});
```

### Scene-Level Events

The scene emits a `resize` event when the context resizes. Context-level pointer events (`mouseenter`, `mouseleave`, `mousemove`, `dragstart`, `drag`, `dragend`) are emitted on the context itself.

> [!NOTE]
> Pointer events require elements to be rendered to the context so it can track them for hit testing. The scene handles this automatically when you call `scene.render()`.

## Automatic Resize

By default (`renderOnResize: true`), the scene automatically re-renders when the context resizes. Disable this if you want to handle resize manually:

```ts
const scene = createScene('.container', {
    renderOnResize: false,
});

scene.on('resize', () => {
    // Custom resize handling
    scene.render();
});
```

## Cleanup

Call `destroy()` to remove all DOM event listeners, destroy the context, and clean up:

```ts
scene.destroy();
```

> [!NOTE]
> For the full list of Scene properties and methods, see the [Scene API Reference](/docs/api/@ripl/core/).

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createRect,
    createScene,
} from '@ripl/web';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 6;

    const circle = createCircle({
        fill: '#3a86ff',
        cx: w * 0.35, cy: h / 2, radius: r,
    });

    const rect = createRect({
        fill: '#ff006e',
        x: w * 0.55, y: h / 2 - r, width: r * 2, height: r * 2,
    });

    const scene = createScene(context, {
        children: [circle, rect],
    });

    scene.render();

    circle.on('mouseenter', () => { circle.fill = '#8338ec'; scene.render(); });
    circle.on('mouseleave', () => { circle.fill = '#3a86ff'; scene.render(); });
    circle.on('click', () => { circle.fill = '#fb5607'; scene.render(); });
    circle.on('drag', (event) => { circle.cx += event.data.deltaX; circle.cy += event.data.deltaY; scene.render(); });

    rect.on('mouseenter', () => { rect.fill = '#8338ec'; scene.render(); });
    rect.on('mouseleave', () => { rect.fill = '#ff006e'; scene.render(); });
    rect.on('click', () => { rect.fill = '#fb5607'; scene.render(); });
    rect.on('drag', (event) => { rect.x += event.data.deltaX; rect.y += event.data.deltaY; scene.render(); });
});
</script>
