---
outline: "deep"
---

# Context

A **Context** is the rendering abstraction at the heart of Ripl. It sits between your elements and the underlying rendering technology — whether that's an HTML Canvas or an SVG element. By programming against the Context API, your drawing code becomes completely backend-agnostic: switch from Canvas to SVG (or any future context) by changing a single import.

The context manages the drawing state stack, coordinate transforms, path creation, and fill/stroke operations. It automatically sizes itself to fit its parent container and emits events when it resizes, making responsive rendering straightforward.

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createCircle,
    createContext,
} from '@ripl/web';

const context = createContext('.mount-element');

const circle = createCircle({
    fill: '#3a86ff',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: Math.min(context.width, context.height) / 4,
});

circle.render(context);

// Re-render on resize
context.on('resize', () => {
    context.clear();
    circle.render(context);
});
```
:::

## Creating a Context

Use `createContext` to create a context attached to a DOM element. By default, Ripl creates a **Canvas** context:

```ts
import {
    createContext,
} from '@ripl/web';

// Pass a CSS selector or an HTMLElement
const context = createContext('.my-container');
```

To create an SVG context instead, import from `@ripl/svg`:

```ts
import {
    createContext,
} from '@ripl/svg';

const context = createContext('.my-container');
```

The context automatically fills its parent container and responds to resize events.

## Drawing State

The context maintains a drawing state stack, similar to the Canvas 2D API. You can save and restore state to isolate style changes:

```ts
context.save();
context.fill = '#ff0000';
// ... draw red elements ...
context.restore(); // fill reverts to previous value
```

### Using `layer()`

The `layer()` convenience method wraps a callback in `save()`/`restore()` automatically:

```ts
context.layer(() => {
    context.fill = '#ff0000';
    circle.render(context);
});
// fill is automatically restored here
```

## Render Batching

When rendering without a Scene or Renderer, you need to clear the surface and bracket your draw calls with `markRenderStart()`/`markRenderEnd()` so the context knows which elements are on screen (used for hit testing and SVG reconciliation). The `batch()` method handles all of this for you:

```ts
context.batch(() => {
    circle.render(context);
    rect.render(context);
});
```

This is equivalent to:

```ts
context.clear();
context.markRenderStart();
circle.render(context);
rect.render(context);
context.markRenderEnd();
```

> [!TIP]
> When using a Scene or Renderer, you don't need `batch()` — they manage the render lifecycle automatically.

## Interaction

The context owns all pointer interactivity. It listens for DOM mouse events on its element, performs hit testing against rendered elements, and delegates `click`, `mouseenter`, `mouseleave`, `mousemove`, `dragstart`, `drag`, and `dragend` events to the correct Ripl elements automatically.

Interaction is enabled by default. You can disable it via the `interactive` option:

```ts
const context = createContext('.container', {
    interactive: false,
});
```

The drag threshold (minimum pixel distance before a `dragstart` fires) is also configurable:

```ts
const context = createContext('.container', {
    dragThreshold: 5, // default is 3
});
```

> [!IMPORTANT]
> Elements must be rendered to the context (between `markRenderStart()` and `markRenderEnd()`, or via `batch()` / `scene.render()`) for the context to track them for hit testing.

## Resizing

The context emits a `resize` event whenever its container changes size. Use this to re-render your content responsively:

```ts
context.on('resize', () => {
    context.clear();
    circle.cx = context.width / 2;
    circle.cy = context.height / 2;
    circle.render(context);
});
```

## Cleanup

Call `destroy()` to remove the context's DOM element and clean up all event listeners. This is important when using Ripl inside framework components to prevent memory leaks:

```ts
// Vue 3
onUnmounted(() => context.destroy());

// React
useEffect(() => () => context.destroy(), []);
```

> [!NOTE]
> For the full list of properties, methods, and state options, see the [Context API Reference](/docs/api/@ripl/core/).

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createText,
} from '@ripl/web';

const {
    contextChanged
} = useRiplExample(context => {
    const circle = createCircle({
        fill: '#3a86ff',
        cx: context.width / 2,
        cy: context.height / 2,
        radius: Math.min(context.width, context.height) / 4,
    });

    const label = createText({
        x: context.width / 2,
        y: context.height / 2,
        content: `${context.type} context`,
        fill: '#FFFFFF',
        textAlign: 'center',
        textBaseline: 'middle',
        font: '18px sans-serif',
    });

    const render = () => {
        context.batch(() => {
            circle.render(context);
            label.render(context);
        });
    };

    render();
    context.on('resize', render);
});
</script>
