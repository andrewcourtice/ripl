---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
title: "Ripl: charting, drawing and animation for Canvas, SVG, terminal and 3D"
titleTemplate: false
description: "Ripl is a zero-dependency TypeScript charting, drawing and animation library. 25 chart types and a full 2D drawing API, rendered to Canvas, SVG, the terminal or WebGPU 3D."

hero:
  name: "Ripl"
  text: "One API. Any Context."
  tagline: "A unified, zero-dependency TypeScript library for drawing and animating 2D graphics, charts, and data visualizations across Canvas, SVG, Terminal, and WebGPU."
  actions:
    - theme: brand
      text: Get Started
      link: /docs/core/getting-started/installation
    - theme: alt
      text: Charts
      link: /charts/
    - theme: alt
      text: 3D
      link: /docs/3d/
    - theme: alt
      text: Demos
      link: /demos/

features:
  - title: Charting library
    details: 25 animated, interactive chart types, including bar, line, area, pie, scatter, candlestick (OHLC), histogram, box plot, heatmap, radar, sankey, treemap, sunburst, gauge, gantt and force-directed, with axes, legends, tooltips and crosshairs.
  - title: Drawing & animation library
    details: Ten drawing primitives, 13 curve algorithms, gradients, pattern fills and clip paths, animated with keyframes, 31 easing functions and type-aware interpolation across numbers, colours, points and paths.
  - title: One familiar API
    details: Draw to any context through a single, DOM-like API. Ripl mirrors the DOM and CSSOM (hierarchy, property inheritance, events, styling, and CSS-like querying), so switching between Canvas and SVG is a one-line change.
  - title: Terminal & 3D rendering
    details: Render the same scene to Unicode braille and ANSI colour in a terminal, to a Node process for server-side output, or to 3D geometry on Canvas and WebGPU with a camera, shading and WGSL shaders.
---

## Draw once, render anywhere

Ripl (pronounced "ripple") is a high-performance, zero-dependency graphics library for the web. It gives developers a single, unified API for **2D drawing**, **animation** and **interactive data visualization**, and it renders the exact same scene to **Canvas**, **SVG**, or even the **Terminal** (as braille/ANSI), with **WebGPU** 3D. Build custom shapes, charts, and animations once, then choose the rendering context that fits your use case. No rewrites required.

### A charting library

`@ripl/charts` ships 25 chart types on top of the core renderer: line, bar, area, trend, scatter, histogram, box plot, stock (candlestick/OHLC), realtime, pie and donut, polar area, polar scatter, radial bar, radar, gauge, heatmap, treemap, sunburst, packed circle, sankey, chord, arc diagram, force-directed, funnel and gantt. Each one animates its data transitions, responds to pointer events, resizes with its container, and renders to Canvas or SVG from the same options object. [Browse the charts](/charts/).

### A drawing and animation library

Underneath the charts is a general-purpose 2D drawing API: arcs, circles, ellipses, images, lines, paths, polygons, polylines, rectangles and text, arranged in a scene graph that inherits styles and bubbles events the way the DOM does. Animate any property with keyframes, easing and awaitable transitions, or morph one path into another. [Read the tutorial](/docs/core/getting-started/tutorial).

### Terminal rendering

`@ripl/terminal` rasterises the same scene into Unicode braille cells with ANSI colour, including transforms, clipping, hit testing and rotated text. Charts and drawings you already wrote run in a TUI or over SSH without changing your code. [See the terminal context](/docs/core/contexts/terminal).

### 3D rendering

`@ripl/3d` builds 3D scenes from cubes, spheres, cylinders, cones, planes and tori, with a perspective or orthographic camera, orbit controls and flat shading. `@ripl/webgpu` renders the same scenes on the GPU with WGSL shaders, hardware depth testing and 4× MSAA. [Explore 3D](/docs/3d/).
