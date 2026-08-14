---
title: Events
description: "Binding pointer, drag and lifecycle listeners on Ripl elements, groups, the context and the renderer as ordinary Vue listeners."
---

# Events

Ripl's events are bound as ordinary Vue listeners. The handler receives the event's payload directly, with the underlying event object second:

```vue
<template>
    <ripl-circle
        :cx="50"
        :cy="50"
        :radius="20"
        @click="onClick"
        @mouseenter="hovered = true"
        @mouseleave="hovered = false"
    />
</template>

<script setup lang="ts">
import type {
    RiplPointerPayload,
} from '@ripl/vue';

function onClick(payload: RiplPointerPayload) {
    console.log(payload.x, payload.y);
}
</script>
```

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

`<ripl-context>` emits all of the above pointer events, plus `resize`, `render`, and `ready` (with the context, once its host is in the document).

`<ripl-renderer>` emits `start`, `stop` and `tick` (`{ time, deltaTime }`).

This list is not maintained by hand. Every Ripl object declares the events it emits and the adapter reads that declaration off the object itself, so a component forwards exactly what its underlying object can emit, and gains any event a future Ripl release adds.

`attached` fires while the element is being constructed, before Vue has bound any listener to it, so it is only observable for an element that later moves between groups.

## Only bound events are subscribed

The adapter subscribes to an event only when you actually bind a listener. This is not an optimisation: subscribing to a pointer event makes an element a hit-test target, so blanket subscription would change which element receives a click. Binding nothing leaves the element transparent to the pointer.

Use `pointerEvents` to control which region of an element is tested:

```vue
<template>
    <!-- only the stroke is clickable -->
    <ripl-circle pointer-events="stroke" :cx="50" :cy="50" :radius="20" @click="select" />

    <!-- never a pointer target, whatever is bound -->
    <ripl-rect pointer-events="none" :x="0" :y="0" :width="100" :height="100" />
</template>
```

## Bubbling

Events bubble up the group tree, so a listener on a group catches its children's:

```vue
<template>
    <ripl-group @click="onAnySegmentClick">
        <ripl-arc v-for="segment in segments" :key="segment.id" v-bind="segment" :data="segment" />
    </ripl-group>
</template>
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
