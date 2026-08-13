---
title: Interpolators
description: "Interpolators compute the in-between values a Ripl tween walks through: numbers, dates, colors, gradients, pattern paints, rotations and point arrays."
outline: "deep"
---

# Interpolators

Interpolators are functions that compute intermediate values between two endpoints. They are the tweening engine behind Ripl's animation system: when you transition an element's `radius` from 50 to 100, an interpolator generates all the in-between values.

What can be tweened is not limited to numbers. Ripl interpolates dates, colors written as hex, `rgb()`, `hsl()`, `hsv()` or a CSS keyword, gradient strings, pattern paints, rotations in degrees or radians, border radii, dash patterns, and point arrays — the last of which morphs one polyline or polygon outline into another, optionally matching points by key so a curved renderer survives an add or remove. Every built-in element declares which interpolators its own state properties use; anything undeclared is chosen from the value's type, and either can be overridden per property.

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/@ripl/core/).

## Built-in Interpolators

Ripl ships with interpolators for common value types. A property an element declares an interpolator for uses it directly. Anything else is detected from the value, testing in this order and taking the first whose `test` function returns `true`: `interpolateNumber`, `interpolateGradient`, `interpolatePattern` (matching-type `pattern(...)` paints), `interpolateColor` (hex, rgb, rgba, hsl, hsv and CSS keywords), `interpolateDate`, `interpolatePoints` (arrays of `[x, y]` tuples), and `interpolateNumbers` (arrays of numbers, of any length). `interpolateAny` is the fallback, snapping at t > 0.5.

A further set is never detected and is reached for by declaration or by hand: `interpolateRotation` and `interpolateTransformOrigin` back the `rotation` and `transformOrigin*` properties, `interpolateBorderRadius` backs `Rect`'s `borderRadius` (which may be a single radius or a four-corner tuple), `interpolateImage` cross-fades an `Image` element's source, and `interpolateString`, `interpolatePath`, `interpolateWaypoint`, `interpolatePolygonPoint` and `interpolateCirclePoint` are called directly.

## How Interpolators Work

An interpolator factory takes two values (start and end) and returns a function that accepts a time value `t` (0 to 1) and returns the interpolated result:

```ts
import {
    interpolateNumber,
} from '@ripl/web';

const interpolate = interpolateNumber(0, 100);

interpolate(0); // 0
interpolate(0.5); // 50
interpolate(1); // 100
```

### Number Interpolation

The simplest interpolator performs linear interpolation between two numbers:

```ts
const interpolate = interpolateNumber(10, 50);
interpolate(0.25); // 20
interpolate(0.75); // 40
```

### Color Interpolation

Interpolates between CSS color strings by parsing them to RGBA, interpolating each channel, and serializing back:

```ts
import {
    interpolateColor,
} from '@ripl/web';

const interpolate = interpolateColor('#3a86ff', '#ff006e');
interpolate(0); // 'rgba(58, 134, 255, 1)'
interpolate(0.5); // 'rgba(157, 67, 162, 1)' (midpoint)
interpolate(1); // 'rgba(255, 0, 110, 1)'
```

Both endpoints are parsed before interpolating, so a hex color, an `rgb()` color and a CSS named color such as `red` mix freely in either position. Anything `parseColor` cannot resolve (`currentColor`, say) falls back to a hard step at the halfway point.

### Any Interpolation

The fallback interpolator for values that don't match any other type. It snaps to the target value at the halfway point:

```ts
import {
    interpolateAny,
} from '@ripl/web';

const interpolate = interpolateAny('hello', 'world');
interpolate(0.3); // 'hello'
interpolate(0.7); // 'world'
```

## Automatic Interpolation

When you use `element.interpolate()` or `renderer.transition()`, Ripl selects the appropriate interpolator for each property:

```ts
await renderer.transition(circle, {
    duration: 1000,
    state: {
        radius: 100, // uses interpolateNumber
        fill: '#ff006e', // uses interpolateColor
    },
});
```

`Circle` declares `radius` as numeric, so no detection runs for it. `fill` is declared as a paint — a gradient, a pattern or a color, tried in that order — so the same property tweens correctly whichever form it holds:

```ts
await renderer.transition(rect, {
    duration: 1000,
    state: {
        fill: 'linear-gradient(180deg, #ff006e, #fb5607)', // uses interpolateGradient
    },
});
```

## Custom Interpolators

### Inline Interpolator

The simplest way to use a custom interpolator is to pass a function directly in the transition state:

