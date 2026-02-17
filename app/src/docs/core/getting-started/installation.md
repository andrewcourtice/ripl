# Installation

Ripl is split into separate packages so you only ship what you use. The core package provides all the essential drawing primitives and a Canvas rendering context. Additional contexts (like SVG) are provided as separate packages.

## Packages

| Package | Description |
| --- | --- |
| `@ripl/core` | Core library — elements, shapes, groups, scenes, renderer, canvas context, animation, interpolation |
| `@ripl/svg` | SVG rendering context |
| `@ripl/utilities` | Internal utilities (installed automatically as a dependency) |

## Install

Install the core package to get started:

:::tabs
== npm
```bash
npm install @ripl/core
```
== yarn
```bash
yarn add @ripl/core
```
== pnpm
```bash
pnpm add @ripl/core
```
:::

If you also want SVG rendering support, install the SVG package:

:::tabs
== npm
```bash
npm install @ripl/svg
```
== yarn
```bash
yarn add @ripl/svg
```
== pnpm
```bash
pnpm add @ripl/svg
```
:::

> [!TIP]
> `@ripl/svg` depends on `@ripl/core`, so if you install both, the core package will be shared automatically.

## TypeScript

Ripl is written in TypeScript and ships with full type definitions out of the box. No additional `@types` packages are needed.

## Next Steps

Head over to the [Tutorial](/docs/core/getting-started/tutorial) to start drawing your first elements.