---
outline: "deep"
---

# Events

Ripl provides a full event system modeled after the browser DOM. Elements can listen for and emit events, events bubble up through the element hierarchy, and propagation can be stopped, all familiar patterns for web developers.

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
let originX = 0;
let originY = 0;

circle.on('dragstart', () => {
    originX = circle.cx;
    originY = circle.cy;
});

circle.on('drag', (event) => {
    circle.cx = originX + event.data.deltaX;
    circle.cy = originY + event.data.deltaY;
    scene.render();
});
```
:::

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/@ripl/core/).

## EventBus

Every element in Ripl extends `EventBus`, which provides the core event subscription and emission API.

### `on(event, handler, options?)`

Subscribe to an event. Returns a disposable subscription:

```ts
const subscription = circle.on('click', (event) => {
    console.log('Clicked!', event.data);
});

// Later, unsubscribe
subscription.dispose();
```

### `on('*', handler, options?)` {#wildcard}

Subscribe to the wildcard event type to receive **every** event emitted on a bus, whatever its
type — including custom types that never appear in `$events`. Because events bubble, a wildcard
subscription on a group or scene observes its whole subtree, and each event's `target` still
identifies the element it was emitted on:

```ts
import {
    EVENT_WILDCARD,
} from '@ripl/core';

scene.on(EVENT_WILDCARD, (event) => {
    console.log(event.type, 'from', event.target.type);
});
```

Handlers for the event's own type run first, then wildcard handlers. `stopPropagation()` and the
`self` option apply exactly as they do to a typed subscription.

A wildcard subscription is deliberately invisible to [`has()`](#tracked-events): it reports only
listeners registered for a concrete type. Since pointer events are dispatched to elements that
`has` them, observing a bus never turns it into a hit-test target — which is what lets the
[devtools](/docs/core/advanced/devtools) record a scene's events without changing how it behaves.

### `once(event, handler)`

Subscribe to an event that fires only once:

```ts
circle.once('click', (event) => {
    console.log('First click only');
});
```

### `off(event, handler)`

Remove a previously registered handler:

```ts
circle.off('click', myHandler);
```

To drop every listener on an element, use `destroy()`.

### `emit(event, data?)`

Emit an event. The event bubbles up to parent elements by default:

```ts
circle.emit('custom-event', { value: 42 });
```

## Event Object

Event handlers receive an `Event` object containing `type`, `data` (the payload), `target` (the bus the event was originally emitted on, preserved as it bubbles), and `timestamp` (a high-resolution time reading taken when the event was created).

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

Following browser DOM behavior, pointer events target the **topmost element** (highest `zIndex`) at the cursor position. If overlapping elements exist, only the frontmost one receives the event; lower elements are occluded. The event then [bubbles](#event-bubbling) up through the parent hierarchy as usual.

Elements with `pointerEvents` set to `'none'` are transparent to hit testing, allowing events to pass through to the next element below.

### Tracked Events

The context tracks `click`, `mousedown`, `mouseup`, `mouseenter`, `mouseleave`, `mousemove`, `dragstart`, `drag`, and `dragend` events automatically.

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
> Pointer events only work when elements have been rendered to a context. The context handles DOM event listening and hit testing; see [Context: Interaction](/docs/core/essentials/context#interaction).

### Drag Events

Ripl supports drag interactions on elements via `dragstart`, `drag`, and `dragend` events. A drag begins when the pointer is pressed on an element and moved beyond a configurable threshold (default 3px). Once the threshold is exceeded, `dragstart` fires, followed by `drag` on each subsequent move, and `dragend` on pointer release.

```ts
let originX = 0;
let originY = 0;

circle.on('dragstart', (event) => {
    originX = circle.cx;
    originY = circle.cy;
    console.log('Drag started at', event.data.x, event.data.y);
});

circle.on('drag', (event) => {
    circle.cx = originX + event.data.deltaX;
    circle.cy = originY + event.data.deltaY;
    scene.render();
});

circle.on('dragend', (event) => {
    console.log('Drag ended at', event.data.x, event.data.y);
});
```

The `drag` and `dragend` events include `startX`/`startY` (where the drag originated) and `deltaX`/`deltaY` (**the total movement since the drag started**, not the step since the previous event). Record the element's position on `dragstart` and add the delta to it, as above: that preserves the offset between the cursor and the element's origin, and — because each payload is a total rather than a running sum — the element stays put under the cursor even if a move event is coalesced or dropped.

Every pointer payload — `x`/`y`, `startX`/`startY`, and the deltas — is in **logical** space: CSS pixels relative to the surface origin, the space elements themselves are authored in. They are not device pixels, and they are not element-local.

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
    console.log('Group received click from:', event.target.type);
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
    const origin = { cx: 0, cy: 0, x: 0, y: 0 };

    circle.on('mouseenter', () => { circle.fill = '#8338ec'; label.content = 'mouseenter: circle'; scene.render(); });
    circle.on('mouseleave', () => { circle.fill = colors.circle; label.content = 'mouseleave: circle'; scene.render(); });
    circle.on('click', () => { colors.circle = colors.circle === '#3a86ff' ? '#fb5607' : '#3a86ff'; circle.fill = colors.circle; label.content = 'click: circle'; scene.render(); });
    circle.on('dragstart', () => { origin.cx = circle.cx; origin.cy = circle.cy; label.content = 'dragstart: circle'; scene.render(); });
    circle.on('drag', (event) => { circle.cx = origin.cx + event.data.deltaX; circle.cy = origin.cy + event.data.deltaY; label.content = 'drag: circle'; scene.render(); });
    circle.on('dragend', () => { label.content = 'dragend: circle'; scene.render(); });

    rect.on('mouseenter', () => { rect.fill = '#8338ec'; label.content = 'mouseenter: rect'; scene.render(); });
    rect.on('mouseleave', () => { rect.fill = colors.rect; label.content = 'mouseleave: rect'; scene.render(); });
    rect.on('click', () => { colors.rect = colors.rect === '#ff006e' ? '#fb5607' : '#ff006e'; rect.fill = colors.rect; label.content = 'click: rect'; scene.render(); });
    rect.on('dragstart', () => { origin.x = rect.x; origin.y = rect.y; label.content = 'dragstart: rect'; scene.render(); });
    rect.on('drag', (event) => { rect.x = origin.x + event.data.deltaX; rect.y = origin.y + event.data.deltaY; label.content = 'drag: rect'; scene.render(); });
    rect.on('dragend', () => { label.content = 'dragend: rect'; scene.render(); });
});
</script>
