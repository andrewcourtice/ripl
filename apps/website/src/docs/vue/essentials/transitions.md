---
title: Transitions
description: "Animating elements as they enter, update and leave with <ripl-transition>, including staggering and how enter targets are resolved."
---

# Transitions

`<ripl-transition>` animates the elements it wraps as they enter the graph, change, and leave it. It follows Vue's own enter-from / leave-to model: `enter` describes the state an element animates *from*, `leave` the state it animates *to*.

It requires a [`<ripl-renderer>`](/docs/vue/essentials/rendering) ancestor — transitions are scheduled on the renderer's loop. Without one, elements still paint, they just snap to each new value.

```vue
<template>
    <ripl-context>
        <ripl-scene>
            <ripl-renderer>
                <ripl-transition
                    :enter="{ duration: 400, state: { opacity: 0, radius: 0 } }"
                    :update="{ duration: 250 }"
                    :leave="{ duration: 200, state: { opacity: 0 } }"
                >
                    <ripl-circle
                        v-for="item in items"
                        :key="item.id"
                        :cx="item.x"
                        :cy="item.y"
                        :radius="item.radius"
                    />
                </ripl-transition>
            </ripl-renderer>
        </ripl-scene>
    </ripl-context>
</template>
```

## The three phases

| Prop | Meaning |
| --- | --- |
| `enter` | The state a new element starts from, applied immediately, then animated away from. |
| `update` | How a prop change animates. Its own `state`, if given, is merged over the changed props. |
| `leave` | The state a removed element animates to. The element is destroyed once it finishes. |
| `appear` | Whether elements present on the initial mount run their enter phase. Defaults to `true`. |

Each phase takes the same options as Ripl's own `renderer.transition`: `duration`, `ease`, `delay`, `loop`, `direction`, `state`, `interpolators` and `onComplete`.

## Enter targets

An enter phase can reference a property the template never binds. The target is read off the element *before* the enter state is applied, so it resolves from the element's own, inherited or default state:

```vue
<!-- opacity is never bound, but still animates 0 → 1 -->
<ripl-transition :enter="{ duration: 400, state: { opacity: 0 } }">
    <ripl-circle :cx="50" :cy="50" :radius="20" fill="#1e6978" />
</ripl-transition>
```

This is necessary rather than convenient: Ripl skips any property whose start value is unset, so an un-seeded property cannot animate at all.

## Staggering

Any phase can be a factory called per element with its index and the number of elements in the scope, which is how you stagger:

```vue
<ripl-transition
    :enter="(element, index, length) => ({
        duration: 400,
        delay: (index / length) * 300,
        ease: easeOutCubic,
        state: { opacity: 0, translateY: 20 },
    })"
>
    <ripl-rect v-for="bar in bars" :key="bar.id" v-bind="bar" />
</ripl-transition>
```

Phases are resolved once every element in the scope has been created, so `length` is the size of the whole set and a `delay` spanning `index / length` spreads across all of it.

The factory also receives the element itself, so a phase can vary by datum:

```ts
const enter = (element: Element) => ({
    duration: 400,
    state: {
        radius: 0,
        fill: (element.data as Datum).colour,
    },
});
```

## Looping

`loop` repeats a phase instead of settling: `true` restarts it, `'alternate'` plays it back and forth.

```vue
<!-- a pulse that runs for as long as the element is on screen -->
<ripl-transition :enter="{ duration: 900, loop: 'alternate', ease: easeInOutCubic, state: { opacity: 0.3 } }">
    <ripl-circle :cx="50" :cy="50" :radius="8" fill="#e5484d" />
</ripl-transition>
```

A looping phase never completes, which has three consequences:

- `onComplete` is never called for it.
- The renderer stays busy, so `auto-stop` cannot idle the loop while one is running. That is the point — a paused loop would not be a loop — but it does mean a permanent animation keeps a frame loop alive.
- Scheduling a second looping phase on the same element replaces the first rather than stacking on it, and the element's leave or unmount cancels it.

`loop` is ignored on the `leave` phase. A leave transition owns the element's destruction, so it has to finish.

## Leaving elements

A leaving element outlives its component: Vue unmounts it, but the element stays in the graph until its transition finishes, then destroys itself. Its id is retagged first, so a key re-entering mid-fade cannot collide with the element still on its way out.

Two consequences worth knowing:

- Reordering the list during a leave keeps the leaving element in place rather than dropping it.
- Unmounting the whole `<ripl-context>` destroys leaving elements immediately rather than animating them, since the renderer that would finish the transition is going away too.

## Updates

While a `update` phase is in scope, a prop change animates rather than snapping. Only the props that actually changed are animated:

```vue
<!-- moving `x` tweens; the unchanged fill is left alone -->
<ripl-transition :update="{ duration: 250, ease: easeOutCubic }">
    <ripl-rect :x="x" :y="0" :width="20" :height="100" fill="#1e6978" />
</ripl-transition>
```

Only animatable state participates. `id`, `class`, `data`, `pointerEvents` and the painting flags are applied directly.
