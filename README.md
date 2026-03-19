# Ripl

Ripl (pronounced "ripple") is a library that provides a **unified API for 2D graphics rendering** (Canvas & SVG) in the browser, with a focus on high performance and interactive data visualization. It also includes an experimental 3D rendering package.

Working with the canvas API can be notoriously difficult as it is designed to be very low-level. Alternatively, working with SVG is rather straightforward but not without its flaws. Because these paradigms differ widely in their implementations developers often have to choose one or the other at the outset of a project. Ripl alleviates the issue by exposing a unified API and mimicking the DOM/CSSOM in as many ways as possible to make it simple for developers to interact with. Switching between Canvas and SVG is as simple as changing one line of code.

> [!IMPORTANT]
> Ripl is currently in beta `1.0.0-beta.0`.

<div align="center">
  <table>
    <tr>
      <td align="center"><b>Spline Polyline</b><br><img src="./assets/polyline.png" width="300" alt="Spline Curve"/></td>
      <td align="center"><b>3D Sphere</b><br><img src="./assets/sphere.png" width="300" alt="Sphere Rendering"/></td>
      <td align="center"><b>Multi-Line Graph</b><br><img src="./assets/line-chart.png" width="300" alt="Line Chart Analysis"/></td>
    </tr>
    <tr></tr>
    <tr>
      <td align="center"><b>Bubble Scatter</b><br><img src="./assets/scatter-chart.png" width="300" alt="Scatter Plot"/></td>
      <td align="center"><b>Candlestick Chart</b><br><img src="./assets/stock-chart.png" width="300" alt="Stock Market Chart"/></td>
      <td align="center"><b>Jet Engine Model</b><br><img src="./assets/jet-engine.png" width="300" alt="3D Jet Engine"/></td>
    </tr>
  </table>
</div>

## Features

- **Unified rendering API** across Canvas, SVG, and experimental 3D contexts
- **Grouping and property inheritance** — CSS-like cascading of visual properties through the element tree
- **Scene and renderer management** — hoisted scenegraph with O(n) rendering and an automatic `requestAnimationFrame` loop
- **DOM-like event system** — event bubbling, delegation, stop propagation, and disposable subscriptions
- **CSS-like element querying** — `getElementById`, `getElementsByType`, `getElementsByClass`, `query`, `queryAll` with selector syntax
- **Bounding box detection** via `getBoundingBox` on all shape elements
- **Transforms** — translate, scale, rotation, and transform-origin on every element
- **Clipping** — path-based clipping via `Shape2D`
- **Gradient support** — CSS gradient parsing and serialisation (linear, radial, conic)
- **Automatic interpolation** for numbers, colors (RGB, hex, HSL), dates, gradients, paths, strings, and rotation values
- **High performance animation** — cancellable `Task`-based transitions with CSS-like keyframe support and custom interpolators
- **11 scale types** — continuous, discrete, band, diverging, logarithmic, power, quantile, quantize, threshold, time (inspired by D3)
- **18 pre-built chart types** via `@ripl/charts`
- **Built-in shape primitives** — arc, circle, rect, line, polyline, polygon, ellipse, text, path, image
- **3D primitives** (experimental) — cube, sphere, cylinder, cone, plane, torus
- **Easing library** — linear, quad, cubic, quart, quint (in/out/inOut variants)
- **Color utilities** — parsing, serialisation, and color scales
- **Math & geometry** — degree/radian conversion, point operations, border radius normalisation, polygon extrapolation
- **Renderer debug overlay** — FPS counter, element count, bounding box visualisation
- **Completely modular and tree-shakable** — only ship the features you use
- **Strictly typed** in TypeScript
- **Zero runtime dependencies**

## Packages

| Package | Description |
|---------|-------------|
| [`@ripl/web`](packages/web) | **Main entry point for browser usage** — re-exports core + canvas context with browser platform bindings |
| [`@ripl/core`](packages/core) | Core rendering — elements, scene, renderer, animation, scales, math, color, interpolation, gradients, tasks |
| [`@ripl/svg`](packages/svg) | SVG rendering context |
| [`@ripl/charts`](packages/charts) | Pre-built chart components with axes, legends, tooltips, crosshairs, and grids |
| [`@ripl/3d`](packages/3d) | 3D rendering context with camera, shading, and primitive shapes (experimental) |
| [`@ripl/utilities`](packages/utilities) | Shared typed utility functions — type guards, collection helpers, DOM helpers |
| `@ripl/vdom` | Virtual DOM utilities used internally by the SVG context |

The project is structured as a Yarn 4 monorepo:

```
packages/
├── core/         # Core rendering library
├── charts/       # Pre-built chart components
├── svg/          # SVG context implementation
├── 3d/           # 3D rendering (experimental)
├── utilities/    # Shared typed utility functions
└── vdom/         # Virtual DOM utilities
app/              # Documentation site (VitePress) with live demos
```

