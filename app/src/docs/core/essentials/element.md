---
outline: "deep"
---

# Element

The **Element** is the base class for everything that can be drawn in Ripl. All built-in primitives (circles, rects, lines, etc.) and custom elements ultimately extend `Element`. It provides shared styling properties, event handling, interpolation, and rendering.

## Creating an Element

You typically don't create raw `Element` instances directly — instead you use one of the built-in factory functions like `createCircle`, `createRect`, etc. However, understanding the `Element` class is key to understanding how Ripl works.

```ts
import { createCircle } from '@ripl/core';

const circle = createCircle({
    id: 'my-circle',
    class: 'highlighted',
    fillStyle: '#3a86ff',
    cx: 100,
    cy: 100,
    radius: 50,
});
```

## Common Options

Every element accepts these base options:

| Option | Type | Description |
| --- | --- | --- |
| `id` | `string` | Unique identifier. Auto-generated if not provided. |
| `class` | `string \| string[]` | One or more class names for querying. |
| `data` | `unknown` | Arbitrary data to attach to the element. |
| `pointerEvents` | `'none' \| 'all' \| 'stroke' \| 'fill'` | Controls hit testing behavior. Default: `'all'`. |

## Style Properties

Elements inherit all Canvas 2D drawing state properties. These can be set directly on the element or inherited from a parent [Group](/docs/core/essentials/group):

| Property | Type | Description |
| --- | --- | --- |
| `fillStyle` | `string` | Fill color or gradient string |
| `strokeStyle` | `string` | Stroke color or gradient string |
| `lineWidth` | `number` | Stroke width |
| `lineCap` | `'butt' \| 'round' \| 'square'` | Line end style |
| `lineJoin` | `'bevel' \| 'miter' \| 'round'` | Line join style |
| `lineDash` | `number[]` | Dash pattern |
| `lineDashOffset` | `number` | Dash offset |
| `globalAlpha` | `number` | Opacity (0–1) |
| `font` | `string` | Font string (e.g. `'16px sans-serif'`) |
| `textAlign` | `string` | Text alignment |
| `textBaseline` | `string` | Text baseline |
| `shadowBlur` | `number` | Shadow blur radius |
| `shadowColor` | `string` | Shadow color |
| `shadowOffsetX` | `number` | Shadow X offset |
| `shadowOffsetY` | `number` | Shadow Y offset |
| `filter` | `string` | CSS filter string |
| `direction` | `'inherit' \| 'ltr' \| 'rtl'` | Text direction |
| `zIndex` | `number` | Rendering order within a scene |

## Key Properties

### `type`

A read-only string identifying the element type (e.g. `'circle'`, `'rect'`, `'text'`). Used for querying with `getElementsByType`.

### `id`

A unique identifier for the element. Auto-generated as `{type}:{uniqueId}` if not provided. Used for querying with `getElementById`.

### `classList`

A `Set<string>` of class names. Used for querying with `getElementsByClass` and CSS-like selectors.

### `parent`

A reference to the element's parent [Group](/docs/core/essentials/group), or `undefined` if the element is not in a group.

### `pointerEvents`

Controls how the element responds to pointer hit testing:

- `'all'` — (default) responds to both fill and stroke hits
- `'fill'` — only responds to fill area hits
- `'stroke'` — only responds to stroke area hits
- `'none'` — ignores all pointer events

## Key Methods

### `render(context)`

Draw the element to a context. This is the core method that every element implements:

```ts
circle.render(context);
```

Internally, `render` saves the context state, applies the element's style properties, executes the drawing logic, then restores the state.

### `getBoundingBox()`

Returns a `Box` representing the element's bounding rectangle:

```ts
const box = circle.getBoundingBox();
console.log(box.left, box.top, box.width, box.height);
```

### `intersectsWith(x, y)`

Test whether a point intersects with the element:

```ts
if (circle.intersectsWith(mouseX, mouseY)) {
    console.log('Hit!');
}
```

### `interpolate(newState)`

Create an interpolation function that smoothly transitions the element's properties. Returns a function that accepts a time value from 0 to 1:

```ts
const interpolator = circle.interpolate({
    radius: 100,
    fillStyle: '#ff006e',
});

// Apply at 50% progress
interpolator(0.5);
```

This is used internally by the [Renderer](/docs/core/essentials/renderer) for animations, but can also be used directly with the standalone `transition` function.

### `clone()`

Create a shallow copy of the element with the same properties:

```ts
const copy = circle.clone();
```

### `destroy()`

Remove the element from its parent group and clean up all event listeners:

```ts
circle.destroy();
```

## Events

Elements extend `EventBus` and support a full event system. See [Events](/docs/core/advanced/events) for details.

```ts
circle.on('click', (event) => {
    console.log('Clicked at', event.data.x, event.data.y);
});

circle.on('mouseenter', () => {
    circle.fillStyle = '#ff006e';
});

circle.on('mouseleave', () => {
    circle.fillStyle = '#3a86ff';
});
```

> [!NOTE]
> Pointer events (`click`, `mouseenter`, `mouseleave`, `mousemove`) only work when the element is inside a [Scene](/docs/core/essentials/scene), because the scene manages DOM event delegation.

## Style Inheritance

When an element is inside a [Group](/docs/core/essentials/group), any style property that is **not set** on the element will be inherited from its parent group. This works just like CSS inheritance:

```ts
const group = createGroup({
    fillStyle: '#3a86ff',  // All children inherit this
    lineWidth: 2,
    children: [
        createCircle({ cx: 50, cy: 50, radius: 30 }),         // inherits fillStyle
        createCircle({ cx: 150, cy: 50, radius: 30,
            fillStyle: '#ff006e' }),  // overrides fillStyle
    ],
});
```

## Demo

:::tabs
== Code
```ts
import { createContext, createCircle } from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fillStyle: '#3a86ff',
    strokeStyle: '#1a56db',
    lineWidth: 3,
    cx: context.width / 2,
    cy: context.height / 2,
    radius: Math.min(context.width, context.height) / 4,
});

circle.render(context);
```
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
:::

<script lang="ts" setup>
import { createCircle } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const {
    contextChanged
} = useRiplExample(context => {
    const circle = createCircle({
        fillStyle: '#3a86ff',
        strokeStyle: '#1a56db',
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
