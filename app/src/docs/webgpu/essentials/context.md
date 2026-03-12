---
title: WebGPU Context
---

# WebGPU Context

The `WebGPUContext3D` class extends the base `Context<HTMLCanvasElement>` and provides GPU-accelerated 3D rendering via WebGPU.

## Creating a Context

Unlike the synchronous `createContext` from `@ripl/3d`, the WebGPU factory is **async** because it must negotiate a GPU adapter and device:

```ts
import { createContext } from '@ripl/webgpu';

const context = await createContext('#app', {
    fov: 60,
    near: 0.1,
    far: 1000,
    sampleCount: 4,
    clearColor: [0, 0, 0, 0],
});
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
context.viewMatrix;           // Matrix4
context.projectionMatrix;     // Matrix4
context.viewProjectionMatrix; // Matrix4
context.lightDirection;       // Vector3 (read/write)
context.lightMode;            // 'world' | 'camera' (read/write)
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
