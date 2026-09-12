---
title: 3D
description: "@ripl/react-3d wraps Ripl's 3D context, shapes, camera and lights as React components, reusing the core scene, renderer and transition unchanged."
---

# 3D

`@ripl/react-3d` adds a `<RiplContext3D>` and the 3D shapes to the declarative surface. Everything else you already know still applies: a 3D context is an ordinary Ripl context and a 3D shape is an ordinary element, so [`<RiplScene>`](/docs/react/essentials/rendering), [`<RiplRenderer>`](/docs/react/essentials/rendering) and [`<RiplTransition>`](/docs/react/essentials/transitions) drive a 3D scene with no changes at all.

```bash
npm install @ripl/react-3d
```

`@ripl/react` arrives as a dependency, and the core components are re-exported, so one import covers a whole scene:

```tsx
import {
    RiplCamera,
    RiplContext3D,
    RiplCube,
    RiplGroup3D,
    RiplRenderer,
    RiplScene,
} from '@ripl/react-3d';
```

## A scene

:::tabs
== Demo
<example-react-3d />
== Code
```tsx
<RiplContext3D lights={lights}>
    <RiplScene>
        <RiplRenderer autoStop={false} onTick={onTick}>
            <RiplCamera position={[0, 2.4, 6]} fov={45} interactions />

            <RiplGroup3D rotationY={spin}>
                {blocks.map(block => (
                    <RiplCube
                        key={block.key}
                        size={block.size}
                        x={block.x}
                        z={block.z}
                        fill={block.fill}
                    />
                ))}
            </RiplGroup3D>
        </RiplRenderer>
    </RiplScene>
</RiplContext3D>
```
:::

`autoStop={false}` is the norm in 3D. Camera orbit and light changes ask the context to repaint rather than changing element state, so a renderer that idles when no transition is running would stop before they land.

## `<RiplContext3D>`

Replaces `<RiplContext>`, and nothing else changes. It builds its context in a layout effect against its own host element, exactly as the 2D one does, and renders its children once that context exists.

| Prop | Description |
| --- | --- |
| `context` | An existing `Context3D` to draw into instead of creating one. |
| `fov`, `near`, `far` | The perspective frustum. Defaults: `60`, `0.1`, `1000`. |
| `lights` | The lights illuminating the scene, replacing the default rig. See [Lighting](/docs/react/3d/lighting). |
| `lightDirection`, `lightMode`, `ambientIntensity` | Tune the default rig, when you have not replaced it. |
| `fog` | Atmospheric haze blending distant geometry towards a colour. |
| `interactive`, `dragThreshold`, `meta` | As on `<RiplContext>`. |
| `className`, `style` | Passed through to the component's root element. |

It fires `onReady` with the context, plus `onResize`, `onRender` and every pointer event. Hit testing is by ray rather than paint order, so `onMouseenter` on a torus correctly ignores the hole.

## Where to go next

- **[Components](/docs/react/3d/components)**: the nine built-in shapes and `<RiplGroup3D>`
- **[Camera](/docs/react/3d/camera)**: framing and pointer interactions
- **[Lighting](/docs/react/3d/lighting)**: the five light types and the default rig
