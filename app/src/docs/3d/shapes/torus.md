---
title: Torus
---

# Torus

A 3D torus (donut shape) with configurable major radius, tube radius, and segment counts.

## Usage

```ts
import { createTorus } from '@ripl/3d';

const torus = createTorus({
    radius: 2,
    tube: 0.5,
    radialSegments: 12,
    tubularSegments: 24,
    fillStyle: '#8844cc',
});
```

## Properties

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `radius` | `number` | — | Distance from center of torus to center of tube |
| `tube` | `number` | — | Radius of the tube |
| `radialSegments` | `number` | `12` | Number of segments around the tube cross-section |
| `tubularSegments` | `number` | `24` | Number of segments around the torus ring |
| `x` | `number` | `0` | X position |
| `y` | `number` | `0` | Y position |
| `z` | `number` | `0` | Z position |
| `rotationX` | `number` | `0` | Rotation around X axis (radians) |
| `rotationY` | `number` | `0` | Rotation around Y axis (radians) |
| `rotationZ` | `number` | `0` | Rotation around Z axis (radians) |

## Demo

:::tabs
== Demo
<ripl-3d-example @context-changed="contextChanged"></ripl-3d-example>
== Code
```ts
import { createContext, createTorus, createCamera } from '@ripl/3d';

const context = createContext('.mount-element');
const camera = createCamera(scene, { position: [0, 1.5, 5], target: [0, 0, 0] });

const torus = createTorus({ radius: 1.5, tube: 0.4, fillStyle: '#8844cc' });

let angle = 0;
function loop() {
    angle += 0.005;
    camera.position = [Math.sin(angle) * 5, 1.5, Math.cos(angle) * 5];
    camera.flush();
    context.clear();
    context.markRenderStart();
    torus.render(context);
    context.markRenderEnd();
    requestAnimationFrame(loop);
}
loop();
```
:::

<script lang="ts" setup>
import { createTorus } from '@ripl/3d';
import { useRipl3DExample } from '../../../.vitepress/compositions/example-3d';

const { contextChanged, startRotation } = useRipl3DExample((ctx, camera) => {
    const torus = createTorus({ radius: 1.5, tube: 0.4, fillStyle: '#8844cc' });

    startRotation(camera, ctx, () => {
        torus.render(ctx);
    });
});
</script>
