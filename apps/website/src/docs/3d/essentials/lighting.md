---
title: Lighting
description: Light a 3D scene with ambient, hemisphere, directional, point and spot lights, each with colour, intensity, falloff and cone, on both Canvas and WebGPU.
outline: "deep"
---

# Lighting

A 3D **context** carries a list of **lights**. Each one has a colour and an intensity, and — depending on its type — a direction, a position, a falloff and a cone. Both the Canvas and WebGPU backends resolve the same lighting model, so a rig looks the same whichever one you render with.

> [!NOTE]
> For the full API, see the [3D API Reference](/docs/api/@ripl/3d/).

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplSwitch v-model="ambient" label="Ambient" />
            <RiplSwitch v-model="key" label="Key" />
            <RiplSwitch v-model="fill" label="Fill" />
            <RiplSwitch v-model="rim" label="Rim" />
        </RiplControlGroup>
    </template>
</ripl-3d-example>
== Code
```ts
import {
    createAmbientLight,
    createContext,
    createDirectionalLight,
    createPointLight,
    createSphere,
} from '@ripl/3d';

const context = createContext('.mount-element');

context.lights.clear();
context.lights.add(
    createAmbientLight({ color: '#334466', intensity: 0.3 }),
    createDirectionalLight({ direction: [-1, -1, -0.5], color: '#ffdcb0', intensity: 0.8 }),
    createPointLight({ position: [3, 1, 2], color: '#4499ff', intensity: 12, distance: 10 })
);

scene.add(createSphere({ radius: 1.2, fill: '#dddddd' }));
```
:::

## The default rig

A context with no lighting configured carries an ambient light at intensity `0.3` and a directional light at `0.7`, which together resolve to the flat shading model earlier versions used. Add to that list, or clear it and build your own.

```ts
context.lights.add(createPointLight({ position: [0, 3, 0], intensity: 8 }));
```

`context.lightDirection` and `context.lightMode` remain as shorthands for the default rig's directional light. Once you replace the rig, they no longer apply.

## Light types

### Ambient

Reaches every surface equally regardless of orientation. Use it to lift the shadows rather than as the main source — on its own it flattens a shape completely.

```ts
createAmbientLight({ color: '#404860', intensity: 0.25 });
```

### Hemisphere

Fades from one colour overhead to another underfoot, reading as bounced daylight. Cheaper and more natural than two opposed directional lights.

```ts
createHemisphereLight({ color: '#a0c8ff', groundColor: '#4a3520', intensity: 0.6 });
```

### Directional

Infinitely far away, casting parallel rays. The workhorse for a key light; has a direction but no position, so distance never affects it.

```ts
createDirectionalLight({ direction: [-1, -1, -1], color: '#fff2e0', intensity: 0.8 });
```

### Point

Radiates in every direction from a position, dimming with distance.

```ts
createPointLight({
    position: [2, 3, 1],
    intensity: 10,
    distance: 12,
    decay: 2,
});
```

### Spot

A point light confined to a cone, with an optionally soft edge.

```ts
createSpotLight({
    position: [0, 5, 0],
    direction: [0, -1, 0],
    angle: Math.PI / 8,
    penumbra: 0.4,
    intensity: 20,
});
```

## Properties

- **`color`**: the light's colour (default `'#ffffff'`)
- **`intensity`**: how strongly it contributes (default `1`)
- **`enabled`**: whether it contributes at all (default `true`)
- **`direction`**: the direction the light travels in, normalized on assignment — directional and spot only
- **`position`**: the light's world-space position — point and spot only
- **`distance`**: the distance at which the light falls to zero; `0` means it never does (default `0`)
- **`decay`**: the exponent of the inverse-distance falloff (default `2`, physically plausible)
- **`angle`**: half-angle of a spot cone in radians, clamped below a right angle (default `Math.PI / 6`)
- **`penumbra`**: how softly a spot cone fades at its edge, `0` to `1` (default `0`)
- **`groundColor`**: the downward colour of a hemisphere light (default `'#000000'`)
- **`space`**: `'world'` or `'camera'` — whether orientation is fixed or follows the camera (default `'world'`)

Falloff and cone attenuation follow the same conventions as three.js, so a rig tuned against those numbers reads the same here.

## Camera-space lights

A `'world'` light stays put as the camera orbits, which is what you want for a scene with a sense of place. A `'camera'` light travels with the viewer — a head torch — which keeps a shape readable while the camera moves around it.

```ts
createDirectionalLight({ direction: [0, 0, -1], space: 'camera' });
```

## Managing the list

```ts
const key = createDirectionalLight({ direction: [-1, -1, -1] });

context.lights.add(key);
context.lights.remove(key);
context.lights.clear();

context.lights.length;
context.lights.find('directional');
```

Changing a property on a light already in the list repaints the scene, so a slider bound to `light.intensity` works with no further wiring.

> [!WARNING]
> A render pass carries at most **8** lights. Beyond that, the extras are dropped and a warning is logged.

## Fog

Distance haze blends geometry towards a colour, and both backends resolve it identically.

```ts
context.fog = {
    color: '#101820',
    near: 5,
    far: 40,
};

context.fog = {
    mode: 'exponential',
    color: '#101820',
    density: 0.04,
};
```

<script lang="ts" setup>
import {
    ref,
    watch,
} from 'vue';

import {
    useRipl3DExample,
} from '../../../.vitepress/compositions/example-3d';

import {
    createAmbientLight,
    createDirectionalLight,
    createPointLight,
    createSphere,
    createTorus,
} from '@ripl/3d';

import type {
    Light,
} from '@ripl/3d';

const ambient = ref(true);
const key = ref(true);
const fill = ref(true);
const rim = ref(true);

const lights: Record<string, Light> = {};

const { contextChanged, startRotation } = useRipl3DExample((scene, camera) => {
    // The rig is world-space, so the light stays put as the camera orbits around it.
    scene.context.lightMode = 'world';
    scene.context.lights.clear();

    lights.ambient = createAmbientLight({ color: '#334466', intensity: 0.35 });
    lights.key = createDirectionalLight({ direction: [-1, -1, -0.6], color: '#ffdcb0', intensity: 0.85 });
    lights.fill = createDirectionalLight({ direction: [1, -0.2, 0.4], color: '#5588cc', intensity: 0.45 });
    lights.rim = createPointLight({ position: [0, 2.4, -2.4], color: '#ff88aa', intensity: 18, distance: 9 });

    scene.context.lights.add(lights.ambient, lights.key, lights.fill, lights.rim);

    scene.add([
        createSphere({ radius: 1.1, segments: 40, rings: 28, fill: '#e8e8e8' }),
        createTorus({ x: 0, y: -1, radius: 1.7, tube: 0.16, radialSegments: 12, tubularSegments: 48, fill: '#8899aa' }),
    ]);

    applyToggles();
    startRotation(camera, 0.003);
});

function applyToggles() {
    const enabled = {
        ambient: ambient.value,
        key: key.value,
        fill: fill.value,
        rim: rim.value,
    };

    for (const [name, light] of Object.entries(lights)) {
        light.enabled = enabled[name as keyof typeof enabled];
    }
}

watch([ambient, key, fill, rim], applyToggles);
</script>
