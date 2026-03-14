---
title: Migration Guide
---

# Migration from Context3D to WebGPU

Migrating an existing `@ripl/3d` application to use WebGPU requires minimal changes.

## 1. Install the package

```bash
npm install @ripl/webgpu
```

## 2. Swap the context import

**Before:**
```ts
import { createContext } from '@ripl/3d';
const context = createContext('#app');
```

**After:**
```ts
import { createContext } from '@ripl/webgpu';
const context = await createContext('#app');
```

> [!IMPORTANT]
> `createContext` from `@ripl/webgpu` is **async** — it returns a `Promise<WebGPUContext3D>`. You must `await` it.

## 3. Everything else stays the same

- `createScene(context)` — works unchanged
- `createCamera(scene, options)` — works unchanged
- `createRenderer(scene)` — works unchanged
- All `Shape3D` elements — work unchanged
- Event handlers (`mouseenter`, `mouseleave`, etc.) — work unchanged
- Transitions and animations — work unchanged

## What changes under the hood

| Aspect | Context3D (Canvas 2D) | WebGPUContext3D |
|--------|----------------------|-----------------|
| Depth sorting | CPU painter's algorithm | Hardware depth buffer |
| Rasterisation | Canvas 2D fill/stroke | GPU fragment shader |
| Shading | CPU per-face colour | GPU per-fragment Lambertian |
| Anti-aliasing | None (canvas default) | 4× MSAA |
| Intersecting geometry | May render incorrectly | Correct via depth test |

## Fallback

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
