---
outline: "deep"
---

# Interpolators

Interpolators are functions that compute intermediate values between two endpoints. They are the engine behind Ripl's animation system — when you transition an element's `radius` from 50 to 100, an interpolator generates all the in-between values.

Ripl automatically selects the right interpolator based on the value type, but you can also provide custom interpolators for specialized behavior.

> [!NOTE]
> For the full API, see the [Core API Reference](/docs/api/@ripl/core/).

## Built-in Interpolators

Ripl ships with interpolators for common value types. They are tested in order — the first one whose `test` function returns `true` is used. Built-in factories include `interpolateNumber`, `interpolateColor` (hex, rgb, rgba, hsl), `interpolateGradient`, `interpolateDate`, `interpolatePath` (SVG path strings), `interpolateString` (extracts numeric values), and `interpolateAny` (fallback — snaps at t > 0.5).

## How Interpolators Work

An interpolator factory takes two values (start and end) and returns a function that accepts a time value `t` (0 to 1) and returns the interpolated result:

```ts
import {
    interpolateNumber,
} from '@ripl/core';

const interpolate = interpolateNumber(0, 100);

interpolate(0); // 0
interpolate(0.5); // 50
interpolate(1); // 100
```

### Number Interpolation

The simplest interpolator — linear interpolation between two numbers:

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
} from '@ripl/core';

const interpolate = interpolateColor('#3a86ff', '#ff006e');
interpolate(0); // 'rgba(58, 134, 255, 1)'
interpolate(0.5); // 'rgba(157, 67, 162, 1)' (midpoint)
interpolate(1); // 'rgba(255, 0, 110, 1)'
```

Color interpolation works across different color formats — you can interpolate from a hex color to an RGB color seamlessly.

### Any Interpolation

The fallback interpolator for values that don't match any other type. It snaps to the target value at the halfway point:

```ts
import {
    interpolateAny,
} from '@ripl/core';

