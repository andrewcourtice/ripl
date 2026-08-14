---
title: Lighting
description: "The five light components, how they replace the default ambient-plus-directional rig, and the eight-light budget."
---

# Lighting

A `<ripl-context-3d>` starts with a default rig — an ambient light plus a directional one — so a shape is shaded without any lighting setup at all. Declaring your own lights replaces it.

```vue
<ripl-context-3d :lights="[]">
    <ripl-ambient-light color="#8899bb" :intensity="0.25" />
    <ripl-directional-light :direction="[-0.6, -0.8, -0.5]" color="#fff2e0" :intensity="0.75" />
    <ripl-point-light :position="[0, 4, 3]" color="#ffd0a0" :intensity="12" :distance="14" />

    <ripl-scene>
        <ripl-sphere :radius="1" fill="#3a86ff" />
    </ripl-scene>
</ripl-context-3d>
```

Binding `lights` — even to an empty array, as above — is what clears the default rig. Without it your lights stack on top of it, which is rarely what you want. You can equally pass the lights themselves rather than declaring components:

```vue
<ripl-context-3d :lights="lights" />
```

## The five types

| Component | Adds |
| --- | --- |
| `<ripl-ambient-light>` | — lights every surface equally |
| `<ripl-hemisphere-light>` | `groundColor` — a second colour for downward-facing surfaces |
| `<ripl-directional-light>` | `direction`, `space` |
| `<ripl-point-light>` | `position`, `distance`, `decay` |
| `<ripl-spot-light>` | the point props plus `direction`, `space`, `angle`, `penumbra` |

All five accept `color` (defaults to `#ffffff`), `intensity` (defaults to `1`) and `enabled` (defaults to `true`).

`space` decides whether a direction is fixed in world space (`world`, the default) or follows the camera (`camera`). A camera-space key light keeps the lit face towards the viewer as the scene orbits.

## Budget

A context resolves at most **eight** lights. Beyond that the extras are dropped with a console warning, so a `v-for` over an unbounded list needs a cap.

## Tuning the default rig

If the default rig is close enough, tune it on the context instead of replacing it:

```vue
<ripl-context-3d
    :light-direction="[-0.5, -1, -0.3]"
    light-mode="camera"
    :ambient-intensity="0.4"
/>
```

These three props drive the default rig only. Binding `lights` detaches them.
