---
outline: "deep"
---

# Context

A **Context** is the rendering target for all Ripl elements. It abstracts away the differences between rendering backends (Canvas, SVG, etc.) behind a unified API. You create a context, draw elements to it, and Ripl handles the rest.

## Creating a Context

Use `createContext` to create a context attached to a DOM element. By default, Ripl creates a **Canvas** context:

```ts
import { createContext } from '@ripl/core';

// Pass a CSS selector or an HTMLElement
const context = createContext('.my-container');
```

To create an SVG context instead, import from `@ripl/svg`:

```ts
import { createContext } from '@ripl/svg';

const context = createContext('.my-container');
```

The context automatically fills its parent container and responds to resize events.

## Properties

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | The context type (`'canvas'` or `'svg'`) |
| `width` | `number` | Current width of the rendering area (in CSS pixels) |
| `height` | `number` | Current height of the rendering area (in CSS pixels) |
| `element` | `Element` | The underlying DOM element (e.g. `<canvas>` or `<svg>`) |
| `root` | `HTMLElement` | The parent container element |
| `buffer` | `boolean` | Whether rendering is buffered (batched) |

## Options

```ts
interface ContextOptions {
    buffer?: boolean; // Default: false for canvas, true for SVG
}
```

The `buffer` option controls whether rendering operations are batched. The SVG context uses buffering by default to minimize DOM mutations.

## Drawing State

The context maintains a drawing state stack, similar to the Canvas 2D API. You can save and restore state to isolate style changes:

```ts
context.save();
context.fillStyle = '#ff0000';
// ... draw red elements ...
context.restore(); // fillStyle reverts to previous value
```

The full set of state properties mirrors the Canvas 2D API:

| Property | Type | Default |
| --- | --- | --- |
| `fillStyle` | `string` | `'#000000'` |
| `strokeStyle` | `string` | `'#000000'` |
| `lineWidth` | `number` | `1` |
| `lineCap` | `'butt' \| 'round' \| 'square'` | `'butt'` |
| `lineJoin` | `'bevel' \| 'miter' \| 'round'` | `'miter'` |
| `lineDash` | `number[]` | `[]` |
| `lineDashOffset` | `number` | `0` |
| `globalAlpha` | `number` | `1` |
| `font` | `string` | `'10px sans-serif'` |
| `textAlign` | `string` | `'start'` |
| `textBaseline` | `string` | `'alphabetic'` |
| `shadowBlur` | `number` | `0` |
| `shadowColor` | `string` | `'rgba(0, 0, 0, 0)'` |
| `shadowOffsetX` | `number` | `0` |
| `shadowOffsetY` | `number` | `0` |
| `filter` | `string` | `'none'` |
| `direction` | `'inherit' \| 'ltr' \| 'rtl'` | `'inherit'` |

## Key Methods

### `save()` / `restore()`

Push and pop the drawing state stack. Always pair these calls to avoid state leaks.

### `clear()`

Clear the entire rendering area.

### `markRenderStart()` / `markRenderEnd()`

Bracket a render pass. These are used internally by elements and scenes to track render depth. The SVG context uses these markers to know when to flush its virtual DOM.

> [!TIP]
> You typically don't need to call `markRenderStart`/`markRenderEnd` yourself — elements and scenes handle this automatically.

### `batch(callback)`

A convenience method that wraps a callback in `save()`/`restore()`:

```ts
context.batch(() => {
    context.fillStyle = '#ff0000';
    circle.render(context);
});
// fillStyle is automatically restored here
```

### `destroy()`

Remove the context's DOM element and clean up all event listeners.

## Events

The context emits a `resize` event whenever its container changes size:

```ts
context.on('resize', () => {
    console.log(`New size: ${context.width} x ${context.height}`);
});
```

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createCircle,
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fillStyle: '#3a86ff',
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
import { createCircle, createText } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const {
    contextChanged
} = useRiplExample(context => {
    const circle = createCircle({
        fillStyle: '#3a86ff',
        cx: context.width / 2,
        cy: context.height / 2,
        radius: Math.min(context.width, context.height) / 4,
    });

    const label = createText({
        x: context.width / 2,
        y: context.height / 2,
        content: `${context.type} context`,
        fillStyle: '#FFFFFF',
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
