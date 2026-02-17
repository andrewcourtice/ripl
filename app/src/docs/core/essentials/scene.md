---
outline: "deep"
---

# Scene

A **Scene** is a specialized [Group](/docs/core/essentials/group) that binds to a [Context](/docs/core/essentials/context) and manages the full rendering lifecycle. It handles clearing, rendering in z-index order, automatic resize re-rendering, and DOM event delegation for pointer interactivity.

## Creating a Scene

A scene can be created from a CSS selector, an HTMLElement, or an existing Context:

```ts
import { createScene } from '@ripl/core';

// From a CSS selector (creates a canvas context automatically)
const scene = createScene('.my-container');

// From an existing context
const scene = createScene(context);

// With initial children
const scene = createScene('.my-container', {
    children: [circle, rect],
});
```

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `Element \| Element[]` | `[]` | Initial child elements |
| `renderOnResize` | `boolean` | `true` | Automatically re-render when the context resizes |
| All [Group options](/docs/core/essentials/group) | | | Inherited from Group |

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `context` | `Context` | The bound rendering context |
| `width` | `number` | Shortcut for `context.width` |
| `height` | `number` | Shortcut for `context.height` |
| `buffer` | `Element[]` | The flattened, z-sorted render buffer |

## Rendering

Call `render()` with no arguments — the scene uses its bound context:

```ts
scene.render();
```

This clears the context, marks the render start, renders all buffered elements in z-index order, and marks the render end. You don't need to manage any of this yourself.

### Render Buffer

When elements are added to or removed from the scene (or any nested group), the scene automatically rebuilds a **flat render buffer**. This buffer is a sorted array of all leaf elements in the scene graph, ordered by `zIndex`. This hoisting converts rendering from a recursive tree walk (O(n^c)) to a simple flat iteration (O(n)).

## Events

The scene extends the Group event system with DOM event delegation. It listens for mouse events on the context's DOM element and dispatches them to the appropriate Ripl elements based on hit testing.

### Supported Pointer Events

| Event | Description |
| --- | --- |
| `click` | Element was clicked |
| `mouseenter` | Pointer entered the element |
| `mouseleave` | Pointer left the element |
| `mousemove` | Pointer moved within the element |

```ts
const circle = createCircle({
    fillStyle: '#3a86ff',
    cx: 100, cy: 100, radius: 50,
});

const scene = createScene('.container', {
    children: [circle],
});

scene.render();

// Now pointer events work on the circle
circle.on('click', (event) => {
    console.log('Clicked!', event.data.x, event.data.y);
});

circle.on('mouseenter', () => {
    circle.fillStyle = '#ff006e';
    scene.render();
});

circle.on('mouseleave', () => {
    circle.fillStyle = '#3a86ff';
    scene.render();
});
```

### Scene-Level Events

The scene also emits its own events:

| Event | Description |
| --- | --- |
| `resize` | The context was resized |
| `mouseenter` | Pointer entered the scene area |
| `mouseleave` | Pointer left the scene area |
| `mousemove` | Pointer moved within the scene area |

> [!NOTE]
> Pointer events on individual elements only work when those elements are inside a Scene. The scene is responsible for DOM event delegation and hit testing.

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

## Demo

Hover over the elements to see pointer events in action. Click an element to change its color.

:::tabs
== Code
```ts
import { createScene, createCircle, createRect } from '@ripl/core';

const circle = createCircle({
    fillStyle: '#3a86ff',
    cx: 150, cy: 150, radius: 60,
});

const rect = createRect({
    fillStyle: '#ff006e',
    x: 250, y: 90, width: 120, height: 120,
});

const scene = createScene('.container', {
    children: [circle, rect],
});

scene.render();

circle.on('mouseenter', () => {
    circle.fillStyle = '#8338ec';
    scene.render();
});

circle.on('mouseleave', () => {
    circle.fillStyle = '#3a86ff';
    scene.render();
});
```
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
:::

<script lang="ts" setup>
import { createCircle, createRect, createScene } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 6;

    const circle = createCircle({
        fillStyle: '#3a86ff',
        cx: w * 0.35, cy: h / 2, radius: r,
    });

    const rect = createRect({
        fillStyle: '#ff006e',
        x: w * 0.55, y: h / 2 - r, width: r * 2, height: r * 2,
    });

    const scene = createScene(context, {
        children: [circle, rect],
    });

    scene.render();

    circle.on('mouseenter', () => { circle.fillStyle = '#8338ec'; scene.render(); });
    circle.on('mouseleave', () => { circle.fillStyle = '#3a86ff'; scene.render(); });
    circle.on('click', () => { circle.fillStyle = '#fb5607'; scene.render(); });

    rect.on('mouseenter', () => { rect.fillStyle = '#8338ec'; scene.render(); });
    rect.on('mouseleave', () => { rect.fillStyle = '#ff006e'; scene.render(); });
    rect.on('click', () => { rect.fillStyle = '#fb5607'; scene.render(); });
});
</script>
