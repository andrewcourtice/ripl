---
outline: "deep"
---

# Scales

**Scales** map data values to visual values, turning a number like `42` into a pixel position, a color, or a band width. They are the bridge between your data domain and the visual range on screen. Ripl ships with a full family of scale types covering continuous, categorical, ordinal, logarithmic, symmetric-log, radial, quantile, and time-based mappings.

Every scale is a callable function: pass a domain value in, get a range value out. Scales also expose `inverse` (reverse mapping), `ticks` (nice axis values), `includes` (domain membership), and the original `domain`/`range` arrays.

> [!NOTE]
> For the full API, see the [Scales API Reference](/docs/api/@ripl/core/).

## Demo

Use the controls below to explore different scale types. The scale maps a domain value (bottom axis) to a range value (left axis).

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplSelect v-model="currentScale" @change="redraw">
                <option value="continuous">Continuous</option>
                <option value="logarithmic">Logarithmic</option>
                <option value="power">Power (x²)</option>
                <option value="sqrt">Square Root</option>
            </RiplSelect>
            <span>Input</span>
            <RiplInputRange v-model="inputValue" :min="0" :max="100" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    scaleContinuous,
    scaleLogarithmic,
    scalePower,
    scaleSqrt,
} from '@ripl/web';

const linear = scaleContinuous([0, 100], [0, 400]);
const log = scaleLogarithmic([1, 100], [0, 400]);
const power = scalePower([0, 100], [0, 400], { exponent: 2 });
const sqrt = scaleSqrt([0, 100], [0, 400]);

linear(50); // 200
log(10); // ~200
power(50); // 100
sqrt(25); // 200
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createCircle,
    createLine,
    createPolyline,
    createRect,
    createText,
    scaleContinuous,
    scaleLogarithmic,
    scalePower,
    scaleSqrt,
} from '@ripl/web';

import type {
    Context,
    Scale,
} from '@ripl/web';

import {
    ref,
    watch,
} from 'vue';

const currentScale = ref('continuous');
const inputValue = ref(50);
let currentContext: Context | undefined;

