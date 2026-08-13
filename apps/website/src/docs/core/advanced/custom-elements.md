---
title: Custom Elements
description: "Build your own Ripl element by extending Shape or Element: a state interface, accessor pairs, a local bounding box, a render callback, factory and type guard."
outline: "deep"
---

# Custom Elements

Ripl's built-in elements cover common shapes, but you can create your own custom elements by extending the `Shape` or `Element` class. This gives you full control over rendering while still benefiting from Ripl's style inheritance, events, interpolation, and scene management.

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplField label="Points">
            <RiplInputRange v-model="starPoints" :min="3" :max="12" :step="1" @update:model-value="redraw" />
        </RiplField>
        <RiplField label="Inner Radius %">
            <RiplInputRange v-model="innerPct" :min="10" :max="90" :step="1" @update:model-value="redraw" />
        </RiplField>
    </template>
</ripl-example>
== Code
```ts
// Custom star element
const star = createStar({
    fill: '#ff006e',
    cx: 200,
    cy: 150,
    outerRadius: 80,
    innerRadius: 35,
    points: 5,
});

star.render(context);
```
:::

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/@ripl/core/).

## Extending Shape2D

Most custom elements should extend `Shape2D`, which provides path-based rendering with automatic fill/stroke and hit testing. Here's a complete example of a custom **Star** element:

```ts
import type {
    BaseElementState,
    Context,
    Shape2DOptions,
} from '@ripl/web';

import {
    Shape2D,
} from '@ripl/web';

// 1. Define your state interface
interface StarState extends BaseElementState {
    cx: number;
    cy: number;
    outerRadius: number;
    innerRadius: number;
    points: number;
}

// 2. Extend Shape2D with your state
class Star extends Shape2D<StarState> {

    get cx() {
        return this.getStateValue('cx');
    }
    set cx(value) {
        this.setStateValue('cx', value);
    }

    get cy() {
        return this.getStateValue('cy');
    }
    set cy(value) {
        this.setStateValue('cy', value);
    }

    get outerRadius() {
        return this.getStateValue('outerRadius');
    }
    set outerRadius(value) {
        this.setStateValue('outerRadius', value);
    }

    get innerRadius() {
        return this.getStateValue('innerRadius');
    }
    set innerRadius(value) {
        this.setStateValue('innerRadius', value);
    }

    get points() {
        return this.getStateValue('points');
    }
    set points(value) {
        this.setStateValue('points', value);
    }

    constructor(options: Shape2DOptions<StarState>) {
        super('star', options); // 'star' is the element type name
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
function createStar(options: Shape2DOptions<StarState>) {
    return new Star(options);
}
```

### How Rendering Works

When `super.render(context, callback)` is called on a Shape:

1. The context state is **saved**
2. All style properties (`fill`, `stroke`, `lineWidth`, etc.) are applied to the context
3. A new **path** is created via `context.createPath(this.id)`
4. Your **callback** receives the path and builds the geometry
5. If `autoFill` is true and `fill` is set, the path is **filled**
6. If `autoStroke` is true and `stroke` is set, the path is **stroked**
7. The context state is **restored**

The `this.id` passed to `createPath` is important: it acts as a persistent key that allows the SVG context to efficiently reconcile elements across renders without recreating DOM nodes.

## Extending Element

For non-path elements (like text or images), extend `Element` directly:

```ts
import type {
    BaseElementState,
    Context,
    ElementOptions,
} from '@ripl/web';

import {
    Element,
} from '@ripl/web';

interface BadgeState extends BaseElementState {
    x: number;
    y: number;
    label: string;
    size: number;
}

class Badge extends Element<BadgeState> {

    get x() {
        return this.getStateValue('x');
    }
    set x(value) {
        this.setStateValue('x', value);
    }

    get y() {
        return this.getStateValue('y');
    }
    set y(value) {
        this.setStateValue('y', value);
    }

    get label() {
        return this.getStateValue('label');
    }
    set label(value) {
        this.setStateValue('label', value);
    }

    get size() {
        return this.getStateValue('size');
    }
    set size(value) {
        this.setStateValue('size', value);
    }

    constructor(options: ElementOptions<BadgeState>) {
        super('badge', options);
    }

    render(context: Context) {
        return super.render(context, () => {
            // Create a path for the circle background
            const path = context.createPath(this.id);
            path.circle(this.x, this.y, this.size);
            context.applyFill(path);

            // Create text for the label
            const text = context.createText({
                id: `${this.id}-label`,
                x: this.x,
                y: this.y,
                content: this.label,
            });
            context.applyFill(text);
        });
    }
}
```

## State Management

