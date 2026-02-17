---
outline: "deep"
---

# FAQ

Common questions and clarifications about Ripl's concepts and usage.

## What's the difference between Element and Shape?

**Element** is the base class for all drawable objects. It provides style properties, event handling, interpolation, and rendering infrastructure.

**Shape** extends Element and adds path-based rendering. Shapes automatically fill and stroke based on your style properties, and provide pixel-accurate hit testing via the path geometry.

| | Element | Shape |
| --- | --- | --- |
| **Examples** | Text | Circle, Rect, Arc, Line, Polygon, Polyline, Ellipse |
| **Rendering** | Manual — you control what gets drawn | Path-based — define geometry, auto fill/stroke |
| **Hit testing** | Bounding box | Pixel-accurate path geometry |
| **When to use** | Non-path elements (text, images, composites) | Geometric shapes |

**Rule of thumb**: If your element draws a geometric path, extend Shape. If it draws something else (text, images, custom composites), extend Element.

## When should I use a Group?

Use a Group when you want to:

- **Share styles** — Set `fillStyle` once on the group instead of on every child
- **Organize elements** — Create a logical hierarchy (like a DOM tree)
- **Query elements** — Use `getElementById`, `getElementsByType`, `query`, etc.
- **Batch operations** — Render, add, or remove multiple elements at once

Groups are lightweight and don't draw anything themselves — they just manage their children.

## When should I use a Scene vs a Group?

| | Group | Scene |
| --- | --- | --- |
| **Rendering** | Must pass a context to `render(context)` | Binds to a context, call `render()` with no args |
| **Events** | No DOM event delegation | Full DOM event delegation (click, hover, etc.) |
| **Resize** | No automatic resize handling | Auto re-renders on resize |
| **Buffer** | No render buffer | Flat render buffer for O(n) performance |

**Use a Scene when**:
- You need pointer events (click, hover) on elements
- You want automatic resize handling
- You're rendering many elements and want the performance of a flat render buffer

**Use a Group when**:
- You just need to organize elements into a hierarchy
- You're rendering a small number of elements manually
- You don't need pointer events

## Do I need a Renderer?

Not always. A Renderer is needed when you want:

- **Animations** — Smooth transitions between property values
- **Continuous rendering** — A `requestAnimationFrame` loop
- **Auto start/stop** — Automatic render loop management

If you're just drawing static elements, you can render them directly without a Renderer:

```ts
// No renderer needed for static content
circle.render(context);

// Renderer needed for animations
const renderer = createRenderer(scene);
await renderer.transition(circle, {
    duration: 1000,
    state: { radius: 100 },
});
```

## Canvas or SVG — which should I use?

| | Canvas | SVG |
| --- | --- | --- |
| **Performance** | Better for many elements (1000+) | Better for fewer elements (< 500) |
| **Quality** | Bitmap — can pixelate on zoom | Vector — crisp at any zoom level |
| **DOM access** | No DOM elements for rendered content | Each element is a DOM node |
| **DevTools** | Can't inspect individual shapes | Can inspect/style individual elements |
| **Pixel ops** | Supports `getImageData`/`putImageData` | No pixel-level access |

**Default recommendation**: Start with Canvas (the default). Switch to SVG if you need DOM accessibility, CSS styling of individual elements, or vector-quality output.

The beauty of Ripl is that switching is a one-line change:

```ts
// Canvas (default)
import { createContext } from '@ripl/core';

// SVG — just change the import
import { createContext } from '@ripl/svg';
```

## Why aren't my pointer events working?

Pointer events (click, mouseenter, mouseleave, mousemove) only work when elements are inside a **Scene**. The Scene handles DOM event listening and hit testing.

```ts
// ❌ Won't work — no scene
const circle = createCircle({ ... });
circle.render(context);
circle.on('click', () => {}); // Never fires

// ✅ Works — element is in a scene
const scene = createScene(context, { children: [circle] });
scene.render();
circle.on('click', () => {}); // Fires correctly
```

## Why is my element invisible?

Common causes:

1. **No fill or stroke** — Elements need `fillStyle` and/or `strokeStyle` to be visible
2. **Zero dimensions** — Check that `radius`, `width`, `height`, etc. are non-zero
3. **Off-screen** — Check that coordinates are within the context bounds
4. **Wrong context** — Make sure you're rendering to the right context
5. **Not rendered** — Make sure you called `.render(context)` or `scene.render()`
6. **Covered by another element** — Check `zIndex` or rendering order

## How do I render to a specific size?

The context automatically fills its parent container. To control the size, set the container's dimensions:

```html
<div class="my-container" style="width: 600px; height: 400px;"></div>
```

```ts
const context = createContext('.my-container');
// context.width === 600, context.height === 400
```

## Can I use Ripl with React/Vue/Angular?

Yes. Ripl renders to a DOM element, so it works with any framework. Create the context in a lifecycle hook (e.g., `onMounted` in Vue, `useEffect` in React) and clean up with `context.destroy()` on unmount.

```ts
// Vue 3 example
onMounted(() => {
    const context = createContext(containerRef.value);
    const scene = createScene(context, { children: [...] });
    scene.render();

    onUnmounted(() => scene.destroy());
});
```
