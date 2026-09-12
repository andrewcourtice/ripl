---
title: Camera
description: "Framing a 3D scene with <RiplCamera>, enabling orbit, pan and zoom, and reaching the camera imperatively."
---

# Camera

`<RiplCamera>` views the enclosing `<RiplContext3D>`. It renders nothing, so it can sit anywhere inside the context.

```tsx
<RiplContext3D>
    <RiplScene>
        <RiplRenderer autoStop={false}>
            <RiplCamera
                position={[0, 2, 5]}
                target={[0, 0, 0]}
                fov={45}
                interactions
            />

            <RiplCube size={1} fill="#4488ff" />
        </RiplRenderer>
    </RiplScene>
</RiplContext3D>
```

| Prop | Description |
| --- | --- |
| `position` | The camera's world-space position. Defaults to `[0, 0, 5]`. |
| `target` | The point it looks at. Defaults to the origin. |
| `up` | The world-space up direction. Defaults to `[0, 1, 0]`. |
| `fov` | Vertical field of view, in degrees. Defaults to `60`. |
| `near`, `far` | Clipping planes. Default to `0.1` and `1000`. |
| `projection` | `perspective` (default) or `orthographic`. |
| `interactions` | `true` for all pointer interactions, or an object enabling `zoom`, `pivot` and `pan` individually. |

`interactions` is read once, when the camera wires up its listeners, so changing it later has no effect. Bind it to a constant.

A camera belongs to the context rather than the scene graph, so it takes no part in a `<RiplTransition>`. Its props are written straight through and coalesced onto the next microtask, which is why a vector prop rebuilt on every render costs nothing extra.

## Interactions in detail

```tsx
<RiplCamera
    interactions={{
        zoom: true,
        pivot: { sensitivity: 0.5 },
        pan: false,
    }}
/>
```

Each interaction takes `true`, `false`, or `{ enabled, sensitivity }`. Hoist the object to a module constant or a `useMemo`, since it is construction-only anyway.

## Reaching the camera

Both a `ref` and a hook give you the `Camera` itself, for framing that no prop describes:

```tsx
import {
    useRef,
} from 'react';

import type {
    Camera,
} from '@ripl/3d';

function Scene() {
    const camera = useRef<Camera>(null);

    const frame = () => {
        camera.current?.lookAt([0, 1, 0]);
        camera.current?.zoom(-2);
    };

    return (
        <RiplContext3D>
            <RiplCamera ref={camera} />
        </RiplContext3D>
    );
}
```

`useRiplCamera()` resolves the same camera from anywhere inside the context. The context owns the camera, not the subtree it was declared in, so it does not matter where in the tree `<RiplCamera>` sits:

```ts
import {
    useRiplCamera,
} from '@ripl/react-3d';

const camera = useRiplCamera();

const spin = (delta: number) => camera?.orbit(delta, 0);
```