```ts
await renderer.transition(circle, {
    duration: 1000,
    state: {
        // Custom function: t goes from 0 to 1
        radius: t => 50 + Math.sin(t * Math.PI) * 50,
    },
});
```

### InterpolatorFactory

For reusable interpolators, create an `InterpolatorFactory`: a function that takes start and end values and returns an interpolator:

```ts
import type {
    InterpolatorFactory,
} from '@ripl/web';

const interpolateBoolean: InterpolatorFactory<boolean> = (a, b) => {
    return t => t > 0.5 ? b : a;
};
```

### The interpolators option

Declare which factory a property uses with the `interpolators` option, either at construction or per transition. A transition-level entry wins over a construction-level one, which wins over the element type's own default:

```ts
const toggle = createRect({
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    interpolators: {
        // 'active' is this element's own state, so nothing could have guessed it
        active: interpolateBoolean,
    },
});

await renderer.transition(toggle, {
    duration: 1000,
    state: { width: 200 },
    interpolators: {
        width: interpolateStepped,
    },
});
```

A property may declare **several** factories, tried in order. Each is asked, via its `test` function, whether it can handle the value; the first to claim it wins. That is how `fill` accepts a gradient, a pattern or a color under one property:

```ts
const swatch = createRect({
    x: 0,
    y: 0,
    width: 100,
    height: 40,
    interpolators: {
        fill: [interpolateGradient, interpolatePattern, interpolateColor],
    },
});
```

A factory with **no** `test` function is an unconditional choice and is used as-is. If every declared factory declines the value, the property snaps at t > 0.5 rather than falling back to detection — declaring a factory is a statement about what the property holds.

> [!TIP]
> A custom element should declare its own state properties this way rather than relying on detection. See [Custom Elements](/docs/core/advanced/custom-elements).

### Keyframe Values

Transitions also support keyframe-style arrays for multi-step animations:

```ts
await renderer.transition(circle, {
    duration: 1000,
    state: {
        // Implicit offsets (evenly spaced)
        fill: ['#3a86ff', '#ff006e', '#8338ec'],

        // Explicit offsets
        radius: [
            {
                value: 80,
                offset: 0.3,
            },
            {
                value: 40,
                offset: 0.7,
            },
            {
                value: 100,
                offset: 1.0,
            },
        ],
    },
});
```

## The Interpolation Pipeline

When a transition runs, here's what happens for each property:

1. **Read** the current value from the element
2. **Select** an interpolator: a function passed as the target value is used verbatim; otherwise the first factory to claim the value is taken from the transition's `interpolators`, then the element's, then — for a property neither declares — the built-in detection order
3. On each frame, **compute** the eased time `t`
4. **Apply** the interpolated value to the element
5. The renderer re-renders the scene

This pipeline runs for every animated property simultaneously, producing smooth multi-property transitions.

## Demos

Each demo below lets you scrub through interpolation time `t` (0→1) to see the interpolator in action.

### Number

Linear interpolation between two numbers, the foundation of all other interpolators.

:::tabs
== Code
```ts
import {
    interpolateNumber,
} from '@ripl/web';

const interp = interpolateNumber(20, 120);
circle.radius = interp(t);
```
== Demo
<ripl-example @context-changed="numberCtxChanged">
    <template #footer>
        <RiplField label="t">
            <RiplInputRange v-model="numberT" :min="0" :max="100" :step="1" @update:model-value="numberRedraw" />
        </RiplField>
    </template>
</ripl-example>
:::

### Color

Interpolates between CSS color strings by parsing to RGBA, interpolating each channel independently, and serializing back. Named colors are parsed like any other format, so `interpolateColor('red', 'blue')` tweens rather than stepping.

:::tabs
== Code
```ts
import {
    interpolateColor,
} from '@ripl/web';

const interp = interpolateColor('#3a86ff', '#ff006e');
rect.fill = interp(t);
```
== Demo
<ripl-example @context-changed="colorCtxChanged">
    <template #footer>
        <RiplField label="t">
            <RiplInputRange v-model="colorT" :min="0" :max="100" :step="1" @update:model-value="colorRedraw" />
        </RiplField>
    </template>
</ripl-example>
:::

### Gradient

Transitions between two CSS gradient strings by interpolating their stop colors, offsets, and angles.

:::tabs
== Code
```ts
import {
    interpolateGradient,
} from '@ripl/web';

const interp = interpolateGradient(
    'linear-gradient(0deg, #3a86ff, #8338ec)',
    'linear-gradient(180deg, #ff006e, #fb5607)'
);
rect.fill = interp(t);
```
== Demo
<ripl-example @context-changed="gradientCtxChanged">
    <template #footer>
        <RiplField label="t">
            <RiplInputRange v-model="gradientT" :min="0" :max="100" :step="1" @update:model-value="gradientRedraw" />
        </RiplField>
    </template>
