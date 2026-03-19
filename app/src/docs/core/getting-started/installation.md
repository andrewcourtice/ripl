# Installation

Ripl is a modular library split into focused packages so you only ship what you need. Whether you're drawing custom shapes on a canvas, building interactive charts, or experimenting with 3D — you install only the packages your project requires. All packages are written in TypeScript with zero runtime dependencies.

## Packages

| Package | Description |
| --- | --- |
| `@ripl/web` | **Main browser entry point** — re-exports core + canvas context with browser platform bindings |
| `@ripl/core` | Core rendering internals — elements, scene, renderer, animation, scales, math, color, interpolation |
| `@ripl/canvas` | Canvas 2D rendering context |
| `@ripl/svg` | SVG rendering context — swap Canvas for SVG with a single import change |
| `@ripl/webgpu` | WebGPU-accelerated 3D rendering context with hardware depth testing and WGSL shaders |
| `@ripl/charts` | Pre-built chart components — bar, line, area, pie, scatter, stock, gantt, and 10+ more |
| `@ripl/3d` | 3D rendering — shapes, camera, shading, and projection onto 2D contexts |
| `@ripl/terminal` | Terminal rendering context — braille-character output with ANSI truecolor |
| `@ripl/node` | Node.js runtime bindings — configures the platform factory for headless environments |
| `@ripl/dom` | DOM utilities used internally by browser contexts |
| `@ripl/utilities` | Shared typed utility functions used across all packages |

### What to Install

Most projects only need one or two packages. Here's a quick guide:

- **Drawing shapes in the browser** → `@ripl/web` (includes core + canvas automatically)
- **SVG rendering** → `@ripl/web` + `@ripl/svg`
- **Charts** → `@ripl/web` + `@ripl/charts`
- **3D (Canvas)** → `@ripl/web` + `@ripl/3d`
- **3D (WebGPU)** → `@ripl/web` + `@ripl/3d` + `@ripl/webgpu`
- **Terminal / CLI** → `@ripl/terminal` + `@ripl/node`
- **Terminal charts** → `@ripl/terminal` + `@ripl/node` + `@ripl/charts`

> [!TIP]
> Internal packages (`@ripl/core`, `@ripl/canvas`, `@ripl/dom`, `@ripl/utilities`) are installed automatically as dependencies — you never need to install them directly.

## Install

Install the main package to get started:

:::tabs
== npm
```bash
npm install @ripl/web
```
== yarn
```bash
yarn add @ripl/web
```
== pnpm
```bash
pnpm add @ripl/web
```
:::

### Additional Packages

Install any combination of additional packages as needed:

:::tabs
== npm
```bash
# SVG rendering
npm install @ripl/svg

# Charts
npm install @ripl/charts

# 3D (experimental)
npm install @ripl/3d
```
== yarn
```bash
# SVG rendering
yarn add @ripl/svg

# Charts
yarn add @ripl/charts

# 3D (experimental)
yarn add @ripl/3d
```
== pnpm
```bash
# SVG rendering
pnpm add @ripl/svg

# Charts
pnpm add @ripl/charts

# 3D (experimental)
pnpm add @ripl/3d
```
:::

> [!TIP]
> All packages depend on `@ripl/core` internally, so the core library is always shared automatically — no need to install it separately.

## CDN

You can also load Ripl directly from a CDN for quick prototyping or non-bundled environments:

```html
<!-- Core + Canvas -->
<script type="module">
import { createContext, createCircle } from 'https://esm.sh/@ripl/web';

const context = createContext('#canvas');
createCircle({ fill: '#3a86ff', cx: 100, cy: 100, radius: 40 }).render(context);
</script>

<!-- Charts -->
<script type="module">
import { createBarChart } from 'https://esm.sh/@ripl/charts';
</script>

<!-- SVG -->
<script type="module">
import { createContext } from 'https://esm.sh/@ripl/svg';
</script>
```

> [!TIP]
> CDN imports work best for prototyping. For production apps, use a bundler to benefit from tree-shaking and smaller bundle sizes.

## TypeScript

Ripl is written in TypeScript and ships with full type definitions out of the box. No additional `@types` packages are needed. The library targets ES2023 and uses strict mode throughout.

## Next Steps

Head over to the [Tutorial](/docs/core/getting-started/tutorial) to start drawing your first elements, or jump straight to [Charts](/docs/charts/) if you're building data visualizations.