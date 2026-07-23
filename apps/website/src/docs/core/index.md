---
title: About
description: Ripl core is a unified, zero-dependency TypeScript API for 2D graphics rendering across Canvas, SVG, and Terminal. Elements, scenes, renderer, animation, 11 scale types, color, gradients, and interpolation.
---

# About

Ripl (pronounced *ripple*) is a library that provides a unified API for 2D graphics rendering. Write your drawing code once and render it to **Canvas**, **SVG**, **Terminal**, or any custom context. Switching between them is a single line change.

While Ripl has a focus on interactive data visualization, it is a general-purpose 2D drawing library that can be used for any kind of graphics work.

## Features

- **Simple**: Ripl's API is designed to feel familiar. If you've worked with the DOM or CSS, you'll feel right at home with concepts like element hierarchy, style inheritance, event propagation, and CSS-like querying.
- **Context agnostic**: Write your drawing code once and render to Canvas, SVG, Terminal, or any custom rendering context. Switching contexts is as simple as changing one import.
- **Modular**: Ripl is fully tree-shakable, so you only ship the features you actually use. Core primitives, SVG support, and charts are all separate packages.
- **Performant**: Scenes hoist elements into a flat render buffer for O(n) rendering. The renderer uses `requestAnimationFrame` with automatic start/stop to avoid unnecessary work.
- **Animated**: Built-in interpolation for numbers, colors, gradients, points, and more, with CSS-like keyframe animations, custom easing functions, and awaitable transitions.
- **Interactive**: A full event system with bubbling, delegation, and `stopPropagation`. Pointer events are tracked per-element with pixel-accurate hit testing.
- **Typed**: Written entirely in TypeScript with strict types throughout.
- **Zero dependencies**: No runtime dependencies at all.

## Motivation

The Canvas API is notoriously difficult to work with because it is so low-level: there is no concept of objects, hierarchy, or events. Alternatively, SVG is more straightforward but comes with its own performance limitations and API differences. Because these paradigms differ so widely, developers often have to commit to one or the other at the start of a project.

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