</ripl-example>
:::

### Pattern

Transitions between two `pattern(...)` paints that share a tile type by interpolating their foreground color, background color, and tile size.

:::tabs
== Code
```ts
import {
    interpolatePattern,
} from '@ripl/web';

const interp = interpolatePattern(
    'pattern(diagonal, #3a86ff, #eff6ff, 6)',
    'pattern(diagonal, #ff006e, #fff0, 16)'
);
rect.fill = interp(t);
```
== Demo
<ripl-example @context-changed="patternCtxChanged">
    <template #footer>
        <RiplField label="t">
            <RiplInputRange v-model="patternT" :min="0" :max="100" :step="1" @update:model-value="patternRedraw" />
        </RiplField>
    </template>
</ripl-example>
:::

### Rotation

Interpolates between rotation values. It supports numbers (radians) and strings like `"90deg"` or `"1.5rad"`.

:::tabs
== Code
```ts
import {
    interpolateRotation,
} from '@ripl/web';

const interp = interpolateRotation('0deg', '360deg');
rect.rotation = interp(t);
```
== Demo
<ripl-example @context-changed="rotationCtxChanged">
    <template #footer>
        <RiplField label="t">
            <RiplInputRange v-model="rotationT" :min="0" :max="100" :step="1" @update:model-value="rotationRedraw" />
        </RiplField>
    </template>
</ripl-example>
:::

### Path

Progressively reveals a polyline path from start to end as `t` advances from 0 to 1.

:::tabs
== Code
```ts
import {
    getPolygonPoints, interpolatePath,
} from '@ripl/web';

const points = getPolygonPoints(6, cx, cy, radius, true);
const interp = interpolatePath(points);
polyline.points = interp(t);
```
== Demo
<ripl-example @context-changed="pathCtxChanged">
    <template #footer>
        <RiplField label="t">
            <RiplInputRange v-model="pathT" :min="0" :max="100" :step="1" @update:model-value="pathRedraw" />
        </RiplField>
    </template>
</ripl-example>
:::

### Point Interpolation & Shape Morphing

`interpolatePoints` transitions between two point arrays. When the arrays differ in length, the shorter set is automatically **extrapolated**: intermediate points are inserted along its edges so both arrays have equal length. This enables smooth morphing between any two polygon shapes.

:::tabs
== Code
```ts
import {
    getPolygonPoints, interpolatePoints,
} from '@ripl/web';

const triangle = getPolygonPoints(3, cx, cy, radius);
const octagon = getPolygonPoints(8, cx, cy, radius);

const interp = interpolatePoints(triangle, octagon);
polygon.points = interp(t); // smoothly morphs between shapes
```
== Demo
<ripl-example @context-changed="morphCtxChanged">
    <template #footer>
        <RiplField label="From">
            <RiplSelect v-model="morphFrom" @change="morphRedraw">
                <option value="3">Triangle</option>
                <option value="4">Square</option>
                <option value="5">Pentagon</option>
                <option value="6">Hexagon</option>
                <option value="8">Octagon</option>
            </RiplSelect>
        </RiplField>
        <RiplField label="To">
            <RiplSelect v-model="morphTo" @change="morphRedraw">
                <option value="3">Triangle</option>
                <option value="4">Square</option>
                <option value="5">Pentagon</option>
                <option value="6">Hexagon</option>
                <option value="8">Octagon</option>
            </RiplSelect>
        </RiplField>
        <RiplField label="t">
            <RiplInputRange v-model="morphT" :min="0" :max="100" :step="1" @update:model-value="morphRedraw" />
        </RiplField>
    </template>
</ripl-example>
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createPolyline,
    createRect,
    createText,
    getPolygonPoints,
    interpolateColor,
    interpolateGradient,
    interpolateNumber,
    interpolatePath,
    interpolatePattern,
    interpolatePoints,
    interpolateRotation,
    TAU,
} from '@ripl/web';

import type {
    Context,
    Point,
} from '@ripl/web';

import {
    ref,
} from 'vue';


// --- Number demo ---

const numberT = ref(0);
let numberCtx: Context | undefined;

