---
outline: "deep"
---

# Events

Ripl provides a full event system modeled after the browser DOM. Elements can listen for and emit events, events bubble up through the element hierarchy, and propagation can be stopped — all familiar patterns for web developers.

## EventBus

Every element in Ripl extends `EventBus`, which provides the core event subscription and emission API.

### `on(event, handler, options?)`

Subscribe to an event. Returns an unsubscribe function:

```ts
const off = circle.on('click', (event) => {
    console.log('Clicked!', event.data);
});

// Later, unsubscribe
off();
```

### `once(event, handler)`

Subscribe to an event that fires only once:

```ts
circle.once('click', (event) => {
    console.log('First click only');
});
```

### `off(event?, handler?)`

Remove event handlers. With no arguments, removes all handlers. With just an event name, removes all handlers for that event:

```ts
circle.off('click', myHandler);  // Remove specific handler
circle.off('click');              // Remove all click handlers
circle.off();                     // Remove all handlers
```

### `emit(event, data?)`

Emit an event. The event bubbles up to parent elements by default:

```ts
circle.emit('custom-event', { value: 42 });
```

## Event Object

Event handlers receive an `Event` object with:

| Property | Type | Description |
| --- | --- | --- |
| `type` | `string` | The event name |
| `data` | `any` | Event payload data |
| `source` | `EventBus` | The element that originally emitted the event |
| `currentTarget` | `EventBus` | The element currently handling the event |

### `stopPropagation()`

Prevent the event from bubbling further up the tree:

```ts
circle.on('click', (event) => {
    event.stopPropagation();
    // Parent group's click handler will NOT fire
});
```

## Pointer Events

When elements are inside a [Scene](/docs/core/essentials/scene), the scene automatically delegates DOM pointer events to the correct elements based on hit testing.

### Tracked Events

| Event | Description |
| --- | --- |
| `click` | Element was clicked |
| `mouseenter` | Pointer entered the element's bounds |
| `mouseleave` | Pointer left the element's bounds |
| `mousemove` | Pointer moved within the element's bounds |

```ts
const scene = createScene('.container', {
    children: [circle],
});

scene.render();

circle.on('mouseenter', () => {
    circle.fillStyle = '#ff006e';
    scene.render();
});

circle.on('mouseleave', () => {
    circle.fillStyle = '#3a86ff';
    scene.render();
});
```

> [!IMPORTANT]
> Pointer events only work when elements are inside a Scene. The scene handles DOM event listening and hit testing.

## Event Bubbling

Events bubble up through the element hierarchy, just like the DOM. If a circle inside a group emits a `click` event, the group will also receive it:

```ts
const circle = createCircle({ cx: 100, cy: 100, radius: 50 });
const group = createGroup({ children: [circle] });

// This fires when the circle (or any child) is clicked
group.on('click', (event) => {
    console.log('Group received click from:', event.source.type);
});
```

### Self Option

Use the `self` option to only handle events that originated from the element itself (not from children):

```ts
group.on('click', (event) => {
    console.log('Only fires for direct group clicks');
}, { self: true });
```

## Custom Events

You can emit and listen for any custom event name:

```ts
circle.on('highlight', (event) => {
    circle.fillStyle = event.data.color;
});

circle.emit('highlight', { color: '#ff006e' });
```

## The `pointerEvents` Property

The `pointerEvents` property on elements controls hit testing behavior:

| Value | Description |
| --- | --- |
| `'all'` | Responds to hits on fill and stroke (default) |
| `'fill'` | Only responds to hits on the fill area |
| `'stroke'` | Only responds to hits on the stroke area |
| `'none'` | Element is invisible to pointer events |

```ts
const overlay = createRect({
    pointerEvents: 'none',  // Click passes through to elements below
    fillStyle: 'rgba(0, 0, 0, 0.3)',
    x: 0, y: 0, width: 400, height: 300,
});
```

## Demo

Hover over and click the elements to see events in action. Events bubble from child elements to the parent group.

:::tabs
== Code
```ts
const circle = createCircle({
    fillStyle: '#3a86ff', cx: 150, cy: 150, radius: 60,
});

const scene = createScene('.container', { children: [circle] });
scene.render();

circle.on('mouseenter', () => {
    circle.fillStyle = '#ff006e';
    scene.render();
});

circle.on('mouseleave', () => {
    circle.fillStyle = '#3a86ff';
    scene.render();
});

circle.on('click', () => {
    circle.fillStyle = '#8338ec';
    scene.render();
});
```
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
:::

<script lang="ts" setup>
import { createCircle, createRect, createScene, createText } from '@ripl/core';
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
        borderRadius: 8,
    });

    const label = createText({
        fillStyle: '#666',
        x: w / 2, y: h - 16,
        content: 'Hover or click an element',
        textAlign: 'center', font: '13px sans-serif',
    });

    const scene = createScene(context, {
        children: [circle, rect, label],
    });

    scene.render();

    const colors = { circle: '#3a86ff', rect: '#ff006e' };

    circle.on('mouseenter', () => { circle.fillStyle = '#8338ec'; label.content = 'mouseenter: circle'; scene.render(); });
    circle.on('mouseleave', () => { circle.fillStyle = colors.circle; label.content = 'mouseleave: circle'; scene.render(); });
    circle.on('click', () => { colors.circle = colors.circle === '#3a86ff' ? '#fb5607' : '#3a86ff'; circle.fillStyle = colors.circle; label.content = 'click: circle'; scene.render(); });

    rect.on('mouseenter', () => { rect.fillStyle = '#8338ec'; label.content = 'mouseenter: rect'; scene.render(); });
    rect.on('mouseleave', () => { rect.fillStyle = colors.rect; label.content = 'mouseleave: rect'; scene.render(); });
    rect.on('click', () => { colors.rect = colors.rect === '#ff006e' ? '#fb5607' : '#ff006e'; rect.fillStyle = colors.rect; label.content = 'click: rect'; scene.render(); });
});
</script>
