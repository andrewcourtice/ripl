---
title: Components
description: "The nine built-in 3D shape components, how their transform props map onto state, and what <RiplGroup3D> can and cannot animate."
---

# Components

Every built-in 3D shape has a component. Props map onto the shape's state, so the names match the imperative API exactly.

| Component | Own state props |
| --- | --- |
| `<RiplCube>` | `size` |
| `<RiplSphere>` | `radius`, `segments`, `rings` |
| `<RiplCylinder>` | `radiusTop`, `radiusBottom`, `height`, `segments` |
| `<RiplCone>` | `radius`, `height`, `segments` |
| `<RiplPlane>` | `width`, `height` |
| `<RiplTorus>` | `radius`, `tube`, `radialSegments`, `tubularSegments` |
| `<RiplMesh>` | `faces` |
| `<RiplParametric>` | `surface`, `uSegments`, `vSegments` |
| `<RiplBezierSurface>` | `patches`, `segments` |
| `<RiplGroup3D>` | — |

## Shared props

Every component accepts the 3D transform, the shared base state, and the same construction options as a 2D component:

| Prop | Description |
| --- | --- |
| `x`, `y`, `z` | Position of the shape's origin in world space. |
| `rotationX`, `rotationY`, `rotationZ` | Rotation around each axis, in radians. |
| `scaleX`, `scaleY`, `scaleZ` | Per-axis scale. |
| `scale` | A uniform scale, applied to all three axes. Overridden by any per-axis scale also given. |
| `material` | How the surface responds to light. Without one the shape shades from its `fill` alone. |
| `fill`, `stroke`, `opacity`, `lineWidth`, … | The shared base state, as in 2D. |
| `id`, `className`, `data`, `pointerEvents` | As on a 2D component. |

There is deliberately **no `zIndex`**. A 3D shape derives its depth ordering from its projected position, and assigning one does nothing.

## Materials

`material` is read as a value, so assign a new object rather than mutating the one you passed. Memoise it and it stays stable between renders:

```tsx
const material = useMemo(() => ({
    shininess: 40,
    specular: '#ffffff',
    wireframe,
}), [wireframe]);

return <RiplSphere radius={1} material={material} fill="#3a86ff" />;
```

## `<RiplGroup3D>`

Groups its children, composing its transform onto theirs. Groups nest arbitrarily, and an ordinary `<RiplGroup>` in between is harmless, since it contributes no transform.

```tsx
<RiplGroup3D y={-0.9} rotationY={spin}>
    <RiplCube size={1} x={-1} />
    <RiplCube size={1} x={1} />
</RiplGroup3D>
```

A group's transform lives outside element state, because a group's own state is not parameterized:

- It applies immediately, without a repaint request.
- It **cannot be animated** by a `<RiplTransition>`. Animate the children's `x`/`y`/`z` and rotations instead, or drive the group's rotation from the renderer's `onTick`.

## Geometry that changes

`<RiplMesh>`, `<RiplParametric>` and `<RiplBezierSurface>` carry their geometry by reference. Binding a new value replaces it and rebuilds the mesh:

```tsx
<RiplParametric surface={surface} uSegments={32} vSegments={32} />
```

Comparison is by identity, so return a new function or array rather than mutating in place. Memoise it too, or every render of the parent rebuilds the mesh.
