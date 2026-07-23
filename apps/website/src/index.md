---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

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
  - title: One familiar API
    details: Draw to any context through a single, DOM-like API. Ripl mirrors the DOM and CSSOM — hierarchy, property inheritance, events, styling, and CSS-like querying — so switching between Canvas and SVG is a one-line change.
  - title: Charts & data visualization
    details: 23 ready-made, animated chart types — bar, line, area, pie, scatter, candlestick (OHLC), heatmap, radar, sankey, treemap and more — with axes, legends, tooltips, and crosshairs built in.
  - title: Modular & tree-shakable
    details: Zero runtime dependencies and fully tree-shakable. Ship only the shapes, scales, and contexts you use across Canvas, SVG, Terminal, and WebGPU 3D.
  - title: High performance
    details: Hoisted scene buffers, O(n) rendering, virtual-DOM diffing for SVG, and a cancellable animation engine keep interactive visualizations smooth at scale.
---

## Draw once, render anywhere

Ripl (pronounced "ripple") is a high-performance, zero-dependency graphics library for the web. It gives developers a single, unified API for **2D rendering** and **interactive data visualization** — and renders the exact same scene to **Canvas**, **SVG**, or even the **Terminal** (as braille/ANSI), with **WebGPU** 3D. Build custom shapes, charts, and animations once, then choose the rendering context that fits your use case — no rewrites required.

