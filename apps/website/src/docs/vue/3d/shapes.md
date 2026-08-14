---
title: Shapes
description: "The nine built-in 3D shape components, how their transform props map onto state, and what <ripl-group-3d> can and cannot animate."
---

# Shapes

Every built-in 3D shape has a component. Props map onto the shape's state, so the names match the imperative API exactly.

| Component | Own state props |
| --- | --- |
| `<ripl-cube>` | `size` |
| `<ripl-sphere>` | `radius`, `segments`, `rings` |
| `<ripl-cylinder>` | `radiusTop`, `radiusBottom`, `height`, `segments` |
| `<ripl-cone>` | `radius`, `height`, `segments` |
| `<ripl-plane>` | `width`, `height` |
| `<ripl-torus>` | `radius`, `tube`, `radialSegments`, `tubularSegments` |
| `<ripl-mesh>` | `faces` |
| `<ripl-parametric>` | `surface`, `uSegments`, `vSegments` |
| `<ripl-bezier-surface>` | `patches`, `segments` |
| `<ripl-group-3d>` | — |

## Shared props

Every shape accepts the 3D transform, the shared base state, and the same construction options as a 2D element:

| Prop | Description |
| --- | --- |
| `x`, `y`, `z` | Position of the shape's origin in world space. |
| `rotationX`, `rotationY`, `rotationZ` | Rotation around each axis, in radians. |
| `scaleX`, `scaleY`, `scaleZ` | Per-axis scale. |
| `scale` | A uniform scale, applied to all three axes. Overridden by any per-axis scale also given. |
| `material` | How the surface responds to light. Without one the shape shades from its `fill` alone. |
| `fill`, `stroke`, `opacity`, `lineWidth`, … | The shared base state, as in 2D. |
| `id`, `class`, `data`, `pointerEvents` | As on a 2D element. |

There is deliberately **no `zIndex`**. A 3D shape derives its depth ordering from its projected position, and assigning one does nothing.

## Materials

`material` is read as a value, so assign a new object rather than mutating the one you passed. Hoist it to a `computed` and it stays stable between renders:

```vue
<template>
    <ripl-sphere :radius="1" :material="material" fill="#3a86ff" />
</template>

<script setup lang="ts">
const material = computed(() => ({
    shininess: 40,
    specular: '#ffffff',
    wireframe: wireframe.value,
}));
</script>
```

## `<ripl-group-3d>`

Groups its children, composing its transform onto theirs. Groups nest arbitrarily, and an ordinary `<ripl-group>` in between is harmless, since it contributes no transform.

```vue
<template>
    <ripl-group-3d :y="-0.9" :rotation-y="spin">
        <ripl-cube :size="1" :x="-1" />
        <ripl-cube :size="1" :x="1" />
    </ripl-group-3d>
</template>
```

A group's transform lives outside element state, because a group's own state is not parameterized:

- It applies immediately, without a repaint request.
- It **cannot be animated** by a `<ripl-transition>`. Animate the children's `x`/`y`/`z` and rotations instead, or drive the group's rotation from the renderer's `tick`.

## Geometry that changes

`<ripl-mesh>`, `<ripl-parametric>` and `<ripl-bezier-surface>` carry their geometry by reference. Binding a new value replaces it and rebuilds the mesh:

```vue
<template>
    <ripl-parametric :surface="surface" :u-segments="32" :v-segments="32" />
</template>
```

Comparison is by identity, so return a new function or array rather than mutating in place.
