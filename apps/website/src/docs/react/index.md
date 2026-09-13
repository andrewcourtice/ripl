---
title: Introduction
description: "@ripl/react wraps Ripl in declarative React components, so a scene graph is JSX: props drive element state, your own state drives the graph, and <RiplTransition> animates it."
---

# React

The `@ripl/react` package lets you describe a Ripl scene as JSX instead of building it imperatively. Every built-in element is a component, props map onto element state, and your own state drives the graph. Hooks give you the underlying context, scene, renderer and element whenever the declarative surface is not enough.

This adapter targets [`@ripl/web`](/docs/core/contexts/canvas), i.e. Canvas 2D. To draw through another backend, construct the context yourself and hand it to `<RiplContext>` via its `context` prop.

> [!NOTE]
> For the full component and hook API, see the [React API Reference](/docs/api/@ripl/react/).

## Installation

```bash
npm install @ripl/react
```

`react` (18.3 or later, including 19) is a peer dependency you already have. Ripl's own packages arrive as dependencies of this one.

## Quick Start

There is no plugin and no global registration. Import the components you use:

```tsx
import {
    RiplCircle,
    RiplContext,
    RiplRenderer,
    RiplScene,
    RiplTransition,
} from '@ripl/react';
```

Then describe a scene. `<RiplContext>` renders a plain element that the canvas fills, so give it a size. Click the circle in the demo below:

:::tabs
== Demo
<example-react-quick-start />
== Code
```tsx
import {
    useState,
} from 'react';

import {
    easeOutCubic,
} from '@ripl/web';

export function QuickStart() {
    const [grown, setGrown] = useState(false);

    return (
        <RiplContext style={{ width: 400, height: 300 }}>
            <RiplScene>
                <RiplRenderer>
                    <RiplTransition update={{ duration: 400, ease: easeOutCubic }}>
                        <RiplCircle
                            cx={200}
                            cy={150}
                            radius={grown ? 90 : 50}
                            fill={grown ? '#ff006e' : '#3a86ff'}
                            onClick={() => setGrown(value => !value)}
                        />
                    </RiplTransition>
                </RiplRenderer>
            </RiplScene>
        </RiplContext>
    );
}
```
:::

Props drive the element's state, `onClick` is an ordinary listener prop, and wrapping the element in a `<RiplTransition>` animates every prop change through it.

## The three tiers

Ripl separates the drawing surface, the scene graph and the animation loop, and the adapter keeps that separation. Each level adds capability, and every element picks up the highest one declared above it.

| Tree | What it adds |
| --- | --- |
| `<RiplContext>` | Elements paint directly to the surface. Pointer events and hit testing work. |
| `+ <RiplScene>` | A hoisted, flat instruction stream: z-ordering, group clipping, efficient large graphs. |
| `+ <RiplRenderer>` | A `requestAnimationFrame` loop, and `<RiplTransition>`. |

A context on its own is enough for static or lightly-updated graphics:

```tsx
<RiplContext style={{ width: 200, height: 200 }}>
    <RiplGroup fill="#e5484d">
        <RiplCircle cx={60} cy={60} radius={40} />
        <RiplRect x={100} y={100} width={60} height={60} stroke="#1e6978" />
    </RiplGroup>
</RiplContext>
```

Add a scene once you need z-ordering or many elements, and a renderer once you need animation. See [Rendering](/docs/react/essentials/rendering) for what each one changes.

## Where to go next

- **[Rendering](/docs/react/essentials/rendering)**: the context, scene and renderer components
- **[Components](/docs/react/essentials/components)**: groups, the built-in components, and how props map to state
- **[Transitions](/docs/react/essentials/transitions)**: animating enter, update and leave
- **[Events](/docs/react/essentials/events)**: pointer and drag listeners
- **[Hooks](/docs/react/essentials/hooks)**: reaching the underlying Ripl objects
- **[Examples](/docs/react/essentials/examples)**: a live, interactive chart built from the components above

Two companion packages extend the same surface:

- **[3D](/docs/react/3d/)**: `@ripl/react-3d` adds a 3D context, nine shapes, a camera and lights. The scene, renderer and transition components above drive it unchanged.
- **[Charts](/docs/react/charts/)**: `@ripl/react-charts` turns all 25 of Ripl's chart types into components whose props are the chart's options.