## Usage

The following is a tour of Ripl's features starting from the most basic and progressively building towards more advanced concepts.

### Render a Basic Element

```typescript
import {
    createCircle,
    createContext,
} from '@ripl/web';

// Create a canvas context bound to a DOM element
const context = createContext('.mount-element');

// Create an element
const circle = createCircle({
    fill: 'rgb(30, 105, 120)',
    lineWidth: 4,
    cx: context.width / 2,
    cy: context.height / 2,
    radius: context.width / 3,
});

// Render the element to the context
circle.render(context);
```

Built-in 2D shape primitives: `arc`, `circle`, `rect`, `line`, `polyline`, `polygon`, `ellipse`, `text`, `path`, `image`.

### Modify Element Properties

To modify an element simply change any of its properties and re-render it.

```typescript
circle.fill = '#FF0000';
circle.cx = context.width / 3;
circle.cy = context.height / 3;
circle.render(context);
```

### Switch Contexts (Canvas / SVG)

To render the same element to SVG, replace the `createContext` import from `@ripl/web` with `@ripl/svg`:

```typescript
import {
    createContext,
} from '@ripl/svg';

import {
    createCircle,
} from '@ripl/web';

const context = createContext('.mount-element');
const circle = createCircle({ /* same options */ });
circle.render(context);
```

### Grouping and Inheritance

Render multiple elements in groups with inherited properties (like CSS) and event bubbling (like the DOM):

```typescript
import {
    createCircle,
    createContext,
    createGroup,
    createRect,
} from '@ripl/web';

const context = createContext('.mount-element');

const circle = createCircle({
    cx: context.width / 2,
    cy: context.height / 2,
    radius: context.width / 3,
});

const rect = createRect({
    x: context.width / 2,
    y: context.height / 2,
    width: context.width / 5,
    height: context.height / 5,
});

// Both children inherit fill and lineWidth from the group
const group = createGroup({
    fill: 'rgb(30, 105, 120)',
    lineWidth: 4,
    children: [circle, rect],
});

group.render(context);
```

### Querying Elements

Elements can be queried using common DOM methods or CSS-like selectors:

```typescript
const circles = parentGroup.getElementsByType('circle');
const shapes = parentGroup.queryAll('.shape');
const first = parentGroup.query('#child-group > .shape');
```

Supported selector features:

```css
circle                                   /* type */
#element-id                              /* id */
.element-class                           /* class */
circle[radius="5"]                       /* attribute */
.group-class circle                      /* descendant */
.group-class > circle                    /* direct child */
.group-class rect + circle.circle-class  /* adjacent sibling */
```

### Scene and Renderer

A `Scene` is the top-level group bound to a rendering context. A `Renderer` drives the animation loop via `requestAnimationFrame`.

```typescript
import {
    createCircle,
    createGroup,
    createRect,
    createRenderer,
    createScene,
} from '@ripl/web';

const circle = createCircle({
    fill: 'rgb(30, 105, 120)',
    cx: 100,
    cy: 100,
    radius: 40,
});

const rect = createRect({
    fill: 'rgb(30, 105, 120)',
    x: 200,
    y: 80,
    width: 60,
    height: 60,
});

// Scene takes a target (selector, element, or context) and options
const scene = createScene('.mount-element', {
    children: [circle, rect],
});

const renderer = createRenderer(scene, {
    autoStart: true,
    autoStop: true,
});

// Listen for events
circle.on('click', event => console.log(event));
```

### Animation

The renderer provides transition-based animation. Transitions are cancellable `Task` instances (extending `Promise` with `AbortController` integration).

```typescript
import {
    easeOutCubic,
} from '@ripl/web';

// Animate a single element
await renderer.transition(circle, {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        fill: '#FF0000',
        cx: 200,
        cy: 200,
        radius: 60,
    },
});

// Animate multiple elements (or a whole group/scene)
await renderer.transition([circle, rect], {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        fill: '#FF0000',
    },
});
```

#### Keyframes

```typescript
// Implicit keyframe offsets
await renderer.transition(circle, {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        fill: [
            '#FF0000', // offset ~0.33
            '#00FF00', // offset ~0.66
            '#0000FF', // offset 1
        ],
    },
});

// Explicit keyframe offsets
await renderer.transition(circle, {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        fill: [
            { value: '#FF0000',
                offset: 0.25 },
            { value: '#0000FF',
                offset: 0.8 },
        ],
    },
});

// Custom interpolator function
await renderer.transition(circle, {
    duration: 1000,
    ease: easeOutCubic,
    state: {
        radius: t => t * 100, // 0 <= t <= 1
    },
});
```

### Transforms

Every element supports CSS-like transforms:

```typescript
const rect = createRect({
    x: 100,
    y: 100,
    width: 80,
    height: 80,
    rotation: '45deg', // or radians as a number
    transformOriginX: '50%', // or pixels as a number
    transformOriginY: '50%',
    translateX: 20,
    translateY: 10,
    transformScaleX: 1.5,
    transformScaleY: 1.5,
});
```

