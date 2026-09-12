---
title: Events
description: "Binding pointer, drag and lifecycle listeners on Ripl elements, groups, the context and the renderer as ordinary React props."
---

# Events

Ripl's events are bound as ordinary listener props. The handler receives the event's payload directly, with the underlying event object second:

```tsx
import type {
    RiplPointerPayload,
} from '@ripl/react';

function onClick(payload: RiplPointerPayload) {
    console.log(payload.x, payload.y);
}

<RiplCircle
    cx={50}
    cy={50}
    radius={20}
    onClick={onClick}
    onMouseenter={() => setHovered(true)}
    onMouseleave={() => setHovered(false)}
/>
```

Listener names are the event name with an `on` prefix and no other casing, so they match Ripl's own: `onMousedown`, `onDragstart`, `onBarclick`.

The second argument is the full event, carrying `target`, `type`, `timestamp` and `stopPropagation()`:

```ts
function onClick(payload, event) {
    event.stopPropagation();
    console.log(event.target.data);
}
```

## Available events

Elements and groups emit:

| Event | Payload |
| --- | --- |
| `click`, `mousedown`, `mouseup`, `mousemove` | `{ x, y }` in logical (CSS) pixels |
| `mouseenter`, `mouseleave` | `null` |
| `dragstart`, `drag`, `dragend` | `{ x, y, startX, startY, deltaX, deltaY }` |
| `updated` | `{ key, value }` for the state property that changed |
| `attached`, `detached` | the group the element joined or left |
| `graph` | `null`; the shape of the graph at or below this element changed |
| `destroyed` | `null` |

`<RiplContext>` emits all of the above pointer events, plus `resize`, `render`, and `ready` (with the context, once its host is in the document).

`<RiplRenderer>` emits `start`, `stop` and `tick` (`{ time, deltaTime }`).

This list is not maintained by hand. Every Ripl object declares the events it emits and the adapter reads that declaration off the object itself, so a component forwards exactly what its underlying object can emit, and gains any event a future Ripl release adds.

`attached` fires while the element is being constructed, before any listener has been bound to it, so it is only observable for an element that later moves between groups.

## Only bound events are subscribed

The adapter subscribes to an event only when you actually bind a listener. This is not an optimisation: subscribing to a pointer event makes an element a hit-test target, so blanket subscription would change which element receives a click. Binding nothing leaves the element transparent to the pointer.

The subscription is keyed on which events you bind, not on handler identity, so a fresh arrow on every render costs nothing. Write your handlers inline.

Use `pointerEvents` to control which region of an element is tested:

```tsx
{/* only the stroke is clickable */}
<RiplCircle pointerEvents="stroke" cx={50} cy={50} radius={20} onClick={select} />

{/* never a pointer target, whatever is bound */}
<RiplRect pointerEvents="none" x={0} y={0} width={100} height={100} />
```

## Bubbling

Events bubble up the group tree, so a listener on a group catches its children's:

```tsx
<RiplGroup onClick={onAnySegmentClick}>
    {segments.map(segment => (
        <RiplArc key={segment.id} {...segment} data={segment} />
    ))}
</RiplGroup>
```

`event.target` is the element that was hit, which pairs well with `data`:

```ts
function onAnySegmentClick(payload, event) {
    const segment = event.target.data as Segment;

    select(segment);
}
```

## Coordinates

Every coordinate in an event payload is in logical space: CSS pixels relative to the context element's top-left, independent of the device pixel ratio. There is nothing to convert.