### `getStateValue(key)` / `setStateValue(key, value)`

These protected methods read and write state values. `getStateValue` automatically falls back to the parent group's value if the element's own value is not set, which is how style inheritance works.

### Getter/Setter Pattern

Always expose state properties as getter/setter pairs. The setter should call `setStateValue`, which triggers an `updated` event that the scene graph uses to know when to re-render:

<!-- eslint-skip -->
```ts
get radius() { return this.getStateValue('radius'); }
set radius(value) { this.setStateValue('radius', value); }
```

## Declaring Defaults

An element type usually wants values of its own beneath whatever the caller passes — a default segment count, a default paint, or the interpolator each of its state properties tweens with. The constructor takes a third `defaults` argument for exactly this: a partial options object applied *under* the caller's options.

```ts
import {
    interpolateAny,
    interpolateNumber,
    Shape2D,
} from '@ripl/web';

import type {
    ElementDefaults,
    Shape2DOptions,
} from '@ripl/web';

const STAR_DEFAULTS: ElementDefaults<StarState> = {
    points: 5,
    interpolators: {
        cx: interpolateNumber,
        cy: interpolateNumber,
        innerRadius: interpolateNumber,
        outerRadius: interpolateNumber,
        // A point count has no meaningful in-between, so snap it
        points: interpolateAny,
    },
};

class Star extends Shape2D<StarState> {

    constructor(options: Shape2DOptions<StarState>) {
        super('star', options, STAR_DEFAULTS);
    }

}
```

Precedence runs in one direction — **Ripl's built-in defaults, then yours, then the caller's options** — so a caller always wins, and each layer of a class hierarchy sits beneath the one below it. Declare the defaults as a module-level constant like the one above: it never changes, so every instance can share it rather than rebuilding one per element.

`Shape2D` reads its own flags (`autoFill`, `autoStroke`, `clip`, `cachePath`) from the same object, so a shape that should never fill declares `{ autoFill: false }` there. `Shape3D` does the same for its transform properties. Where a default is genuinely computed — from the context, or from another option — pass an object literal instead of a constant.

### Interpolators

Ripl detects an interpolator from the value when a property has no declared one, which is the right behaviour for state it knows nothing about — but detection costs a predicate test per property per transition, and it can only guess from shape. A custom element should say what its own properties hold.

Base properties such as `fill`, `stroke`, `opacity` and the transform are already declared by `Element`, so only your own state needs listing.

A property may declare several factories, tried in order until one claims the value via its `test` function — that is how `fill` handles a color, a gradient or a pattern. A factory with no `test` is used unconditionally. If every declared factory declines, the property snaps rather than falling back to detection. See [Interpolators](/docs/core/advanced/interpolators).

This is also how a package teaches Ripl about a value type of its own. `@ripl/3d` exports `interpolateVector3`; an element with a vector-valued property declares it:

```ts
const ANCHORED_DEFAULTS: Shape3DDefaults<AnchoredState> = {
    interpolators: {
        anchor: interpolateVector3,
    },
};
```

## Using Custom Elements

Custom elements work exactly like built-in elements: they can be added to groups, scenes, animated with renderers, and respond to events:

```ts
const star = createStar({
    fill: '#ff006e',
    cx: 200,
    cy: 150,
    outerRadius: 60,
    innerRadius: 30,
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

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    Context,
    Shape2D,
} from '@ripl/web';

import {
    createText,
} from '@ripl/web';

import type {
    BaseElementState,
    Shape2DOptions,
} from '@ripl/web';

import {
    ref,
} from 'vue';

interface StarState extends BaseElementState {
    cx: number;
    cy: number;
    outerRadius: number;
    innerRadius: number;
    points: number;
}

class Star extends Shape2D<StarState> {
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

    constructor(options: Shape2DOptions<StarState>) {
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

const starPoints = ref(5);
const innerPct = ref(40);
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 4;

    context.batch(() => {
        new Star({
            fill: '#ff006e',
            cx: w / 2, cy: h / 2,
            outerRadius: r,
            innerRadius: r * (innerPct.value / 100),
            points: starPoints.value,
        }).render(context);

        createText({
            x: w / 2, y: h / 2 + r + 24,
            content: `${starPoints.value} points  inner: ${innerPct.value}%`,
            fill: '#666', textAlign: 'center', font: '12px sans-serif',
        }).render(context);
    });
}

const {
    contextChanged
} = useRiplExample(context => {
    currentContext = context;
    renderDemo(context);
    context.on('resize', () => renderDemo(context));
});

function redraw() {
    if (currentContext) renderDemo(currentContext);
}
</script>