Transforms can also be animated via `renderer.transition`.

## Charts

`@ripl/charts` provides 18 ready-to-use, animated chart types. Each chart supports tooltips, legends, crosshairs, grids, axes, and data update animations out of the box.

| Chart | Factory |
|-------|---------|
| Area | `createAreaChart` |
| Bar | `createBarChart` |
| Chord | `createChordChart` |
| Funnel | `createFunnelChart` |
| Gantt | `createGanttChart` |
| Gauge | `createGaugeChart` |
| Heatmap | `createHeatmapChart` |
| Line | `createLineChart` |
| Pie / Donut | `createPieChart` |
| Polar Area | `createPolarAreaChart` |
| Radar | `createRadarChart` |
| Realtime | `createRealtimeChart` |
| Sankey | `createSankeyChart` |
| Scatter | `createScatterChart` |
| Stock (OHLC) | `createStockChart` |
| Sunburst | `createSunburstChart` |
| Treemap | `createTreemapChart` |
| Trend (Bar + Line) | `createTrendChart` |

Charts are constructed by passing a target element and an options object:

```typescript
import {
    createBarChart,
} from '@ripl/charts';

const chart = createBarChart('.mount-element', {
    data: [
        { category: 'A',
            value: 30 },
        { category: 'B',
            value: 70 },
        { category: 'C',
            value: 45 },
    ],
    keyBy: 'category',
    series: [
        { label: 'Values',
            valueBy: item => item.value },
    ],
});

// Update with new data
chart.update({
    data: [
        { category: 'A',
            value: 50 },
        { category: 'B',
            value: 20 },
        { category: 'C',
            value: 80 },
    ],
});
```

Reusable chart components: `ChartXAxis`, `ChartYAxis`, `Grid`, `Legend`, `Tooltip`, `Crosshair`.

## Scales

Ripl provides 11 scale types for mapping data between domains and ranges, inspired by [D3](https://d3js.org/d3-scale). All scales expose `inverse`, `ticks`, and `includes` methods.

```typescript
import {
    scaleBand,
    scaleContinuous,
    scaleDiscrete,
    scaleDiverging,
    scaleLogarithmic,
    scalePower,
    scaleQuantile,
    scaleQuantize,
    scaleThreshold,
    scaleTime,
} from '@ripl/web';
```

### Continuous (Linear)

```typescript
const scale = scaleContinuous([0, 25], [-100, 100]);
scale(10); // -20
scale.inverse(-20); // 10

// With clamping
const clamped = scaleContinuous([0, 25], [-100, 100], { clamp: true });
clamped(30); // 100
```

### Discrete

```typescript
const scale = scaleDiscrete(['a', 'b', 'c'], [0, 50]);
scale('b'); // 25
```

### Band

```typescript
const scale = scaleBand(['A', 'B', 'C'], [0, 300], {
    innerPadding: 0.1,
    outerPadding: 0.05,
});
scale('B'); // position of band B
scale.bandwidth; // width of each band
```

### Additional Scales

- **`scaleDiverging`** — maps values below and above a midpoint to separate sub-ranges
- **`scaleLogarithmic`** — logarithmic mapping with configurable base
- **`scalePower`** — polynomial mapping with configurable exponent
- **`scaleQuantile`** — maps continuous data to discrete quantile bins
- **`scaleQuantize`** — maps a continuous domain to discrete range values
- **`scaleThreshold`** — maps values to discrete outputs based on threshold boundaries
- **`scaleTime`** — maps `Date` domains to numeric ranges

## 3D Rendering (Experimental)

`@ripl/3d` extends the Canvas context with perspective/orthographic projection, camera controls, and flat shading.

```typescript
import {
    Camera,
    Context3D,
    createCube,
    createSphere,
} from '@ripl/3d';
```

Available 3D primitives: `cube`, `sphere`, `cylinder`, `cone`, `plane`, `torus`.

Camera supports interactive zoom, pivot, and pan with configurable sensitivity.

## Performance

1. **Scene + Renderer** — elements in a scene are hoisted into a flat buffer, converting render traversal from O(n^c) to O(n). The cost shifts to adding/removing elements from groups.
2. **Persistent path keys** — always pass a stable ID to `context.createPath(id)` so SVG contexts can efficiently diff DOM elements between frames.
3. **Memory lifecycle** — call `destroy()` on elements, scenes, and renderers when done to clean up subscriptions and DOM references.
4. **Auto-stop** — the renderer stops ticking when idle (no active transitions and mouse has left the canvas) to avoid unnecessary CPU usage.
5. **Debug overlay** — enable `{ debug: true }` on the renderer to visualise FPS, element count, and bounding boxes during development.

## Development

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Run tests
yarn test

# Lint
yarn lint
```

## License

[MIT](LICENSE)
