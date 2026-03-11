---
outline: "deep"
---

# Context

A **Context** is the rendering abstraction at the heart of Ripl. It sits between your elements and the underlying rendering technology — whether that's an HTML Canvas or an SVG element. By programming against the Context API, your drawing code becomes completely backend-agnostic: switch from Canvas to SVG (or any future context) by changing a single import.

The context manages the drawing state stack, coordinate transforms, path creation, and fill/stroke operations. It automatically sizes itself to fit its parent container and emits events when it resizes, making responsive rendering straightforward.

## Creating a Context

Use `createContext` to create a context attached to a DOM element. By default, Ripl creates a **Canvas** context:

```ts
import {
    createContext,
} from '@ripl/core';

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

### Using `batch()`

The `batch()` convenience method wraps a callback in `save()`/`restore()` automatically:

```ts
context.batch(() => {
    context.fill = '#ff0000';
    circle.render(context);
});
// fill is automatically restored here
```

## Render Markers

The `markRenderStart()` and `markRenderEnd()` methods bracket a render pass. The SVG context uses these markers to know when to flush its virtual DOM.

> [!TIP]
> You typically don't need to call these yourself — elements and scenes handle this automatically.

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
> For the full list of properties, methods, and state options, see the [Context API Reference](/docs/api/core/context).

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
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

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createText,
} from '@ripl/core';

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
        context.markRenderStart();
        circle.render(context);
        label.render(context);
        context.markRenderEnd();
    };

    render();

    context.on('resize', () => {
        context.clear();
        render();
    });
});
</script>
