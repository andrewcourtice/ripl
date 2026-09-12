---
title: Lighting
description: "The five light components, how they replace the default ambient-plus-directional rig, and the eight-light budget."
---

# Lighting

A `<RiplContext3D>` starts with a default rig of an ambient light plus a directional one, so a shape is shaded without any lighting setup at all. Declaring your own lights replaces it.

```tsx
<RiplContext3D lights={[]}>
    <RiplAmbientLight color="#8899bb" intensity={0.25} />
    <RiplDirectionalLight direction={[-0.6, -0.8, -0.5]} color="#fff2e0" intensity={0.75} />
    <RiplPointLight position={[0, 4, 3]} color="#ffd0a0" intensity={12} distance={14} />

    <RiplScene>
        <RiplSphere radius={1} fill="#3a86ff" />
    </RiplScene>
</RiplContext3D>
```

Binding `lights`, even to an empty array as above, is what clears the default rig. Without it your lights stack on top of it, which is rarely what you want. Hoist that array to a module constant so it does not change identity on every render.

You can equally pass the lights themselves rather than declaring components:

```tsx
<RiplContext3D lights={lights} />
```

## The five types

| Component | Adds |
| --- | --- |
| `<RiplAmbientLight>` | — (it lights every surface equally) |
| `<RiplHemisphereLight>` | `groundColor`, a second colour for downward-facing surfaces |
| `<RiplDirectionalLight>` | `direction`, `space` |
| `<RiplPointLight>` | `position`, `distance`, `decay` |
| `<RiplSpotLight>` | the point props plus `direction`, `space`, `angle`, `penumbra` |

All five accept `color` (defaults to `#ffffff`), `intensity` (defaults to `1`) and `enabled` (defaults to `true`).

`space` decides whether a direction is fixed in world space (`world`, the default) or follows the camera (`camera`). A camera-space key light keeps the lit face towards the viewer as the scene orbits.

## Budget

A context resolves at most **eight** lights. Beyond that the extras are dropped with a console warning, so mapping over an unbounded list needs a cap.

## Tuning the default rig

If the default rig is close enough, tune it on the context instead of replacing it:

```tsx
<RiplContext3D
    lightDirection={[-0.5, -1, -0.3]}
    lightMode="camera"
    ambientIntensity={0.4}
/>
```

These three props drive the default rig only. Binding `lights` detaches them.
