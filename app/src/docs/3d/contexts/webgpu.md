---
title: WebGPU (WebGPUContext3D)
outline: "deep"
---

# WebGPU (WebGPUContext3D)

The **WebGPU context** provides GPU-accelerated 3D rendering for Ripl, replacing the Canvas 2D painter's algorithm in `@ripl/3d` with a true WebGPU rasterization pipeline. It features hardware depth testing, WGSL shaders with Lambertian diffuse lighting, and 4× MSAA anti-aliasing. All existing `Shape3D` elements work without modification — the rendering path is selected automatically based on the context type.

> [!NOTE]
> WebGPU requires a compatible browser (Chrome 113+, Edge 113+, Firefox Nightly). The existing Canvas `Context3D` remains available as a fallback.

## Demo

:::tabs
== Demo
<example-3d-webgpu @context-changed="contextChanged"></example-3d-webgpu>
== Code
```ts
import {
    createContext,
} from '@ripl/webgpu';

import {
    createCamera,
    createCube,
    createSphere,
} from '@ripl/3d';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

const context = await createContext('.mount-element');
const scene = createScene(context);
const renderer = createRenderer(scene, { autoStop: false });

const camera = createCamera(scene, {
    position: [0, 1.5, 5],
    target: [0, 0, 0],
});

scene.add(createCube({
    size: 1,
    fill: '#3a86ff',
    translateX: -1.2,
}));

scene.add(createSphere({
    radius: 0.6,
    fill: '#ff006e',
    translateX: 1.2,
}));

camera.flush();
```
:::

## Installation

```bash
npm install @ripl/webgpu @ripl/3d
```

## Usage

Import `createContext` from `@ripl/webgpu` instead of `@ripl/3d`. The factory is **async** because it must negotiate a GPU adapter and device:

```ts
import {
    createContext,
} from '@ripl/webgpu';

import {
    createCamera,
    createCube,
} from '@ripl/3d';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

const context = await createContext('#app');
const scene = createScene(context);
const renderer = createRenderer(scene);

const camera = createCamera(scene, {
    position: [0, 2, 5],
    target: [0, 0, 0],
});

const cube = createCube({
    size: 1,
    fill: '#4488ff',
});

scene.add(cube);
camera.flush();
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `fov` | `number` | `60` | Field of view in degrees |
| `near` | `number` | `0.1` | Near clipping plane |
| `far` | `number` | `1000` | Far clipping plane |
| `lightDirection` | `Vector3` | `[-0.577, -0.577, -0.577]` | Light direction vector |
| `lightMode` | `'world' \| 'camera'` | `'world'` | Whether light is in world or camera space |
| `sampleCount` | `number` | `4` | MSAA sample count (1 to disable) |
| `clearColor` | `[r, g, b, a]` | `[0, 0, 0, 0]` | Background clear colour (0–1 range) |

## API

### Camera & Projection

```ts
context.setCamera(eye, target, up);
context.setPerspective(fov, near, far);
context.setOrthographic(left, right, bottom, top, near, far);
```

### Properties

```ts
context.viewMatrix; // Matrix4
context.projectionMatrix; // Matrix4
context.viewProjectionMatrix; // Matrix4
context.lightDirection; // Vector3 (read/write)
context.lightMode; // 'world' | 'camera' (read/write)
```

### Projection

```ts
const [screenX, screenY, depth] = context.project([x, y, z]);
```

## How It Works

1. During each render frame, `Shape3D` elements detect the WebGPU context and call `submitMesh()` with raw vertex/index data instead of populating a face buffer
2. The context accumulates all mesh submissions into GPU staging buffers
3. At `markRenderEnd()`, the context writes uniform buffers (view-projection matrix, light direction), uploads geometry, and issues a single render pass with depth testing enabled
4. Hit testing remains CPU-side using an offscreen `CanvasRenderingContext2D` with projected 2D paths

## When to Use WebGPU

WebGPU is the best choice when:

- **Complex 3D scenes** — Hardware depth testing handles intersecting geometry correctly
- **Large meshes** — GPU-accelerated rendering is significantly faster than software rasterization
- **Visual quality** — 4× MSAA anti-aliasing produces smooth edges

WebGPU is less ideal when:

- You need broad browser support (Chrome 113+, Edge 113+, Firefox Nightly only)
- Your scene is simple enough that `@ripl/3d` Canvas rendering is sufficient
- You need to run in Node.js or headless environments

## Migration from Context3D

Migrating an existing `@ripl/3d` application to use WebGPU requires minimal changes.

### 1. Install the package

```bash
npm install @ripl/webgpu
```

### 2. Swap the context import

**Before:**
```ts
import {
    createContext,
} from '@ripl/3d';
const context = createContext('#app');
```

**After:**
```ts
import {
    createContext,
} from '@ripl/webgpu';
const context = await createContext('#app');
```

> [!IMPORTANT]
> `createContext` from `@ripl/webgpu` is **async** — it returns a `Promise<WebGPUContext3D>`. You must `await` it.

### 3. Everything else stays the same

- `createScene(context)` — works unchanged
- `createCamera(scene, options)` — works unchanged
- `createRenderer(scene)` — works unchanged
- All `Shape3D` elements — work unchanged
- Event handlers (`mouseenter`, `mouseleave`, etc.) — work unchanged
- Transitions and animations — work unchanged

### What changes under the hood

| Aspect | Context3D (Canvas 2D) | WebGPUContext3D |
|--------|----------------------|-----------------|
| Depth sorting | CPU painter's algorithm | Hardware depth buffer |
| Rasterisation | Canvas 2D fill/stroke | GPU fragment shader |
| Shading | CPU per-face colour | GPU per-fragment Lambertian |
| Anti-aliasing | None (canvas default) | 4× MSAA |
| Intersecting geometry | May render incorrectly | Correct via depth test |

### Fallback

If you need to support browsers without WebGPU, you can feature-detect:

```ts
let context;

if (navigator.gpu) {
    const { createContext } = await import('@ripl/webgpu');
    context = await createContext('#app');
} else {
    const { createContext } = await import('@ripl/3d');
    context = createContext('#app');
}
```

<script lang="ts" setup>
import {
    onUnmounted,
    shallowRef,
} from 'vue';

import {
    createCamera,
    createCube,
    createSphere,
} from '@ripl/3d';

import type {
    Camera,
    Context3D,
} from '@ripl/3d';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

import type {
    Renderer,
    Scene,
} from '@ripl/web';

let currentScene: Scene<Context3D> | undefined;
let animationId = 0;

function contextChanged(ctx: Context3D) {
    cancelAnimationFrame(animationId);
    currentScene?.destroy();

    const scene = createScene(ctx) as Scene<Context3D>;
    currentScene = scene;

    const renderer = createRenderer(scene, { autoStop: false });

    const camera = createCamera(scene, {
        position: [0, 1.5, 5],
        target: [0, 0, 0],
        fov: 50,
    });

    scene.add(createCube({
        size: 1,
        fill: '#3a86ff',
        translateX: -1.2,
    }));

    scene.add(createSphere({
        radius: 0.6,
        fill: '#ff006e',
        translateX: 1.2,
    }));

    camera.flush();

    // Slow orbit
    let angle = 0;
    const loop = () => {
        angle += 0.005;
        camera.position = [
            Math.sin(angle) * 5,
            1.5,
            Math.cos(angle) * 5,
        ];
        camera.flush();
        animationId = requestAnimationFrame(loop);
    };

    loop();
}

onUnmounted(() => {
    cancelAnimationFrame(animationId);
    currentScene?.destroy();
});
</script>