const interpolate = interpolateAny('hello', 'world');
interpolate(0.3); // 'hello'
interpolate(0.7); // 'world'
```

## Automatic Interpolation

When you use `element.interpolate()` or `renderer.transition()`, Ripl automatically selects the appropriate interpolator for each property:

```ts
await renderer.transition(circle, {
    duration: 1000,
    state: {
        radius: 100, // uses interpolateNumber
        fill: '#ff006e', // uses interpolateColor
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

For reusable interpolators, create an `InterpolatorFactory` — a function that takes start and end values and returns an interpolator:

```ts
import type {
    InterpolatorFactory,
} from '@ripl/core';

const interpolateBoolean: InterpolatorFactory<boolean> = (a, b) => {
    return t => t > 0.5 ? b : a;
};

// Optional: add a test function so it's auto-selected
interpolateBoolean.test = (value) => typeof value === 'boolean';
```

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
2. **Select** an interpolator (custom function, keyframe array, or auto-detected factory)
3. On each frame, **compute** the eased time `t`
4. **Apply** the interpolated value to the element
5. The renderer re-renders the scene

This pipeline runs for every animated property simultaneously, producing smooth multi-property transitions.

## Demos

Each demo below lets you scrub through interpolation time `t` (0→1) to see the interpolator in action.

### Number

Linear interpolation between two numbers — the foundation of all other interpolators.

:::tabs
== Code
```ts
import {
    interpolateNumber,
} from '@ripl/core';

const interp = interpolateNumber(20, 120);
circle.radius = interp(t);
```
== Demo
<ripl-example @context-changed="numberCtxChanged">
    <template #footer>
        <RiplControlGroup>
            <span>t</span>
            <RiplInputRange v-model="numberT" :min="0" :max="100" :step="1" @update:model-value="numberRedraw" style="flex:1" />
        </RiplControlGroup>
    </template>
</ripl-example>
:::

### Color

Interpolates between CSS color strings by parsing to RGBA, interpolating each channel independently, and serializing back.

:::tabs
== Code
```ts
import {
    interpolateColor,
} from '@ripl/core';

const interp = interpolateColor('#3a86ff', '#ff006e');
rect.fill = interp(t);
```
== Demo
<ripl-example @context-changed="colorCtxChanged">
    <template #footer>
        <RiplControlGroup>
            <span>t</span>
            <RiplInputRange v-model="colorT" :min="0" :max="100" :step="1" @update:model-value="colorRedraw" style="flex:1" />
        </RiplControlGroup>
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
} from '@ripl/core';

const interp = interpolateGradient(
    'linear-gradient(0deg, #3a86ff, #8338ec)',
    'linear-gradient(180deg, #ff006e, #fb5607)'
);
rect.fill = interp(t);
```
== Demo
<ripl-example @context-changed="gradientCtxChanged">
    <template #footer>
        <RiplControlGroup>
            <span>t</span>
            <RiplInputRange v-model="gradientT" :min="0" :max="100" :step="1" @update:model-value="gradientRedraw" style="flex:1" />
        </RiplControlGroup>
    </template>
</ripl-example>
:::

### Rotation

Interpolates between rotation values — supports numbers (radians) and strings like `"90deg"` or `"1.5rad"`.

:::tabs
== Code
```ts
import {
    interpolateRotation,
} from '@ripl/core';

const interp = interpolateRotation('0deg', '360deg');
rect.rotation = interp(t);
```
== Demo
<ripl-example @context-changed="rotationCtxChanged">
    <template #footer>
        <RiplControlGroup>
            <span>t</span>
            <RiplInputRange v-model="rotationT" :min="0" :max="100" :step="1" @update:model-value="rotationRedraw" style="flex:1" />
        </RiplControlGroup>
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
} from '@ripl/core';

const points = getPolygonPoints(6, cx, cy, radius, true);
const interp = interpolatePath(points);
polyline.points = interp(t);
```
== Demo
<ripl-example @context-changed="pathCtxChanged">
    <template #footer>
        <RiplControlGroup>
            <span>t</span>
            <RiplInputRange v-model="pathT" :min="0" :max="100" :step="1" @update:model-value="pathRedraw" style="flex:1" />
        </RiplControlGroup>
    </template>
</ripl-example>
:::

### Point Interpolation & Shape Morphing

`interpolatePoints` transitions between two point arrays. When the arrays differ in length, the shorter set is automatically **extrapolated** — intermediate points are inserted along its edges so both arrays have equal length. This enables smooth morphing between any two polygon shapes.

:::tabs
== Code
```ts
import {
    getPolygonPoints, interpolatePoints,
} from '@ripl/core';

const triangle = getPolygonPoints(3, cx, cy, radius);
const octagon = getPolygonPoints(8, cx, cy, radius);

const interp = interpolatePoints(triangle, octagon);
polygon.points = interp(t); // smoothly morphs between shapes
```
== Demo
<ripl-example @context-changed="morphCtxChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplSelect v-model="morphFrom" @change="morphRedraw">
                <option value="3">Triangle</option>
                <option value="4">Square</option>
                <option value="5">Pentagon</option>
                <option value="6">Hexagon</option>
                <option value="8">Octagon</option>
            </RiplSelect>
            <span>→</span>
            <RiplSelect v-model="morphTo" @change="morphRedraw">
                <option value="3">Triangle</option>
                <option value="4">Square</option>
                <option value="5">Pentagon</option>
                <option value="6">Hexagon</option>
                <option value="8">Octagon</option>
            </RiplSelect>
            <RiplInputRange v-model="morphT" :min="0" :max="100" :step="1" @update:model-value="morphRedraw" style="flex:1" />
        </RiplControlGroup>
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
    interpolatePoints,
    interpolateRotation,
    TAU,
} from '@ripl/core';

import type {
    Context,
    Point,
} from '@ripl/core';

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
        createRect({ fill: color, x: pad, y: pad, width: w - pad * 2, height: h - 50, borderRadius: 8 }).render(ctx);
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
        createRect({ fill: grad, x: pad, y: pad, width: w - pad * 2, height: h - 50, borderRadius: 8 }).render(ctx);
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

        createPolyline({ points: closePts(fromPts), stroke: '#e9ecef', lineWidth: 1, lineDash: [4, 4] }).render(ctx);
        createPolyline({ points: closePts(toPts), stroke: '#e9ecef', lineWidth: 1, lineDash: [4, 4] }).render(ctx);

        createPolyline({ points: closePts(morphed), stroke: '#3a86ff', lineWidth: 2, fill: 'rgba(58, 134, 255, 0.15)' }).render(ctx);

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
