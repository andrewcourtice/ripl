---
title: About
description: "Ripl is a zero-dependency TypeScript library for 2D drawing, animation and data visualisation, rendering one scene to Canvas, SVG, the terminal or WebGPU 3D."
---

# About

Ripl (pronounced *ripple*) is a library that provides a unified API for 2D graphics rendering. Write your drawing code once and render it to **Canvas**, **SVG**, **Terminal**, or any custom context. Switching between them is a single line change.

While Ripl has a focus on interactive data visualization, it is a general-purpose 2D drawing and animation library that can be used for any kind of graphics work: charts and dashboards, diagrams, freeform drawing canvases, generative art, games, engineering visualisations, and 3D scenes built from primitives.

## Features

Everything below ships today. Each group links to the page that documents it in full.

### Rendering contexts

Ripl draws through a `Context` abstraction, so one scene renders anywhere the library has a backend.

- **Canvas 2D** (`@ripl/canvas`) — immediate-mode raster rendering with a hoisted render buffer. See [Canvas](/docs/core/contexts/canvas).
- **SVG** (`@ripl/svg`) — vector output built on a virtual tree that reconciles against the real SVG DOM, so each render mutates only what changed. See [SVG](/docs/core/contexts/svg).
- **Terminal** (`@ripl/terminal`) — draws to Unicode braille cells with ANSI colour, including transforms, clipping, hit testing and rotated text. See [Terminal](/docs/core/contexts/terminal).
- **Node.js** (`@ripl/node`) — server-side rendering with no DOM emulation, for terminal output and image capture off the browser. See [Node](/docs/core/contexts/node).
- **3D on Canvas** (`@ripl/3d`) — a software 3D renderer with a camera, projection and shading. See [3D](/docs/3d/).
- **3D on WebGPU** (`@ripl/webgpu`) — GPU rendering with WGSL shaders, hardware depth testing and 4× MSAA. See [WebGPU](/docs/3d/contexts/webgpu).
- **Custom contexts** — implement the context interface to target anything else. See [Custom Contexts](/docs/core/advanced/custom-contexts).

### Drawing primitives

- **Ten built-in elements** — [arc](/docs/core/elements/arc), [circle](/docs/core/elements/circle), [ellipse](/docs/core/elements/ellipse), [image](/docs/core/elements/image), [line](/docs/core/elements/line), [path](/docs/core/elements/path), [polygon](/docs/core/elements/polygon), [polyline](/docs/core/elements/polyline), [rect](/docs/core/elements/rect) and [text](/docs/core/elements/text).
- **Thirteen polyline curve algorithms** — linear, spline, basis, bump-x, bump-y, cardinal, catmull-rom, monotone-x, monotone-y, natural, step, step-before and step-after, plus any render function you supply.
- **Path parsing** — SVG path data is parsed once and replayed against whichever context is active.
- **Custom elements** — define your own shape with the same lifecycle, styling and hit testing as the built-ins. See [Custom Elements](/docs/core/advanced/custom-elements).
- **Full stroke and fill styling** — line width, cap, join, dash arrays and offset, miter limit, opacity, blend modes, CSS filter strings, shadows and text metrics.

### Scene graph

- **DOM-like hierarchy** — [elements](/docs/core/essentials/element) and [shapes](/docs/core/essentials/shape) nest inside arbitrarily deep [groups](/docs/core/essentials/group).
- **Style inheritance** — children inherit presentation properties from their parent groups, in the manner of CSS.
- **CSS-like querying** — `getElementById`, `getElementsByType` and `getElementsByClass`, plus `query`, `queryAll`, `matches` and `closest` with selector strings.
- **Bounding boxes** — `getBoundingBox()` on every shape, for layout, hit regions and fitting a view.
- **Scene** — hoists the tree into a flat render buffer so a frame costs O(n) in elements, not in tree depth. See [Scene](/docs/core/essentials/scene).
- **Renderer** — drives frames through `requestAnimationFrame` and stops itself when nothing is animating. See [Renderer](/docs/core/essentials/renderer).
- **Transforms** — translate, scale, rotate and skew with configurable transform origins, on any element or group. See [Transforms](/docs/core/essentials/transforms).
- **Clip paths** — clip any subtree to an arbitrary shape. See [Clip Paths](/docs/core/advanced/clip-paths).

### Animation

- **Transitions** — animate any property over time and `await` the result; every transition is cancelable. See [Animations](/docs/core/advanced/animations).
- **Keyframes** — CSS-like keyframe sequences with per-keyframe offsets.
- **Thirty-one easing functions** — linear plus quad, cubic, quart, quint, sine, expo, circ, back, elastic and bounce, each in in/out/in-out form, alongside custom easing functions.
- **Type-aware interpolation** — numbers, colours, gradients, pattern fills, dates, point arrays and border radii are detected and interpolated without configuration; anything else falls back to a generic interpolator. See [Interpolators](/docs/core/advanced/interpolators).
- **Point-set morphing** — outlines tween between point arrays of differing length, matched by key so a curve stays curved across the transition.

