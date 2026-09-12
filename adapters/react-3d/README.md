# @ripl/react-3d

Declarative React components for [Ripl](https://www.ripl.run) 3D scenes.

A 3D context is an ordinary Ripl context and a 3D shape is an ordinary element, so this package adds only what 3D genuinely needs: a context, nine shapes, a group, a camera and five lights. The scene, renderer and transition components from [`@ripl/react`](../react) drive a 3D scene unchanged.

## Installation

```bash
npm install @ripl/react-3d
```

`@ripl/react` arrives as a dependency. `react` (18.3 or later) is a peer dependency.

## Quick start

```tsx
import {
    RiplCamera,
    RiplContext3D,
    RiplCube,
    RiplGroup3D,
    RiplRenderer,
    RiplScene,
    RiplSphere,
} from '@ripl/react-3d';

export function Scene({ spin }) {
    return (
        <RiplContext3D style={{ width: 480, height: 360 }}>
            <RiplScene>
                <RiplRenderer autoStop={false}>
                    <RiplCamera position={[0, 2, 5]} interactions />

                    <RiplGroup3D rotationY={spin}>
                        <RiplCube size={1} x={-1} fill="#4488ff" />
                        <RiplSphere radius={0.6} x={1} fill="#ff006e" />
                    </RiplGroup3D>
                </RiplRenderer>
            </RiplScene>
        </RiplContext3D>
    );
}
```

`autoStop={false}` is the norm in 3D: camera and light changes ask the context to repaint rather than changing element state, so a renderer that idles when no transition is running would stop before they land.

## Components

| Component | Wraps |
| --- | --- |
| `<RiplContext3D>` | `createContext` from `@ripl/3d` |
| `<RiplCube>`, `<RiplSphere>`, `<RiplCylinder>`, `<RiplCone>`, `<RiplPlane>`, `<RiplTorus>` | the primitive shapes |
| `<RiplMesh>`, `<RiplParametric>`, `<RiplBezierSurface>` | the geometry-driven shapes |
| `<RiplGroup3D>` | `createGroup3D` |
| `<RiplCamera>` | `createCamera` |
| `<RiplAmbientLight>`, `<RiplHemisphereLight>`, `<RiplDirectionalLight>`, `<RiplPointLight>`, `<RiplSpotLight>` | the light factories |

## Hooks

```tsx
import {
    useRiplCamera,
    useRiplContext3D,
} from '@ripl/react-3d';

const context = useRiplContext3D();
const camera = useRiplCamera();
```

The four core hooks are re-exported, so one import covers a whole scene.

## Notes

- There is no `zIndex` on a 3D shape: it derives depth ordering from its projected position.
- A group's transform lives outside element state, so it applies immediately and cannot be animated by a `<RiplTransition>`. Animate the children instead.
- A context resolves at most eight lights. Binding the context's `lights` prop, even to `[]`, is what clears the default ambient-plus-directional rig.
- A camera belongs to the context rather than the scene graph, so `<RiplCamera>` can sit anywhere inside a `<RiplContext3D>` and `useRiplCamera()` reaches it from anywhere below.

## Documentation

Full documentation lives at [ripl.run](https://www.ripl.run/docs/react/3d/).

## License

MIT