function renderNumber(ctx: Context) {
    const w = ctx.width;
    const h = ctx.height;
    const t = numberT.value / 100;
    const minR = Math.min(w, h) * 0.08;
    const maxR = Math.min(w, h) * 0.38;
    const interp = interpolateNumber(minR, maxR);
    const r = interp(t);

    ctx.batch(() => {
        createCircle({ fill: '#3a86ff', cx: w / 2, cy: h / 2, radius: r }).render(ctx);
        createText({
            x: w / 2, y: h - 16,
            content: `t = ${t.toFixed(2)}  radius = ${Math.round(r)}`,
            fill: '#666', textAlign: 'center', font: '12px sans-serif',
        }).render(ctx);
    });
}

const { contextChanged: numberCtxChanged } = useRiplExample(ctx => {
    numberCtx = ctx;
    renderNumber(ctx);
    ctx.on('resize', () => renderNumber(ctx));
});

function numberRedraw() { if (numberCtx) renderNumber(numberCtx); }


// --- Color demo ---

const colorT = ref(0);
let colorCtx: Context | undefined;

function renderColor(ctx: Context) {
    const w = ctx.width;
    const h = ctx.height;
    const t = colorT.value / 100;
    const interp = interpolateColor('#3a86ff', '#ff006e');
    const color = interp(t);
    const pad = 20;

    ctx.batch(() => {
        createRect({
            fill: color,
            x: pad,
            y: pad,
            width: w - pad * 2,
            height: h - 50,
            borderRadius: 8,
        }).render(ctx);
        createText({
            x: w / 2, y: h - 16,
            content: `t = ${t.toFixed(2)}  color = ${color}`,
            fill: '#666', textAlign: 'center', font: '12px sans-serif',
        }).render(ctx);
    });
}

const { contextChanged: colorCtxChanged } = useRiplExample(ctx => {
    colorCtx = ctx;
    renderColor(ctx);
    ctx.on('resize', () => renderColor(ctx));
});

function colorRedraw() { if (colorCtx) renderColor(colorCtx); }


// --- Gradient demo ---

const gradientT = ref(0);
let gradientCtx: Context | undefined;

function renderGradient(ctx: Context) {
    const w = ctx.width;
    const h = ctx.height;
    const t = gradientT.value / 100;
    const interp = interpolateGradient(
        'linear-gradient(0deg, #3a86ff 0%, #8338ec 100%)',
        'linear-gradient(180deg, #ff006e 0%, #fb5607 100%)'
    );
    const grad = interp(t);
    const pad = 20;

    ctx.batch(() => {
        createRect({
            fill: grad,
            x: pad,
            y: pad,
            width: w - pad * 2,
            height: h - 50,
            borderRadius: 8,
        }).render(ctx);
        createText({
            x: w / 2, y: h - 16,
            content: `t = ${t.toFixed(2)}`,
            fill: '#666', textAlign: 'center', font: '12px sans-serif',
        }).render(ctx);
    });
}

const { contextChanged: gradientCtxChanged } = useRiplExample(ctx => {
    gradientCtx = ctx;
    renderGradient(ctx);
    ctx.on('resize', () => renderGradient(ctx));
});

function gradientRedraw() { if (gradientCtx) renderGradient(gradientCtx); }


// --- Pattern demo ---

const patternT = ref(0);
let patternCtx: Context | undefined;

function renderPattern(ctx: Context) {
    const w = ctx.width;
    const h = ctx.height;
    const t = patternT.value / 100;
    const interp = interpolatePattern(
        'pattern(diagonal, #3a86ff, #eff6ff, 6)',
        'pattern(diagonal, #ff006e, #fff0, 16)'
    );
    const fill = interp(t);
    const pad = 20;

    ctx.batch(() => {
        createRect({
            fill,
            x: pad,
            y: pad,
            width: w - pad * 2,
            height: h - 50,
            borderRadius: 8,
        }).render(ctx);
        createText({
            x: w / 2, y: h - 16,
            content: `t = ${t.toFixed(2)}`,
            fill: '#666', textAlign: 'center', font: '12px sans-serif',
        }).render(ctx);
    });
}

const { contextChanged: patternCtxChanged } = useRiplExample(ctx => {
    patternCtx = ctx;
    renderPattern(ctx);
    ctx.on('resize', () => renderPattern(ctx));
});

function patternRedraw() { if (patternCtx) renderPattern(patternCtx); }


// --- Rotation demo ---

const rotationT = ref(0);
let rotationCtx: Context | undefined;