function getScale(type: string, range: number[]): Scale<number> {
    switch (type) {
        case 'logarithmic': return scaleLogarithmic([1, 100], range);
        case 'power': return scalePower([0, 100], range, { exponent: 2 });
        case 'sqrt': return scaleSqrt([0, 100], range);
        default: return scaleContinuous([0, 100], range);
    }
}

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const pad = 50;
    const chartW = w - pad * 2;
    const chartH = h - pad * 2;

    const scale = getScale(currentScale.value, [0, chartW]);
    const yScale = scaleContinuous([0, chartW], [chartH, 0]);

    context.batch(() => {
        createRect({
            fill: '#f8f9fa', x: pad, y: pad, width: chartW, height: chartH,
        }).render(context);

        for (let i = 0; i <= 100; i += 20) {
            const x = pad + scaleContinuous([0, 100], [0, chartW])(i);
            createLine({
                stroke: '#e9ecef',
                lineWidth: 1,
                x1: x,
                y1: pad,
                x2: x,
                y2: pad + chartH,
            }).render(context);
            createText({
                fill: '#999',
                x,
                y: pad + chartH + 16,
                content: String(i),
                textAlign: 'center',
                font: '11px sans-serif',
            }).render(context);
        }

        const points: [number, number][] = [];
        const domainMin = currentScale.value === 'logarithmic' ? 1 : 0;
        for (let i = domainMin; i <= 100; i += 1) {
            const sx = scale(i);
            points.push([pad + scaleContinuous([0, 100], [0, chartW])(i), pad + yScale(sx)]);
        }

        createPolyline({ stroke: '#3a86ff', lineWidth: 2, points, renderer: 'linear' }).render(context);

        const val = Math.max(domainMin, inputValue.value);
        const mapped = scale(val);
        const px = pad + scaleContinuous([0, 100], [0, chartW])(val);
        const py = pad + yScale(mapped);

        createCircle({ fill: '#ff006e', cx: px, cy: py, radius: 6 }).render(context);
        createText({
            fill: '#333', x: px, y: py - 14,
            content: `${val} → ${Math.round(mapped)}`,
            textAlign: 'center', font: 'bold 12px sans-serif',
        }).render(context);

        createText({
            fill: '#666', x: w / 2, y: h - 6,
            content: `Scale: ${currentScale.value}`,
            textAlign: 'center', font: '12px sans-serif',
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

watch(currentScale, redraw);
</script>

## Continuous

The most common scale. Maps a numeric domain linearly to a numeric range.

```ts
import {
    scaleContinuous,
} from '@ripl/web';

const x = scaleContinuous([0, 100], [0, 800]);

x(0); // 0
x(50); // 400
x(100); // 800

x.inverse(400); // 50
x.ticks(5); // [0, 25, 50, 75, 100]
```

Options: `clamp` (constrain output to range), `padToTicks` (extend domain to nice tick boundaries), and `nice` (expand the domain to round, tick-aligned boundaries at construction; `true` targets ~10 ticks, or pass a number). `nice` is a construction-time option by design, so scales stay plain callable objects with no chained `.nice()` method:

```ts
const y = scaleContinuous([3, 97], [400, 0], { nice: true });

y.domain; // [0, 100] — snapped to round boundaries
```

## Band

Divides a continuous range into evenly spaced bands for categorical data. Exposes `bandwidth` and `step`.

```ts
import {
    scaleBand,
} from '@ripl/web';

const x = scaleBand(['Jan', 'Feb', 'Mar'], [0, 300], {
    innerPadding: 0.1,
    outerPadding: 0.05,
});

x('Jan'); // band start position
x.bandwidth; // width of each band
x.step; // distance between band starts
```

Options: `innerPadding`, `outerPadding`, `alignment`, `round`.

## Point

The categorical analogue of a continuous axis: it positions discrete values at evenly spaced *points* rather than bands (no `bandwidth`). With zero padding the first and last values sit exactly on the range endpoints. Exposes `step`, and `inverse` returns the nearest domain value.

```ts
import {
    scalePoint,
} from '@ripl/web';

const x = scalePoint(['Mon', 'Tue', 'Wed', 'Thu'], [0, 300], {
    padding: 0.5,
});

x('Mon'); // first point position
x.step; // distance between adjacent points
x.inverse(105); // nearest domain value, e.g. 'Tue'
```

Options: `padding` (space before the first and after the last point, as a fraction of the step) and `alignment` (0–1).

## Discrete

Maps discrete domain values to evenly spaced positions in a numeric range.

```ts
import {
    scaleDiscrete,
} from '@ripl/web';

const color = scaleDiscrete(['low', 'mid', 'high'], [0, 100]);

color('low'); // 0
color('mid'); // 50
color('high'); // 100
```

## Ordinal

Maps each distinct domain value to a value from `range` of **any type**, cycling when there are more categories than range values. Unknown values encountered later are assigned the next range slot, so a chart can color series without pre-declaring every category. Its most common use is categorical color.

```ts
import {
    scaleOrdinal,
} from '@ripl/web';

const color = scaleOrdinal(
    ['apples', 'oranges', 'pears'],
    ['#3a86ff', '#ff006e', '#ffbe0b']
);

color('apples'); // '#3a86ff'
color('pears'); // '#ffbe0b'
color('grapes'); // '#3a86ff' — cycles back to the first range value
```

## Diverging

Like continuous, but splits at a midpoint. This is useful for scales that diverge around zero (e.g. temperature anomalies, profit/loss).

```ts
import {
    scaleDiverging,
} from '@ripl/web';

const x = scaleDiverging([-100, 100], [0, 800], {
    midpoint: 0,
});

x(-100); // 0
x(0); // 400
x(100); // 800
```

## Logarithmic

Maps values using a log transformation. Useful for data spanning several orders of magnitude.

```ts
import {
    scaleLog,
    scaleLogarithmic,
} from '@ripl/web';

const x = scaleLogarithmic([1, 1000], [0, 600], { base: 10 });

x(1); // 0
x(10); // 200
x(100); // 400
x(1000); // 600

// scaleLog is a shortcut for base-10
const y = scaleLog([1, 1000], [0, 600]);
```

## Symmetric Log

A log scale that also handles zero and negative values. It stays approximately linear within a threshold `constant` (default `1`) of zero and compresses logarithmically beyond it, so, unlike a plain log scale, its domain can cross zero. A domain symmetric about zero places zero at the range midpoint.

```ts
import {
    scaleSymlog,
} from '@ripl/web';

const x = scaleSymlog([-100, 100], [0, 400]);

x(-100); // 0
x(0); // 200 — zero sits at the midpoint
x(100); // 400

x.inverse(200); // 0

// A larger constant widens the near-zero linear region
const y = scaleSymlog([-1000, 1000], [0, 400], { constant: 10 });
```

## Power

Maps values using an exponential transformation. `exponent: 2` gives a quadratic curve, `exponent: 0.5` gives a square root curve.

```ts
import {
    scalePower,
    scaleSqrt,
} from '@ripl/web';

const x = scalePower([0, 100], [0, 400], { exponent: 2 });

// scaleSqrt is a shortcut for exponent 0.5
const y = scaleSqrt([0, 100], [0, 400]);
```

## Radial

Maps a numeric magnitude onto a ring radius (typically `[innerRadius, outerRadius]`) for radial and polar charts. It **clamps by default**, so a value beyond the domain lands exactly on the outer ring instead of overshooting it, and a single-value domain `[max]` is treated as `[0, max]`.

```ts
import {
    scaleRadial,
} from '@ripl/web';

const radius = scaleRadial([0, 100], [0, 240]);

radius(0); // 0
radius(50); // 120
radius(100); // 240
radius(200); // 240 — clamped to the outer ring

radius.inverse(120); // 50
```

## Quantile

Divides a sorted numeric domain into quantiles, each mapped to a discrete range value.

```ts
import {
    scaleQuantile,
} from '@ripl/web';

const color = scaleQuantile(
    [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    ['low', 'medium', 'high']
);

color(15); // 'low'
color(55); // 'medium'
color(95); // 'high'
```

## Quantize

Divides a continuous domain into uniform segments mapped to discrete range values.

```ts
import {
    scaleQuantize,
} from '@ripl/web';

const rating = scaleQuantize([0, 100], ['poor', 'fair', 'good', 'excellent']);

rating(20); // 'poor'
rating(40); // 'fair'
rating(60); // 'good'
rating(90); // 'excellent'
```

## Threshold

Maps values to range values based on threshold breakpoints.

```ts
import {
    scaleThreshold,
} from '@ripl/web';

const grade = scaleThreshold([60, 70, 80, 90], ['F', 'D', 'C', 'B', 'A']);

grade(55); // 'F'
grade(65); // 'D'
grade(75); // 'C'
grade(85); // 'B'
grade(95); // 'A'
```

## Time

Maps `Date` objects to a numeric range using linear interpolation of timestamps.

```ts
import {
    scaleTime,
} from '@ripl/web';

const x = scaleTime(
    [new Date('2024-01-01'), new Date('2024-12-31')],
    [0, 800]
);

x(new Date('2024-07-01')); // ~400
x.inverse(400); // ≈ Date('2024-07-01')
x.ticks(6); // 6 calendar-aligned dates
```

`ticks` is **calendar-aware**: it picks the interval (seconds up to years) whose spacing is closest to the requested count, and month/year steps use calendar arithmetic so ticks land on real month and year boundaries rather than fixed millisecond offsets.

## Common Scale Properties

Every scale function exposes:

| Property | Type | Description |
| --- | --- | --- |
| `domain` | `TDomain[]` | The input domain |
| `range` | `TRange[]` | The output range |
| `inverse(value)` | `(TRange) → TDomain` | Reverse mapping |
| `ticks(count?)` | `(number?) → TDomain[]` | Generate nice tick values |
| `includes(value)` | `(TDomain) → boolean` | Test domain membership |
