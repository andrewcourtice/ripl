---
outline: "deep"
---

# Performance

Ripl is designed to be performant out of the box, but understanding how the rendering pipeline works will help you get the best results. This page covers the key performance concepts and optimization tips.

## Scene Hoisting

The single most impactful optimization in Ripl is **scene hoisting**. When elements are placed into a Scene, the scene flattens the entire element tree into a single sorted array called the **render buffer**.

Without a scene, rendering a deeply nested group structure requires a recursive tree walk — an O(n^c) operation where `c` is the depth of the tree. With a scene, the render buffer converts this to a flat O(n) iteration:

```ts
// Without scene — recursive tree walk each frame
group.render(context); // O(n^c)

// With scene — flat buffer iteration each frame
const scene = createScene(context, { children: [group] });
scene.render(); // O(n)
```

The cost of maintaining the buffer is shifted to add/remove operations on groups, which happen far less frequently than rendering.

### When to Use Scenes

- **Always use a Scene** when rendering more than a handful of elements
- **Especially important** for animations where the scene re-renders every frame
- The performance difference grows with tree depth and element count

## Renderer Auto Start/Stop

The Renderer's `autoStart` and `autoStop` options (both `true` by default) ensure the render loop only runs when needed:

- **autoStart** — The renderer starts automatically when a transition is created or the mouse enters the scene
- **autoStop** — The renderer stops automatically when all transitions complete and the mouse leaves the scene

This means the render loop is idle when nothing is happening — no wasted CPU cycles on static content.

```ts
const renderer = createRenderer(scene, {
    autoStart: true, // default
    autoStop: true, // default
});
```

If you have continuous animations that should never stop, disable `autoStop`:

```ts
const renderer = createRenderer(scene, {
    autoStop: false,
});
```

## Persistent Path Keys

When creating paths in custom elements, always provide a **persistent key**:

```ts
// ✅ Good — persistent key allows efficient DOM reconciliation
render(context: Context) {
    return super.render(context, path => {
        // this.id is stable across renders
        path.circle(this.cx, this.cy, this.radius);
    });
}
```

For the Canvas context, the key is ignored (canvas redraws from scratch each frame). But for the SVG context, the key is critical — it allows the virtual DOM reconciliation to match existing SVG elements with new render output, minimizing DOM mutations.

The built-in elements already use persistent keys. This tip applies when you create [custom elements](/docs/core/advanced/custom-elements).

## Canvas vs SVG Performance

| Scenario | Canvas | SVG |
| --- | --- | --- |
| Many elements (1000+) | Faster | Slower (DOM overhead) |
| Few elements (< 100) | Similar | Similar |
| Complex animations | Faster (bitmap redraw) | Slower (DOM mutations) |
| Static content | Similar | Similar |
| High DPI displays | Handled automatically | Handled automatically |

**General guidance**: Use Canvas for performance-critical scenarios with many elements or complex animations. Use SVG when you need DOM accessibility or have fewer elements.

## Buffered Rendering (SVG)

The SVG context automatically uses **buffered rendering**. Instead of applying DOM changes synchronously after each element render, changes are batched and flushed once per animation frame. When used inside a Scene + Renderer, buffering is automatically disabled since the Renderer already drives the render loop via `requestAnimationFrame`.

## Tips Summary

1. **Use a Scene + Renderer** for anything beyond trivial rendering — the flat render buffer and automatic start/stop provide significant performance gains
2. **Use Canvas** for large element counts or complex animations
3. **Use persistent path keys** in custom elements for efficient SVG reconciliation
4. **Let autoStop work** — don't disable it unless you have continuous animations
5. **Minimize group depth** — while scenes flatten the tree for rendering, shallower trees are faster to modify
6. **Batch property changes** — change multiple properties before triggering a render, rather than rendering after each change
7. **Use `zIndex`** instead of render order when possible — the scene buffer sorts by zIndex automatically

## Stress Test

Use the demo below to benchmark Ripl's rendering performance. Adjust the element count and watch the frame time. Canvas context is used here for maximum throughput.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Elements</span>
            <RiplInputRange v-model="elementCount" :min="100" :max="5000" :step="100" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createCircle,
    createRenderer,
    createScene,
    transition,
} from '@ripl/web';

const circles = Array.from({ length: 1000 }, () =>
    createCircle({
        fill: `hsl(${Math.random() * 360}, 70%, 60%)`,
        cx: Math.random() * width,
        cy: Math.random() * height,
        radius: 3 + Math.random() * 5,
    })
);

const scene = createScene(context, { children: circles });
const renderer = createRenderer(scene);
```
:::

<script lang="ts" setup>
import {
    useAdvRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
} from '@ripl/web';

import type {
    Circle,
} from '@ripl/web';

import {
    ref,
    watch
} from 'vue';

const elementCount = ref(1000);

let circles: Circle[] = [];

function makeCircle(w: number, h: number) {
    return createCircle({
        fill: `hsl(${Math.random() * 360}, 70%, 60%)`,
        cx: Math.random() * w,
        cy: Math.random() * h,
        radius: 2 + Math.random() * 4,
    });
}

const {
    scene,
    contextChanged,
} = useAdvRiplExample(({ context, renderer, scene }) => {
    const w = context.width;
    const h = context.height;
    const count = elementCount.value;

    circles = Array.from({ length: count }, () => makeCircle(w, h));

    scene.add(circles);
    renderer.on('tick', () => {
        circles.forEach(c => {
            c.cx += (Math.random() - 0.5) * 2;
            c.cy += (Math.random() - 0.5) * 2;
        });
    });
}, {
    renderer: {
        autoStop: false,
        debug: {
            fps: true,
            elementCount: true,
        },
    }
});

watch(elementCount, (newCount, oldCount) => {
    console.log(scene.value);
    if (!scene.value) return;

    const w = scene.value.width;
    const h = scene.value.height;

    if (newCount > oldCount) {
        const added = Array.from({ length: newCount - oldCount }, () => makeCircle(w, h));
        circles.push(...added);
        scene.value.add(added);
    } else if (newCount < oldCount) {
        const removed = circles.splice(newCount);
        scene.value.remove(removed);
        removed.forEach(c => c.destroy());
    }
});
</script>

## Measuring Performance

You can measure render performance by listening to renderer events:

```ts
renderer.on('start', (event) => {
    console.log('Render loop started at', event.data.startTime);
});

renderer.on('stop', (event) => {
    const duration = event.data.endTime - event.data.startTime;
    console.log(`Render loop ran for ${duration}ms`);
});
```

For frame-level profiling, use the browser's built-in Performance panel in DevTools.