### Interaction

- **Event system** — bubbling, delegation and `stopPropagation` across the element tree. See [Events](/docs/core/advanced/events).
- **Pixel-accurate hit testing** — pointer events resolve to the element actually drawn under the cursor, on Canvas, SVG and in the terminal.
- **Navigator** — pan, zoom and brush over a viewport, rescaling scale domains rather than scaling geometry, so strokes and text stay crisp at any zoom. See [Navigator](/docs/core/advanced/navigator).

### Data mapping

- **Fourteen scale types** — linear, band, point, discrete, ordinal, diverging, logarithmic, power, symlog, quantile, quantize, threshold, radial and time. See [Scales](/docs/core/advanced/scales).
- **Geometry and math** — points, angles, distances, bounding boxes, matrices and polar conversion. See [Math & Geometry](/docs/core/advanced/math).

### Colour and paint

- **Colour parsing and serialisation** — hex, `rgb()`, `rgba()`, `hsl()`, `hsv()` and the full set of CSS colour keywords. See [Color](/docs/core/advanced/color).
- **Colour manipulation** — alpha, conversion between colour spaces and channel-wise interpolation.
- **Colour scales and schemes** — sequential and categorical scales for encoding data as colour.
- **Gradients** — linear, radial and conic gradients, including repeating variants, parsed from CSS gradient strings so they interpolate and inherit like any other style. See [Gradients](/docs/core/advanced/gradients).
- **Pattern fills** — diagonal, cross-hatch, dot, horizontal and vertical tiles, usable in both fills and strokes. See [Pattern Fills](/docs/core/advanced/pattern-fills).

### Charts

- **Twenty-five chart types** — line, bar, area, trend, scatter, histogram, box plot, stock (candlestick/OHLC), realtime, pie/donut, polar area, polar scatter, radial bar, radar, gauge, heatmap, treemap, sunburst, packed circle, sankey, chord, arc diagram, force-directed, funnel and gantt. See [Charts](/charts/).
- **Chart components** — axes, grids, legends, colour legends, tooltips, crosshairs, titles, annotations and a windowing navigator strip.
- **Reactive updates** — `chart.update(options)` diffs the data and animates elements in, out and across.
- **Theming** — light and dark themes with per-chart overrides. See [Theming](/charts/advanced/theming).
- **Rendering targets** — the same chart renders to Canvas or SVG, and to the terminal or a server. See [Server-Side Rendering](/charts/advanced/server-side-rendering).

### 3D

- **Six primitives** — cube, sphere, cylinder, cone, plane and torus. See [3D](/docs/3d/).
- **Camera** — perspective and orthographic projection, with orbit, pan and zoom interaction. See [Camera](/docs/3d/essentials/camera).
- **Shading** — flat shading computed from face normals against a configurable light direction. See [Shading](/docs/3d/essentials/shading).
- **Vector and matrix math** — the projection pipeline is exported, not hidden.

### Export

- **`context.export()`** — `toString()` for a PNG data URL, SVG markup or braille text, `toURL()` for an openable blob URL, and `toImage()` for raw `ImageData`.
- **Charts forward `export()`** to their context, so any chart can be saved or opened directly.

### Tooling and platform

- **Devtools** — a browser extension and runtime bridge with an element tree, a property inspector, and an event timeline you can scrub and filter. See [Devtools](/docs/core/advanced/devtools).
- **Renderer debug overlay** — an FPS counter, a live element count and bounding-box visualisation, toggled per overlay.
- **Playground** — an in-browser editor for 2D and 3D scenes. See [Playground](/playground).
- **Strict TypeScript** — the entire codebase is strictly typed and ships its own declarations.
- **Zero runtime dependencies** — nothing is pulled in at runtime.
- **Tree-shakable** — split into focused packages, so you ship only the elements, scales and contexts you use.

## Motivation

The Canvas API is difficult to work with because it is so low-level: there is no concept of objects, hierarchy, or events. SVG is more straightforward but comes with its own performance limitations and API differences. Because these paradigms differ so widely, developers often have to commit to one or the other at the start of a project.

Ripl was created to solve this problem by providing a single, unified API that abstracts away the differences between rendering contexts while still giving you full control over what gets drawn and how.

## Inspiration

Ripl takes inspiration from several great projects, combining the best ideas from each into a single cohesive library.

### Browser DOM/CSSOM
- **Structure and hierarchy**: elements can be organized into groups and nested arbitrarily
- **Style inheritance**: child elements inherit styles from their parent groups
- **Event propagation**: events bubble up through the element tree just like the DOM
- **Querying**: find elements by type, id, class, or CSS-like selector strings

### D3
- **Scales**: linear, discrete, band, and point scales for mapping data to visual properties
- **Interpolation**: automatic interpolation between values of different types
- **Geometry**: math utilities for points, angles, and bounding boxes

### Two.js
- **Context agnostic rendering**: a single API that renders to Canvas, SVG, or any custom context
