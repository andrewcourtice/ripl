---
title: Camera
description: "Framing a 3D scene with <ripl-camera>, enabling orbit, pan and zoom, and reaching the camera imperatively."
---

# Camera

`<ripl-camera>` views the enclosing `<ripl-context-3d>`. It renders nothing, so it can sit anywhere inside the context.

```vue
<template>
    <ripl-context-3d>
        <ripl-scene>
            <ripl-renderer :auto-stop="false">
                <ripl-camera
                    :position="[0, 2, 5]"
                    :target="[0, 0, 0]"
                    :fov="45"
                    :interactions="true"
                />

                <ripl-cube :size="1" fill="#4488ff" />
            </ripl-renderer>
        </ripl-scene>
    </ripl-context-3d>
</template>
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

A camera belongs to the context rather than the scene graph, so it takes no part in a `<ripl-transition>`. Its props are written straight through and coalesced onto the next microtask.

## Interactions in detail

```vue
<template>
    <ripl-camera
        :interactions="{
            zoom: true,
            pivot: { sensitivity: 0.5 },
            pan: false,
        }"
    />
</template>
```

Each interaction takes `true`, `false`, or `{ enabled, sensitivity }`.

## Reaching the camera

Both a template ref and a composition give you the `Camera` itself, for framing that no prop describes:

```vue
<template>
    <ripl-context-3d>
        <ripl-camera ref="camera" />
    </ripl-context-3d>
</template>

<script setup lang="ts">
import {
    useTemplateRef,
} from 'vue';

const camera = useTemplateRef('camera');

function frame() {
    camera.value?.lookAt([0, 1, 0]);
    camera.value?.zoom(-2);
}
</script>
```

`useRiplCamera()` resolves the same camera from anywhere inside the context. The context owns the ref, so it does not matter which slot the camera was declared in:

```ts
import {
    useRiplCamera,
} from '@ripl/vue-3d';

const camera = useRiplCamera();

const spin = (delta: number) => camera.value?.orbit(delta, 0);
```
