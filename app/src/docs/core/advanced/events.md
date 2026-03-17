---
outline: "deep"
---

# Events

Ripl provides a full event system modeled after the browser DOM. Elements can listen for and emit events, events bubble up through the element hierarchy, and propagation can be stopped — all familiar patterns for web developers.

## Demo

Hover over, click, and drag the elements to see events in action.

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

// Drag the circle to reposition it
circle.on('drag', (event) => {
    circle.cx += event.data.deltaX;
    circle.cy += event.data.deltaY;
    scene.render();
});
```
:::

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/@ripl/core/).

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

When elements are rendered to a [Context](/docs/core/essentials/context), the context automatically delegates DOM pointer events to the correct elements based on hit testing. A [Scene](/docs/core/essentials/scene) manages the render lifecycle, but the context itself owns interaction.

### Tracked Events

The context tracks `click`, `mouseenter`, `mouseleave`, `mousemove`, `dragstart`, `drag`, and `dragend` events automatically.

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
> Pointer events only work when elements have been rendered to a context. The context handles DOM event listening and hit testing — see [Context: Interaction](/docs/core/essentials/context#interaction).

### Drag Events

Ripl supports drag interactions on elements via `dragstart`, `drag`, and `dragend` events. A drag begins when the pointer is pressed on an element and moved beyond a configurable threshold (default 3px). Once the threshold is exceeded, `dragstart` fires, followed by `drag` on each subsequent move, and `dragend` on pointer release.

```ts
circle.on('dragstart', (event) => {
    console.log('Drag started at', event.data.x, event.data.y);
});

circle.on('drag', (event) => {
    circle.cx += event.data.deltaX;
    circle.cy += event.data.deltaY;
    scene.render();
});

circle.on('dragend', (event) => {
    console.log('Drag ended at', event.data.x, event.data.y);
});
```

The `drag` and `dragend` events include `startX`/`startY` (where the drag originated) and `deltaX`/`deltaY` (movement since the last event). Use `deltaX`/`deltaY` for repositioning elements to preserve the offset between the cursor and the element's origin.

The drag threshold can be configured via context options:

```ts
const context = createContext('.container', {
    dragThreshold: 5, // pixels before dragstart fires
});
```

> [!NOTE]
> Drag events continue to fire even when the pointer moves outside the element, until the pointer is released.

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

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createRect,
    createScene,
    createText,
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
    circle.on('dragstart', () => { label.content = 'dragstart: circle'; scene.render(); });
    circle.on('drag', (event) => { circle.cx += event.data.deltaX; circle.cy += event.data.deltaY; label.content = 'drag: circle'; scene.render(); });
    circle.on('dragend', () => { label.content = 'dragend: circle'; scene.render(); });

    rect.on('mouseenter', () => { rect.fill = '#8338ec'; label.content = 'mouseenter: rect'; scene.render(); });
    rect.on('mouseleave', () => { rect.fill = colors.rect; label.content = 'mouseleave: rect'; scene.render(); });
    rect.on('click', () => { colors.rect = colors.rect === '#ff006e' ? '#fb5607' : '#ff006e'; rect.fill = colors.rect; label.content = 'click: rect'; scene.render(); });
    rect.on('dragstart', () => { label.content = 'dragstart: rect'; scene.render(); });
    rect.on('drag', (event) => { rect.x += event.data.deltaX; rect.y += event.data.deltaY; label.content = 'drag: rect'; scene.render(); });
    rect.on('dragend', () => { label.content = 'dragend: rect'; scene.render(); });
});
</script>
