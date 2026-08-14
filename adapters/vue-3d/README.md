# @ripl/vue-3d

Declarative Vue 3 components for [Ripl](https://www.ripl.run) 3D scenes.

A 3D context is an ordinary Ripl context and a 3D shape is an ordinary element, so this package adds
only what 3D genuinely needs — a context, nine shapes, a group, a camera and five lights. The scene,
renderer and transition components from [`@ripl/vue`](../vue) drive a 3D scene unchanged.

## Installation

```bash
npm install @ripl/vue-3d
```

`@ripl/vue` arrives as a dependency. `vue` (3.5 or later) is a peer dependency.

## Quick start

```typescript
import {
    createRipl3D,
} from '@ripl/vue-3d';

createApp(App).use(createRipl3D()).mount('#app');
```

`createRipl3D()` registers the core Ripl components too. Applying `createRipl()` as well, in either
order, is harmless.

```html
<ripl-context-3d :lights="lights">
    <ripl-scene>
        <ripl-renderer :auto-stop="false">
            <ripl-camera :position="[0, 2, 5]" :interactions="true" />

            <ripl-group-3d :rotation-y="spin">
                <ripl-cube :size="1" :x="-1" fill="#4488ff" />
                <ripl-sphere :radius="0.6" :x="1" fill="#ff006e" />
            </ripl-group-3d>
        </ripl-renderer>
    </ripl-scene>
</ripl-context-3d>
```

`auto-stop="false"` is the norm in 3D: camera and light changes ask the context to repaint rather
than changing element state, so a renderer that idles when no transition is running would stop
before they land.

## Components

| Component | Wraps |
| --- | --- |
| `<ripl-context-3d>` | `createContext` from `@ripl/3d` |
| `<ripl-cube>`, `<ripl-sphere>`, `<ripl-cylinder>`, `<ripl-cone>`, `<ripl-plane>`, `<ripl-torus>` | the primitive shapes |
| `<ripl-mesh>`, `<ripl-parametric>`, `<ripl-bezier-surface>` | the geometry-driven shapes |
| `<ripl-group-3d>` | `createGroup3D` |
| `<ripl-camera>` | `createCamera` |
| `<ripl-ambient-light>`, `<ripl-hemisphere-light>`, `<ripl-directional-light>`, `<ripl-point-light>`, `<ripl-spot-light>` | the light factories |

## Compositions

```typescript
import {
    useRiplCamera,
    useRiplContext3D,
} from '@ripl/vue-3d';

const context = useRiplContext3D();
const camera = useRiplCamera();
```

The four core compositions are re-exported, so one import covers a whole scene.

## Notes

- There is no `zIndex` on a 3D shape: it derives depth ordering from its projected position.
- A group's transform lives outside element state, so it applies immediately and cannot be animated
  by a `<ripl-transition>`. Animate the children instead.
- A context resolves at most eight lights. Binding the context's `lights` prop, even to `[]`, is what
  clears the default ambient-plus-directional rig.

## Documentation

Full documentation lives at [ripl.run](https://www.ripl.run/docs/vue/3d/).

## License

MIT
