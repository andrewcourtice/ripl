---
outline: "deep"
---

# Events

Ripl provides a full event system modeled after the browser DOM. Elements can listen for and emit events, events bubble up through the element hierarchy, and propagation can be stopped — all familiar patterns for web developers.

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/core/core).

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
circle.off('click', myHandler); // Remove specific handler
circle.off('click'); // Remove all click handlers
circle.off(); // Remove all handlers
```

### `emit(event, data?)`

Emit an event. The event bubbles up to parent elements by default:

```ts
circle.emit('custom-event', { value: 42 });
```

## Event Object

Event handlers receive an `Event` object containing `type`, `data` (the payload), `source` (the originating element), and `currentTarget` (the element handling the event).

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

The scene tracks `click`, `mouseenter`, `mouseleave`, and `mousemove` events automatically.

```ts
const scene = createScene('.container', {
    children: [circle],
});

scene.render();

circle.on('mouseenter', () => {
    circle.fill = '#ff006e';
    scene.render();
});

circle.on('mouseleave', () => {
    circle.fill = '#3a86ff';
    scene.render();
});
```

> [!IMPORTANT]
> Pointer events only work when elements are inside a Scene. The scene handles DOM event listening and hit testing.

## Event Bubbling

Events bubble up through the element hierarchy, just like the DOM. If a circle inside a group emits a `click` event, the group will also receive it:

```ts
const circle = createCircle({
    cx: 100,
    cy: 100,
    radius: 50,
});
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
    circle.fill = event.data.color;
});

circle.emit('highlight', { color: '#ff006e' });
```

## The `pointerEvents` Property

The `pointerEvents` property on elements controls hit testing behavior. Set it to `'all'` (default, responds to fill and stroke), `'fill'`, `'stroke'`, or `'none'` (click-through).

```ts
const overlay = createRect({
    pointerEvents: 'none', // Click passes through to elements below
    fill: 'rgba(0, 0, 0, 0.3)',
    x: 0,
    y: 0,
    width: 400,
    height: 300,
});
```

## Demo

Hover over and click the elements to see events in action. Events bubble from child elements to the parent group.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
const circle = createCircle({
    fill: '#3a86ff',
    cx: 150,
    cy: 150,
    radius: 60,
});

const scene = createScene('.container', {
    children: [circle],
});
scene.render();

circle.on('mouseenter', () => {
    circle.fill = '#ff006e';
    scene.render();
});

circle.on('mouseleave', () => {
    circle.fill = '#3a86ff';
    scene.render();
});

circle.on('click', () => {
    circle.fill = '#8338ec';
    scene.render();
});
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createRect,
    createScene,
    createText,
} from '@ripl/core';

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
        borderRadius: 8,
    });

    const label = createText({
        fill: '#666',
        x: w / 2, y: h - 16,
        content: 'Hover or click an element',
        textAlign: 'center', font: '13px sans-serif',
    });

    const scene = createScene(context, {
        children: [circle, rect, label],
    });

    scene.render();

    const colors = { circle: '#3a86ff', rect: '#ff006e' };

    circle.on('mouseenter', () => { circle.fill = '#8338ec'; label.content = 'mouseenter: circle'; scene.render(); });
    circle.on('mouseleave', () => { circle.fill = colors.circle; label.content = 'mouseleave: circle'; scene.render(); });
    circle.on('click', () => { colors.circle = colors.circle === '#3a86ff' ? '#fb5607' : '#3a86ff'; circle.fill = colors.circle; label.content = 'click: circle'; scene.render(); });

    rect.on('mouseenter', () => { rect.fill = '#8338ec'; label.content = 'mouseenter: rect'; scene.render(); });
    rect.on('mouseleave', () => { rect.fill = colors.rect; label.content = 'mouseleave: rect'; scene.render(); });
    rect.on('click', () => { colors.rect = colors.rect === '#ff006e' ? '#fb5607' : '#ff006e'; rect.fill = colors.rect; label.content = 'click: rect'; scene.render(); });
});
</script>
