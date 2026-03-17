---
outline: "deep"
---

# Element

**Element** is the base class for everything that can be drawn in Ripl. Every built-in shape — circles, rectangles, lines, text — ultimately extends `Element`, which provides the shared foundation for styling, event handling, state interpolation, and rendering. If you're building anything with Ripl, you're working with elements.

Elements follow a pattern inspired by the DOM: they have an `id`, a `classList`, a `parent` reference, and style properties that cascade through the group hierarchy. This makes Ripl's scene graph feel familiar to web developers while giving you full control over how things are drawn and animated.

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
    stroke: '#1a56db',
    lineWidth: 3,
    cx: context.width / 2,
    cy: context.height / 2,
    radius: Math.min(context.width, context.height) / 4,
});

circle.render(context);
```
:::

## Creating Elements

You don't create raw `Element` instances directly — instead you use factory functions like `createCircle`, `createRect`, or `createText`. Each element accepts an options object with its specific properties (like `cx`/`cy`/`radius` for a circle) plus all the shared base properties:

```ts
import {
    createCircle,
} from '@ripl/web';

const circle = createCircle({
    id: 'my-circle',
    class: 'highlighted',
    fill: '#3a86ff',
    cx: 100,
    cy: 100,
    radius: 50,
});
```

## Styling

Elements support all Canvas 2D drawing state properties — `fill`, `stroke`, `lineWidth`, `opacity`, `font`, `shadow*`, `filter`, and more. Set them in the constructor or change them at any time:

```ts
const circle = createCircle({
    fill: '#3a86ff',
    stroke: '#1a56db',
    lineWidth: 3,
    opacity: 0.8,
    cx: 100,
    cy: 100,
    radius: 50,
});

// Update dynamically
circle.fill = '#ff006e';
circle.opacity = 1;
```

## Rendering

Call `render(context)` to draw an element. Internally, this saves the context state, applies the element's style properties, executes the drawing logic, then restores the state:

```ts
circle.render(context);
```

## Hit Testing

Elements support point intersection testing, which the context uses internally for pointer event delegation:

```ts
if (circle.intersectsWith(mouseX, mouseY)) {
    console.log('Hit!');
}
```

The `pointerEvents` property controls hit testing behavior: `'all'` (default), `'fill'`, `'stroke'`, or `'none'`.

## Interpolation

The `interpolate()` method creates a function that smoothly transitions the element's properties. It returns an interpolator that accepts a progress value from 0 to 1:

```ts
const interpolator = circle.interpolate({
    radius: 100,
    fill: '#ff006e',
});

interpolator(0.5); // Apply at 50% progress
```

This is used internally by the [Renderer](/docs/core/essentials/renderer) for animations, but can also be used directly with the standalone `transition` function. See [Animations](/docs/core/advanced/animations) for more.

## Events

Elements extend `EventBus` and support a typed event system with bubbling, disposable subscriptions, and stop-propagation. See [Events](/docs/core/advanced/events) for the full guide.

```ts
circle.on('click', (event) => {
    console.log('Clicked at', event.data.x, event.data.y);
});

circle.on('mouseenter', () => {
    circle.fill = '#ff006e';
});

circle.on('mouseleave', () => {
    circle.fill = '#3a86ff';
});
```

> [!NOTE]
> Pointer events (`click`, `mouseenter`, `mouseleave`, `mousemove`, `dragstart`, `drag`, `dragend`) only work when the element has been rendered to a [Context](/docs/core/essentials/context), because the context manages DOM event listening and hit testing — see [Context: Interaction](/docs/core/essentials/context#interaction).

## Style Inheritance

When an element is inside a [Group](/docs/core/essentials/group), any style property that is **not set** on the element will be inherited from its parent group. This works just like CSS inheritance:

```ts
const group = createGroup({
    fill: '#3a86ff', // All children inherit this
    lineWidth: 2,
    children: [
        createCircle({
            cx: 50,
            cy: 50,
            radius: 30,
        }), // inherits fill
        createCircle({
            cx: 150,
            cy: 50,
            radius: 30,
            fill: '#ff006e', // overrides fill
        }),
    ],
});
```

## Cloning and Destruction

Clone an element to create a shallow copy with the same state, or destroy it to clean up listeners and remove it from its parent:

```ts
const copy = circle.clone();
circle.destroy();
```

> [!NOTE]
> For the full list of properties, methods, and events, see the [Element API Reference](/docs/api/@ripl/core/).

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
} from '@ripl/web';

const {
    contextChanged
} = useRiplExample(context => {
    const circle = createCircle({
        fill: '#3a86ff',
        stroke: '#1a56db',
        lineWidth: 3,
        cx: context.width / 2,
        cy: context.height / 2,
        radius: Math.min(context.width, context.height) / 4,
    });

    circle.render(context);

    context.on('resize', () => {
        context.clear();
        circle.render(context);
    });
});
</script>
