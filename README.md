# Ripl

Ripl (pronounced ripple) is a library that provides a unified API for 2D graphics rendering (canvas & SVG) in the browser with a focus towards high performance and interactive data visualization.

Working with the canvas API can be notoriously difficult as it is designed to be very low-level. Alternatively, working with SVG is rather straightforward but not without its flaws. Because these paradigms differ widely in their implementations developers often have to choose one or the other at the outset of a project. Ripl alleviates the issue of choosing between these mediums by exposing a unified API and mimicking the DOM/CSSOM in as many ways possible to make it simple for developers to interact with. Switching between Canvas and SVG is as simple as changing 1 line of code.

Ripl also exposes a number of methods such as scales, geometry, interpolation, color, data joining and easing to assist with drawing (inspired by D3).

## Features

- Unified API for drawing to different contexts
- Grouping and property inheritance
- Scene and renderer management
- Event bubbling, delegation and stop propagation (mimics the DOM as much as possible. Capture phase only)
- Powerful element querying (`getElementById`, `getElementsByType`, `getElementsByClass`) including CSS selector style querying via `query` and `queryAll`
- Element bounds detection with `getBoundingBox`
- Automatic interpolation for known property types (ie. can interpolate numbers, points, colors between RGB and Hex etc.)
- Point extrapolation for shape morphing (currently only supports regular polygons)
- High performance async animation including CSS-like keyframe animation support and custom interpolators
- Several built-in shape primitives such as arc, circle, rect, line, polyline, text, ellipse, and polygon
- Hoisted scenegraph to optimize render performance when using scenes. See [performance](#performance)
- Completely modular and tree-shakable. Only ship the features that you use.
- Strictly typed in TypeScript
- Zero runtime dependencies

Currently unsupported features are: gradients, transforms, clipping.

> [!IMPORTANT]
> Ripl is currently in the early stages of development and, as a result, not yet published to NPM.

## Example

Here are a few proof-of-concept data-visualization examples created using Ripl:

### Multi-Series Trend Chart (Bar/Line)

- [Demo](https://ripl-alpha.vercel.app/docs/charts/trend.html)
- [Source](https://github.com/andrewcourtice/ripl/blob/main/packages/charts/src/charts/trend.ts)
  
  ![trend 1](https://github.com/andrewcourtice/ripl/assets/11718453/797ed163-614d-4783-998c-383070c7edf5)

### Donut Chart with Hover Effects

- [Demo](https://ripl-alpha.vercel.app/docs/charts/pie.html)
- [Source](https://github.com/andrewcourtice/ripl/blob/main/packages/charts/src/charts/pie.ts)
  
  ![donut](https://github.com/andrewcourtice/ripl/assets/11718453/15a38877-48cc-462c-9d57-8227afa5f7d0)

## Usage

The following is a tour of Ripl's features starting from the most basic and progressively building towards more advanced concepts.

### Render a Basic Element

Here's a basic example of rendering an element.

```typescript
import {
    createContext,
    createCircle,
} from '@ripl/core';

// Create a context to render the content to
// Ripl uses a canvas context by default
const context = createContext('.mount-element');

// Create an element
const circle = createCircle({
    fillStyle: 'rgb(30, 105, 120)',
    lineWidth: 4,
    cx: context.width / 2,
    cy: context.height / 2,
    radius: context.width / 3
});

// Render the element to the context
circle.render(context);
```

Ripl has a number of built-in elements such as arc, circle, rect, line, polyline, text, ellipse, and polygon. See [here](https://github.com/andrewcourtice/ripl/tree/5a60425a5f12fd34e8b4fe2864ebf9a66b03d212/packages/core/src/elements) for all available built-in elements.

### Modify Element Properties

To modify an element simply change any of it's properties and re-render it.

```typescript
import {
    createContext,
    createCircle,
} from '@ripl/core';

const context = createContext('.mount-element');
const circle = createCircle({
    fillStyle: 'rgb(30, 105, 120)',
    lineWidth: 4,
    cx: context.width / 2,
    cy: context.height / 2,
    radius: context.width / 3
});

function render() {
    circle.render(context);
}

function update() {
    circle.fillStyle = '#FF0000';
    circle.cx = context.width / 3;
    circle.cy = context.height / 3;

    render();
}
```

### Render to Different Contexts (eg. SVG)

To render the same element to SVG (or any other context) simply replace the import of the `createContext` method from `@ripl/core` to the appropriate package, in this case `@ripl/svg`. Here's the same example above rendered to SVG:

```typescript
import {
    createContext
} from '@ripl/svg';

import {
    createCircle,
} from '@ripl/core';

const context = createContext('.mount-element');
const circle = createCircle({
    fillStyle: 'rgb(30, 105, 120)',
    lineWidth: 4,
    cx: context.width / 2,
    cy: context.height / 2,
    radius: context.width / 3
});

function render() {
    circle.render(context);
}

function update() {
    circle.fillStyle = '#FF0000';
    circle.cx = context.width / 3;
    circle.cy = context.height / 3;

    render();
}
```

### Grouping and Inheritance

Ripl can also render multiple elements in groups with inherited properties (like CSS) and events (DOM event bubbling):

```typescript
import {
    createContext,
    createCircle,
    createRect,
    createGroup
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    cx: context.width / 2,
    cy: context.height / 2,
    radius: context.width / 3
});

const rect = createRect({
    x: context.width / 2,
    y: context.height / 2,
    width: context.width / 5,
    height: context.height / 5,
});

const group = createGroup({
    fillStyle: 'rgb(30, 105, 120)',
    lineWidth: 4,
    children: [
        circle,
        rect
    ]
});

group.render(context);
```

### Querying Elements

Elements can be queried in groups using common DOM methods such as `getElementById`, `getElementsByType`, and `getElementsByClass`. Elements can also be queried using a subset of the CSS selector syntax with `query` and `queryAll`.

```typescript
import {
    createContext,
    createCircle,
    createRect,
    createGroup
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    class: 'shape',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: context.width / 3
});

const rect = createRect({
    class: 'shape',
    x: context.width / 2,
    y: context.height / 2,
    width: context.width / 5,
    height: context.height / 5,
});

const childGroup = createGroup({
    id: 'child-group',
    fillStyle: 'rgb(30, 105, 120)',
    lineWidth: 4,
    children: [
        circle,
        rect
    ]
});

const parentGroup = createGroup({
    id: 'parent-group',
    children: childGroup
});

parentGroup.render(context);

function query() {
    const qCircle = parentGroup.getElementsByType('circle');
    const qRect = parentGroup.getElementsByType('rect');
    const qChildren = parentGroup.queryAll('.shape');
    const qChild = parentGroup.query('.child-group > .shape');
}
```

The query selector currently only supports a limited subset of features compared to the DOM. Here are some examples of supported queries:
```css
// type
circle

// id
#element-id

// class
.element-class

// element properties (attributes)
circle[radius="5"]

// descendents
.group-class circle
.group-class > circle
.parent-class .child-class rect
.group-class rect + circle.circle-class
.group-class > rect[x="50"]
```

### Scene Management

Ripl also provides complete scene management for rendering large group structures with events.

```typescript
import {
    createContext,
    createCircle,
    createRect,
    createGroup,
    createScene
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    class: 'shape',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: context.width / 3
});

const rect = createRect({
    class: 'shape',
    x: context.width / 2,
    y: context.height / 2,
    width: context.width / 5,
    height: context.height / 5,
});

const childGroup = createGroup({
    id: 'child-group',
    fillStyle: 'rgb(30, 105, 120)',
    lineWidth: 4,
    children: [
        circle,
        rect
    ]
});

const parentGroup = createGroup({
    id: 'parent-group',
    children: childGroup
});

const scene = createScene({
    children: parentGroup
})

scene.render(context);
circle.on('click', event => console.log(event));
```

### Basic Animation and Interactivity

Interactivity and animation can be added by using a renderer. The renderer provides an automatic render loop to re-render a scene at the ideal framerate.

```typescript
import {
    createContext,
    createCircle,
    createRect,
    createGroup,
    createScene,
    easeOutCubic
} from '@ripl/core';

const context = createContext('.mount-element');

const circle = createCircle({
    fillStyle: 'rgb(30, 105, 120)',
    cx: context.width / 2,
    cy: context.height / 2,
    radius: context.width / 3
});

const rect = createRect({
    fillStyle: 'rgb(30, 105, 120)',
    x: context.width / 2,
    y: context.height / 2,
    width: context.width / 5,
    height: context.height / 5,
});

const scene = createScene({
    children: [
        circle,
        rect
    ]
});

const renderer = createRenderer(scene, {
    autoStart: true,
    autoStop: true
});

async function animate() {
    // Render one
    await renderer.transition(circle, {
        duration: 1000,
        ease: easeOutCubic,
        state: {
            fillStyle: '#FF0000',
            cx: context.width / 4,
            cy: context.height / 4,
            radius: context.width / 4
        }
    });

    // Render many with common properties
    // Alternatively you could transition a whole group or scene
    await renderer.transition([circle, rect], {
        duration: 1000,
        ease: easeOutCubic,
        state: {
            fillStyle: '#FF0000',
        }
    });
}
```

### Advanced Animation

Ripl also supports CSS-like animation keyframes and custom interpolator functions

```typescript
// ...

async function animate() {
    // Implicit keyframe offsets
    await renderer.transition([circle, rect], {
        duration: 1000,
        ease: easeOutCubic,
        state: {
            fillStyle: [
                '#FF0000', // implied 0.33 offset
                '#00FF00', // implied 0.66 offset
                '#0000FF', // implied end state - offset 1
            ],
        }
    });

    // Explicit keyframe offsets
    await renderer.transition([circle, rect], {
        duration: 1000,
        ease: easeOutCubic,
        state: {
            fillStyle: [
                {
                    value: '#FF0000',
                    offset: 0.25
                },
                {
                    value: '#0000FF',
                    offset: 0.8
                }
            ],
        }
    });

    // Custom interpolator
    await renderer.transition(circle, {
        duration: 1000,
        ease: easeOutCubic,
        state: {
            radius: t => t * context.width / 2 // where 0 <= t <= 1 (depending on the ease function)
        }
    });
}
```

## Utilities

Ripl provides a number of utilities to enable rapid and straightforward developement of data visualizations.

### Scales

Ripl currently provides 3 scale types (with more coming in the future) for mapping data between a specified domain and range. These scales are heavily influnced by [D3](https://d3js.org/d3-scale).

#### Continuous (aka linear)

Map continuous linear data from a given domain to a specified range.

```typescript
const scale = scaleContinuous([0, 25], [-100, 100]);
const value = scale(10); // -20
```

Linear scales can also be clamped and inverted.

```typescript
const scale = scaleContinuous([0, 25], [-100, 100], {
    clamp: true
});

// With clamping
scale(25) // 100
scale(30) // 100 (clamped)

// Invert
scale.inverse(-20) // 10
```

#### Discrete

Map discrete domain data to a continuous range.

```typescript
const scale = scaleDiscrete(['a', 'b', 'c'], [0, 50]);
const value = scale('b'); // 25
```

## Performance

Ripl is designed to be as performant as possible, however, here are a few tips for getting the best performance out of it:

1. **Using a scene + renderer to render many elements/groups** - When elements are placed into a scene and rendered using a renderer the elements are "hoisted" into a flat list essentially converting the render time from an O(n^c) operation to O(n). The performance cost is instead shifted to adding/removing elements from groups within the scenegraph.
2. **Using persistent keys when creating paths in custom elements** - When creating a new path/text within a custom element it is highly encouraged to specify a persistent key for the path. The persistent key ensures that custom contexts such as svg can efficiently diff created objects with the DOM in each frame. This effectively reduces the amount of DOM elements that are required to be created/destroyed each frame. See an example of a persistent path key [here](https://github.com/andrewcourtice/ripl/blob/1a33451da6f1a3b5163b41189c00c0cce116accd/packages/core/src/core/shape.ts#L73).
