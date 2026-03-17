# Installation

Ripl is a modular library split into focused packages so you only ship what you need. Whether you're drawing custom shapes on a canvas, building interactive charts, or experimenting with 3D — you install only the packages your project requires. All packages are written in TypeScript with zero runtime dependencies.

## Packages

| Package | Description |
| --- | --- |
| `@ripl/web` | **Main entry point for browser usage** — re-exports core + canvas context with browser platform bindings |
| `@ripl/svg` | SVG rendering context — swap Canvas for SVG with a single import change |
| `@ripl/charts` | Pre-built chart components — bar, line, area, pie, scatter, and 15+ more |
| `@ripl/3d` | Experimental 3D rendering — shapes, camera, and shading projected onto 2D canvas |
| `@ripl/core` | Core rendering internals (installed automatically as a dependency of `@ripl/web`) |
| `@ripl/utilities` | Shared typed utilities (installed automatically as a dependency) |

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