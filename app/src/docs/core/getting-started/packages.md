# Packages

Ripl is a modular library split into focused packages so you only ship what you need. This page lists every package, its purpose, and a feature matrix to help you decide what to install.

## Overview

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
| `@ripl/vdom` | Virtual DOM utilities used internally by the SVG context |

## What to Install

Most projects only need one or two packages. Here's a quick guide:

- **Drawing shapes in the browser** → `@ripl/web` (includes core + canvas automatically)
- **SVG rendering** → `@ripl/web` + `@ripl/svg`
- **Charts** → `@ripl/web` + `@ripl/charts`
- **3D (Canvas)** → `@ripl/web` + `@ripl/3d`
- **3D (WebGPU)** → `@ripl/web` + `@ripl/3d` + `@ripl/webgpu`
- **Terminal / CLI** → `@ripl/terminal` + `@ripl/node`
- **Terminal charts** → `@ripl/terminal` + `@ripl/node` + `@ripl/charts`

> [!TIP]
> Internal packages (`@ripl/core`, `@ripl/canvas`, `@ripl/dom`, `@ripl/utilities`, `@ripl/vdom`) are installed automatically as dependencies — you never need to install them directly.

## Feature Matrix

The table below shows which features are available with each installable package.

| Feature | `@ripl/web` | `@ripl/svg` | `@ripl/charts` | `@ripl/3d` | `@ripl/webgpu` | `@ripl/terminal` | `@ripl/node` |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Canvas 2D rendering | ✓ | — | — | — | — | — | — |
| SVG rendering | — | ✓ | — | — | — | — | — |
| Terminal (braille) rendering | — | — | — | — | — | ✓ | — |
| WebGPU 3D rendering | — | — | — | — | ✓ | — | — |
| Built-in shapes (circle, rect, etc.) | ✓ | ✓ | — | — | — | ✓ | — |
| 3D shapes (cube, sphere, etc.) | — | — | — | ✓ | ✓ | — | — |
| Scene & renderer | ✓ | ✓ | — | — | — | ✓ | — |
| Animations & transitions | ✓ | ✓ | — | — | — | ✓ | — |
| Pointer events & hit testing | ✓ | ✓ | — | — | — | — | — |
| Scales (continuous, band, log, etc.) | ✓ | ✓ | — | — | — | ✓ | — |
| Color parsing & manipulation | ✓ | ✓ | — | — | — | ✓ | — |
| Gradients (CSS string syntax) | ✓ | ✓ | — | — | — | — | — |
| Charts (bar, line, pie, etc.) | — | — | ✓ | — | — | — | — |
| Camera & projection | — | — | — | ✓ | ✓ | — | — |
| Node.js runtime bindings | — | — | — | — | — | — | ✓ |
| DPR scaling | ✓ | — | — | — | — | — | — |
| MSAA anti-aliasing | — | — | — | — | ✓ | — | — |
| Zero runtime dependencies | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Full TypeScript types | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Tree-shakable | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

> [!NOTE]
> Charts render through a context, so `@ripl/charts` works with any rendering backend — Canvas (`@ripl/web`), SVG (`@ripl/svg`), or Terminal (`@ripl/terminal` + `@ripl/node`).

## Next Steps

Head to [Installation](/docs/core/getting-started/installation) for install commands, or jump straight to the [Tutorial](/docs/core/getting-started/tutorial) to start drawing.
