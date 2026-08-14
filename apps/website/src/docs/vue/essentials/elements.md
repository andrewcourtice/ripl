---
title: Elements
description: "The built-in element components, how props map onto element state, class and data binding, and grouping with <ripl-group>."
---

# Elements

Every built-in Ripl element has a component. Props map directly onto the element's state, so the names match the imperative API exactly.

| Component | Own state props |
| --- | --- |
| `<ripl-arc>` | `cx`, `cy`, `startAngle`, `endAngle`, `radius`, `innerRadius`, `padAngle`, `padWidth`, `borderRadius` |
| `<ripl-circle>` | `cx`, `cy`, `radius` |
| `<ripl-ellipse>` | `cx`, `cy`, `radiusX`, `radiusY`, `startAngle`, `endAngle` |
| `<ripl-image>` | `image`, `x`, `y`, `width`, `height` |
| `<ripl-line>` | `x1`, `y1`, `x2`, `y2` |
| `<ripl-path>` | `x`, `y`, `width`, `height` |
| `<ripl-polygon>` | `cx`, `cy`, `radius`, `sides` |
| `<ripl-polyline>` | `points`, `renderer`, `segments` |
| `<ripl-rect>` | `x`, `y`, `width`, `height`, `borderRadius` |
| `<ripl-text>` | `x`, `y`, `content`, `pathData`, `startOffset` |
| `<ripl-group>` | — |

## Shared props

On top of its own state, every element accepts the full base state (`fill`, `stroke`, `opacity`, `lineWidth`, `lineDash`, `lineCap`, `lineJoin`, `font`, `textAlign`, `shadowBlur`, `zIndex`, `translateX`, `translateY`, `rotation`, `transformScaleX`, `transformOriginX` and the rest) plus:

| Prop | Description |
| --- | --- |
| `id` | Stable id used for querying and for matching an element across renders. |
| `class` | Class names for querying, in any of Vue's class binding forms. |
| `data` | Arbitrary user data, typically the datum backing the element. |
| `pointerEvents` | Which parts respond to hit testing: `all`, `none`, `stroke` or `fill`. |
| `interpolators` | Per-property interpolator overrides, layered over the element type's own. Read once, at construction. |
| `autoFill`, `autoStroke`, `clip`, `cachePath` | Painting flags on path-backed shapes. |

`class` binds to the element's class list, not to the marker node the component renders, so `scene.query('.segment')` finds it:

```vue
<template>
    <ripl-circle :class="['segment', { active: isActive }]" :cx="10" :cy="10" :radius="5" />
</template>
```

## Unbound props keep Ripl's defaults

A prop you do not bind is not written to the element. This matters for the base state, which is inherited: leaving `fill` unbound lets a parent group's fill cascade through, whereas binding it to `undefined` would not.

```vue
<template>
    <ripl-group fill="#e5484d">
        <!-- red, inherited from the group -->
        <ripl-circle :cx="10" :cy="10" :radius="5" />
        <!-- blue, its own -->
        <ripl-circle :cx="30" :cy="10" :radius="5" fill="#1e6978" />
    </ripl-group>
</template>
```

A prop cannot be *unset* later either: changing a bound prop back to `undefined` leaves the element at its last value rather than restoring the default. Bind the default explicitly if you need to return to it.

## Object and array bindings

Props are compared by identity. A template literal like `:line-dash="[4, 2]"` or `:data="{ id: item.id }"` builds a new object on every render, so the element sees a change every time its parent re-renders, which dirties it and forces a repaint. Hoist those to a `computed` (or to the datum itself) and the comparison settles:

```vue
<template>
    <ripl-line :x1="0" :y1="0" :x2="100" :y2="0" :line-dash="dash" />
</template>

<script setup lang="ts">
const dash = computed(() => (emphasised.value ? [4, 2] : []));
</script>
```

`class` is exempt: it is normalised before comparison, so every one of Vue's binding forms is stable.

## `<ripl-group>`

Groups its children, cascading its own state to them and transforming them as a unit. Groups nest arbitrarily.

```vue
<template>
    <ripl-group
        class="axis"
        fill="#e5484d"
        :translate-x="20"
        :translate-y="10"
        :opacity="0.8"
    >
        <ripl-circle :cx="0" :cy="0" :radius="5" />
        <ripl-group :rotation="Math.PI / 4">
            <ripl-rect :x="0" :y="0" :width="10" :height="10" />
        </ripl-group>
    </ripl-group>
</template>
```

A group's `opacity` composites multiplicatively with its children's, and its transform applies to the whole subtree.

## Paint order

Children paint in template order, and reordering a keyed `v-for` reorders the paint order to match. Use `zIndex` when you need an order that differs from the template:

```vue
<template>
    <ripl-rect :x="0" :y="0" :width="50" :height="50" :z-index="1" fill="#1e6978" />
    <ripl-circle :cx="25" :cy="25" :radius="20" :z-index="0" fill="#e5484d" />
</template>
```

`zIndex` is additive down the tree: a child's effective z-index is its own plus its parent's.

## Custom elements

`defineRiplElement` builds a component for an element Ripl does not ship, given its state property names and a factory:

```ts
import {
    defineRiplElement,
} from '@ripl/vue';

const RiplStar = defineRiplElement({
    name: 'RiplStar',
    stateKeys: ['cx', 'cy', 'radius', 'points'],
    create: options => createStar(options),
});
```
