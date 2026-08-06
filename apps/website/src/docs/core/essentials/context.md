---
outline: "deep"
---

# Context

A **Context** is the rendering abstraction at the heart of Ripl. It sits between your elements and the underlying rendering technology, whether that's an HTML Canvas or an SVG element. By programming against the Context API, your drawing code becomes completely backend-agnostic: switch from Canvas to SVG (or any future context) by changing a single import.

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
> When using a Scene or Renderer, you don't need `batch()` because they manage the render lifecycle automatically.

## Interaction

The context owns all pointer interactivity. It listens for DOM mouse events on its element, performs hit testing against rendered elements, and delegates `click`, `mousedown`, `mouseup`, `mouseenter`, `mouseleave`, `mousemove`, `dragstart`, `drag`, and `dragend` events to the topmost Ripl element at the cursor automatically. This matches browser DOM behavior: when elements overlap, only the frontmost element (highest `zIndex`) receives the event, and it [bubbles](/docs/core/advanced/events#event-bubbling) up through the parent hierarchy.

The context emits the same pointer events itself, whether or not an element was hit — subscribe to `context.on('mousedown' | 'mouseup' | 'click' | 'mousemove' | 'mouseenter' | 'mouseleave' | 'dragstart' | 'drag' | 'dragend', …)` for surface-wide interaction. `mouseup` fires exactly once per button press, including when the release lands outside the surface and when a second button is pressed mid-gesture; the release that ends a drag suppresses the `click` that follows it, but still emits `mouseup`.

All pointer payloads report coordinates in the same space elements are authored in, so a point you receive can be fed straight back into anything that takes one — `element.intersectsWith(x, y)` included. See [Coordinates](#coordinates) below.

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

## Coordinates

Every coordinate Ripl takes or returns is in **logical space**: CSS pixels, unaffected by the device pixel ratio, with `0,0` at the top-left of the context's own element.

That last part is worth being precise about. It is not relative to the page, the viewport, or the document — where the context sits on screen and how far the page is scrolled make no difference. A pointer over the top-left corner of your canvas reports `0,0` whether the canvas is at the top of the page or halfway down a scrolled container.

The device pixel ratio makes no difference either. A context sized 300×150 reports `width` 300 and `height` 150 on every display; on a retina screen the underlying canvas is backed by 600×300 device pixels, but that number never reaches you:

```ts
const context = createContext('.container'); // host is 300 x 150 CSS pixels

context.width;  // 300, on any display
context.height; // 150, on any display

context.on('mousemove', (event) => {
    event.data.x; // 0 - 300, never 0 - 600
});
```

This holds in both directions and everywhere:

- **Going in** — element coordinates (`cx`, `x`, `points`, path data), transforms, `Navigator` transforms and brushes, and the hit-testing methods (`element.intersectsWith`, `context.isPointInPath`, `context.isPointInStroke`).
- **Coming out** — every pointer event payload, `element.getBoundingBox()`, `context.width`/`height`, `scene.width`/`height`, chart interaction points and tooltip anchors.

Backends do have a second, internal space — device pixels on canvas, a character grid on the terminal — and `context.toLogicalPoint`/`toSurfacePoint` map between the two. Those exist for people writing a custom backend; see [Custom Contexts](/docs/core/advanced/custom-contexts#coordinate-spaces). **If you are using Ripl rather than extending it, you never need to call either.**

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