function renderRotation(ctx: Context) {
    const w = ctx.width;
    const h = ctx.height;
    const t = rotationT.value / 100;
    const interp = interpolateRotation(0, TAU);
    const angle = interp(t) as number;
    const size = Math.min(w, h) * 0.3;

    ctx.batch(() => {
        createRect({
            fill: '#3a86ff',
            x: w / 2 - size / 2,
            y: h / 2 - size / 2,
            width: size,
            height: size,
            borderRadius: 4,
            rotation: angle,
            transformOriginX: '50%',
            transformOriginY: '50%',
        }).render(ctx);

        createText({
            x: w / 2, y: h - 16,
            content: `t = ${t.toFixed(2)}  angle = ${Math.round(angle * 180 / Math.PI)}°`,
            fill: '#666', textAlign: 'center', font: '12px sans-serif',
        }).render(ctx);
    });
}

const { contextChanged: rotationCtxChanged } = useRiplExample(ctx => {
    rotationCtx = ctx;
    renderRotation(ctx);
    ctx.on('resize', () => renderRotation(ctx));
});

function rotationRedraw() { if (rotationCtx) renderRotation(rotationCtx); }


// --- Path demo ---

const pathT = ref(0);
let pathCtx: Context | undefined;

function renderPath(ctx: Context) {
    const w = ctx.width;
    const h = ctx.height;
    const t = pathT.value / 100;
    const r = Math.min(w, h) * 0.35;
    const points = getPolygonPoints(6, w / 2, h / 2, r, true);
    const interp = interpolatePath(points);
    const revealed = interp(t);

    ctx.batch(() => {
        createPolyline({
            points,
            stroke: '#e9ecef',
            lineWidth: 2,
            lineDash: [4, 4],
        }).render(ctx);

        createPolyline({
            points: revealed,
            stroke: '#3a86ff',
            lineWidth: 3,
        }).render(ctx);

        const tip = revealed[revealed.length - 1];
        createCircle({ fill: '#3a86ff', cx: tip[0], cy: tip[1], radius: 4 }).render(ctx);

        createText({
            x: w / 2, y: h - 16,
            content: `t = ${t.toFixed(2)}  points revealed = ${revealed.length}/${points.length}`,
            fill: '#666', textAlign: 'center', font: '12px sans-serif',
        }).render(ctx);
    });
}

const { contextChanged: pathCtxChanged } = useRiplExample(ctx => {
    pathCtx = ctx;
    renderPath(ctx);
    ctx.on('resize', () => renderPath(ctx));
});

function pathRedraw() { if (pathCtx) renderPath(pathCtx); }


// --- Polygon morph demo ---

const morphT = ref(0);
const morphFrom = ref('3');
const morphTo = ref('8');
let morphCtx: Context | undefined;

function renderMorph(ctx: Context) {
    const w = ctx.width;
    const h = ctx.height;
    const t = morphT.value / 100;
    const r = Math.min(w, h) * 0.35;
    const cx = w / 2;
    const cy = h / 2;

    const fromPts = getPolygonPoints(parseInt(morphFrom.value), cx, cy, r);
    const toPts = getPolygonPoints(parseInt(morphTo.value), cx, cy, r);
    const interp = interpolatePoints(fromPts, toPts);
    const morphed = interp(t) as Point[];

    ctx.batch(() => {
        const closePts = (pts: Point[]) => pts.length > 0 ? [...pts, pts[0]] : pts;

        createPolyline({
            points: closePts(fromPts),
            stroke: '#e9ecef',
            lineWidth: 1,
            lineDash: [4, 4],
        }).render(ctx);
        createPolyline({
            points: closePts(toPts),
            stroke: '#e9ecef',
            lineWidth: 1,
            lineDash: [4, 4],
        }).render(ctx);

        createPolyline({
            points: closePts(morphed),
            stroke: '#3a86ff',
            lineWidth: 2,
            fill: 'rgba(58, 134, 255, 0.15)',
        }).render(ctx);

        morphed.forEach(pt => {
            createCircle({ fill: '#3a86ff', cx: pt[0], cy: pt[1], radius: 3 }).render(ctx);
        });

        createText({
            x: w / 2, y: h - 16,
            content: `t = ${t.toFixed(2)}  points = ${morphed.length} (${morphFrom.value}-gon → ${morphTo.value}-gon)`,
            fill: '#666', textAlign: 'center', font: '12px sans-serif',
        }).render(ctx);
    });
}

const { contextChanged: morphCtxChanged } = useRiplExample(ctx => {
    morphCtx = ctx;
    renderMorph(ctx);
    ctx.on('resize', () => renderMorph(ctx));
});

function morphRedraw() { if (morphCtx) renderMorph(morphCtx); }
</script>
