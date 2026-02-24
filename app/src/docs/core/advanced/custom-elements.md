---
outline: "deep"
---

# Custom Elements

Ripl's built-in elements cover common shapes, but you can create your own custom elements by extending the `Shape` or `Element` class. This gives you full control over rendering while still benefiting from Ripl's style inheritance, events, interpolation, and scene management.

## Extending Shape

Most custom elements should extend `Shape`, which provides path-based rendering with automatic fill/stroke and hit testing. Here's a complete example of a custom **Star** element:

```ts
import { Shape, ShapeOptions, BaseElementState, Context } from '@ripl/core';

// 1. Define your state interface
interface StarState extends BaseElementState {
    cx: number;
    cy: number;
    outerRadius: number;
    innerRadius: number;
    points: number;
}

// 2. Extend Shape with your state
class Star extends Shape<StarState> {

    get cx() { return this.getStateValue('cx'); }
    set cx(value) { this.setStateValue('cx', value); }

    get cy() { return this.getStateValue('cy'); }
    set cy(value) { this.setStateValue('cy', value); }

    get outerRadius() { return this.getStateValue('outerRadius'); }
    set outerRadius(value) { this.setStateValue('outerRadius', value); }

    get innerRadius() { return this.getStateValue('innerRadius'); }
    set innerRadius(value) { this.setStateValue('innerRadius', value); }

    get points() { return this.getStateValue('points'); }
    set points(value) { this.setStateValue('points', value); }

    constructor(options: ShapeOptions<StarState>) {
        super('star', options);  // 'star' is the element type name
    }

    // 3. Implement the render method
    render(context: Context) {
        return super.render(context, path => {
            const { cx, cy, outerRadius, innerRadius, points } = this;
            const step = Math.PI / points;

            path.moveTo(
                cx + outerRadius * Math.cos(0),
                cy + outerRadius * Math.sin(0)
            );

            for (let i = 0; i < 2 * points; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = i * step;
                path.lineTo(
                    cx + radius * Math.cos(angle),
                    cy + radius * Math.sin(angle)
                );
            }

            path.closePath();
        });
    }
}

// 4. Create a factory function
function createStar(options: ShapeOptions<StarState>) {
    return new Star(options);
}
```

### How Rendering Works

When `super.render(context, callback)` is called on a Shape:

1. The context state is **saved**
2. All style properties (`fillStyle`, `strokeStyle`, `lineWidth`, etc.) are applied to the context
3. A new **path** is created via `context.createPath(this.id)`
4. Your **callback** receives the path and builds the geometry
5. If `autoFill` is true and `fillStyle` is set, the path is **filled**
6. If `autoStroke` is true and `strokeStyle` is set, the path is **stroked**
7. The context state is **restored**

The `this.id` passed to `createPath` is important — it acts as a persistent key that allows the SVG context to efficiently reconcile elements across renders without recreating DOM nodes.

## Extending Element

For non-path elements (like text or images), extend `Element` directly:

```ts
import { Element, ElementOptions, BaseElementState, Context } from '@ripl/core';

interface BadgeState extends BaseElementState {
    x: number;
    y: number;
    label: string;
    size: number;
}

class Badge extends Element<BadgeState> {

    get x() { return this.getStateValue('x'); }
    set x(value) { this.setStateValue('x', value); }

    get y() { return this.getStateValue('y'); }
    set y(value) { this.setStateValue('y', value); }

    get label() { return this.getStateValue('label'); }
    set label(value) { this.setStateValue('label', value); }

    get size() { return this.getStateValue('size'); }
    set size(value) { this.setStateValue('size', value); }

    constructor(options: ElementOptions<BadgeState>) {
        super('badge', options);
    }

    render(context: Context) {
        return super.render(context, () => {
            // Create a path for the circle background
            const path = context.createPath(this.id);
            path.circle(this.x, this.y, this.size);
            context.fill(path);

            // Create text for the label
            const text = context.createText({
                id: `${this.id}-label`,
                x: this.x,
                y: this.y,
                content: this.label,
            });
            context.fill(text);
        });
    }
}
```

## State Management

### `getStateValue(key)` / `setStateValue(key, value)`

These protected methods read and write state values. `getStateValue` automatically falls back to the parent group's value if the element's own value is not set — this is how style inheritance works.

### Getter/Setter Pattern

Always expose state properties as getter/setter pairs. The setter should call `setStateValue`, which triggers an `updated` event that the scene graph uses to know when to re-render:

```ts
get radius() { return this.getStateValue('radius'); }
set radius(value) { this.setStateValue('radius', value); }
```

## Using Custom Elements

Custom elements work exactly like built-in elements — they can be added to groups, scenes, animated with renderers, and respond to events:

```ts
const star = createStar({
    fillStyle: '#ff006e',
    cx: 200, cy: 150,
    outerRadius: 60, innerRadius: 30,
    points: 5,
});

// Works with groups
const group = createGroup({ children: [star] });

// Works with scenes and renderers
const scene = createScene('.container', { children: [star] });
const renderer = createRenderer(scene);

// Works with transitions
await renderer.transition(star, {
    duration: 1000,
    ease: easeOutCubic,
    state: { outerRadius: 100 },
});
```

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
// Custom star element
const star = createStar({
    fillStyle: '#ff006e',
    cx: 200,
    cy: 150,
    outerRadius: 80,
    innerRadius: 35,
    points: 5,
});

star.render(context);
```
:::

<script lang="ts" setup>
import { Shape, Context } from '@ripl/core';
import type { ShapeOptions, BaseElementState } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

interface StarState extends BaseElementState {
    cx: number;
    cy: number;
    outerRadius: number;
    innerRadius: number;
    points: number;
}

class Star extends Shape<StarState> {
    get cx() { return this.getStateValue('cx'); }
    set cx(v) { this.setStateValue('cx', v); }
    get cy() { return this.getStateValue('cy'); }
    set cy(v) { this.setStateValue('cy', v); }
    get outerRadius() { return this.getStateValue('outerRadius'); }
    set outerRadius(v) { this.setStateValue('outerRadius', v); }
    get innerRadius() { return this.getStateValue('innerRadius'); }
    set innerRadius(v) { this.setStateValue('innerRadius', v); }
    get points() { return this.getStateValue('points'); }
    set points(v) { this.setStateValue('points', v); }

    constructor(options: ShapeOptions<StarState>) {
        super('star', options);
    }

    render(context: Context) {
        return super.render(context, path => {
            const { cx, cy, outerRadius, innerRadius, points } = this;
            const step = Math.PI / points;
            path.moveTo(cx + outerRadius * Math.cos(-Math.PI / 2), cy + outerRadius * Math.sin(-Math.PI / 2));
            for (let i = 1; i <= 2 * points; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = i * step - Math.PI / 2;
                path.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
            }
            path.closePath();
        });
    }
}

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 4;

    const render = () => {
        context.markRenderStart();

        new Star({
            fillStyle: '#ff006e',
            cx: w * 0.3, cy: h / 2,
            outerRadius: r, innerRadius: r * 0.4, points: 5,
        }).render(context);

        new Star({
            fillStyle: '#3a86ff',
            strokeStyle: '#1a56db', lineWidth: 2,
            cx: w * 0.7, cy: h / 2,
            outerRadius: r, innerRadius: r * 0.5, points: 8,
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>
