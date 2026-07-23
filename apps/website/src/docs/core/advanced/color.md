---
outline: "deep"
---

# Color

Ripl includes a complete color toolkit for parsing, converting, and serializing colors across multiple color spaces. Any CSS color string you pass to `fill` or `stroke` is automatically parsed — but you can also use the color utilities directly for programmatic color manipulation, palette generation, and animation.

> [!NOTE]
> For the full API, see the [Color API Reference](/docs/api/@ripl/core/).

## Demo

Type or pick a color to see it parsed into every supported color space in real time.

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <input type="color" v-model="pickedColor" style="width: 40px; height: 32px; border: none; padding: 0; cursor: pointer;" />
            <span>Alpha</span>
            <RiplInputRange v-model="alpha" :min="0" :max="100" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    parseColor,
    serializeHEX,
    serializeHSL,
    serializeRGB,
    serializeRGBA,
    setColorAlpha,
} from '@ripl/web';

const rgba = parseColor('#3a86ff');
// [58, 134, 255, 1]

serializeHEX(...rgba); // '#3a86ff'
serializeRGB(...rgba); // 'rgb(58, 134, 255)'
serializeRGBA(...rgba); // 'rgba(58, 134, 255, 1)'
serializeHSL(...rgba); // 'hsl(216, 100%, 61%)'

setColorAlpha('#3a86ff', 0.5); // 'rgba(58, 134, 255, 0.5)'
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createRect,
    createText,
    parseColor,
    serializeHEX,
    serializeHSL,
    serializeRGBA,
    setColorAlpha,
} from '@ripl/web';

import type {
    Context,
    ColorRGBA,
} from '@ripl/web';

import {
    ref,
    watch,
} from 'vue';

const pickedColor = ref('#3a86ff');
const alpha = ref(100);
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;

    const color = setColorAlpha(pickedColor.value, alpha.value / 100);
    const rgba = parseColor(color);

    context.batch(() => {
        const swatchSize = Math.min(w * 0.25, h * 0.6);

        createRect({
            fill: '#e9ecef',
            x: 0, y: 0, width: w, height: h,
        }).render(context);

        createRect({
            fill: color,
            x: w * 0.08, y: h / 2 - swatchSize / 2,
            width: swatchSize, height: swatchSize,
            borderRadius: 12,
        }).render(context);

        if (rgba) {
            const lines = [
                `RGBA: ${rgba.join(', ')}`,
                `HEX: ${serializeHEX(...rgba)}`,
                `RGB: ${serializeRGBA(...rgba)}`,
                `HSL: ${serializeHSL(...rgba)}`,
            ];

            const startX = w * 0.08 + swatchSize + 24;
            const startY = h / 2 - (lines.length - 1) * 12;

            lines.forEach((line, i) => {
                createText({
                    fill: '#333', x: startX, y: startY + i * 24,
                    content: line, font: '13px monospace',
                    textBaseline: 'middle',
                }).render(context);
            });
        }
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

watch(pickedColor, redraw);
</script>

## Supported Color Spaces

| Space | Parse | Serialize | Example |
| --- | --- | --- | --- |
| HEX | `parseHEX` | `serializeHEX` | `#3a86ff`, `#3a86ff80` |
| RGB | `parseRGB` | `serializeRGB` | `rgb(58, 134, 255)` |
| RGBA | `parseRGBA` | `serializeRGBA` | `rgba(58, 134, 255, 0.5)` |
| HSL | `parseHSL` | `serializeHSL` | `hsl(216, 100%, 61%)` |
| HSLA | `parseHSLA` | `serializeHSLA` | `hsla(216, 100%, 61%, 0.5)` |
| HSV | `parseHSV` | `serializeHSV` | `hsv(216, 77%, 100%)` |
| HSVA | `parseHSVA` | `serializeHSVA` | `hsva(216, 77%, 100%, 0.5)` |

## Parsing Colors

`parseColor` auto-detects the format and returns an RGBA tuple `[r, g, b, a]`:

```ts
import {
    parseColor,
} from '@ripl/web';

parseColor('#3a86ff'); // [58, 134, 255, 1]
parseColor('rgb(58, 134, 255)'); // [58, 134, 255, 1]
parseColor('hsl(216, 100%, 61%)'); // [58, 134, 255, 1]
```

For a specific format, use the named parser:

```ts
import {
    parseHEX,
    parseRGB,
} from '@ripl/web';

parseHEX('#ff006e'); // [255, 0, 110, 1]
parseRGB('rgb(255, 0, 110)'); // [255, 0, 110, 1]
```

## Serializing Colors

Serializers convert RGBA channel values back to a color string:

```ts
import {
    serializeHEX,
    serializeRGBA,
} from '@ripl/web';

serializeHEX(58, 134, 255, 1); // '#3a86ff'
serializeRGBA(58, 134, 255, 1); // 'rgba(58, 134, 255, 1)'
```

## Color Space Conversion

Convert between color spaces using the conversion utilities:

```ts
import {
    hslToRGBA,
    hsvToRGBA,
    rgbaToHSL,
    rgbaToHSV,
} from '@ripl/web';

rgbaToHSL(58, 134, 255); // [216, 100, 61, 1]
hslToRGBA(216, 100, 61); // [58, 134, 255, 1]

rgbaToHSV(58, 134, 255); // [216, 77, 100, 1]
hsvToRGBA(216, 77, 100); // [58, 134, 255, 1]
```

## Modifying Alpha

`setColorAlpha` parses any color string, replaces its alpha channel, and returns an RGBA string:

```ts
import {
    setColorAlpha,
} from '@ripl/web';

setColorAlpha('#3a86ff', 0.5); // 'rgba(58, 134, 255, 0.5)'
setColorAlpha('rgb(255, 0, 110)', 0.8); // 'rgba(255, 0, 110, 0.8)'
```

## Color Interpolation

When animating between colors via `renderer.transition()`, Ripl uses `interpolateColor` under the hood. It parses both colors to RGBA, interpolates each channel linearly, and serializes back:

```ts
import {
    interpolateColor,
} from '@ripl/web';

const lerp = interpolateColor('#3a86ff', '#ff006e');
lerp(0); // 'rgba(58, 134, 255, 1)'
lerp(0.5); // 'rgba(157, 67, 162, 1)'
lerp(1); // 'rgba(255, 0, 110, 1)'
```

This happens automatically when transitioning `fill` or `stroke` between color values.

## Color Schemes

Ripl ships a set of perceptually-uniform palettes as arrays of color stops, each prefixed `COLOR_SCHEME_`: `VIRIDIS`, `PLASMA`, `INFERNO`, `MAGMA`, `CIVIDIS`, `TURBO` (sequential) and `RDBU`, `BRBG` (diverging). Being plain arrays, they compose directly with the interpolation and scale helpers below.

```ts
import {
    COLOR_SCHEME_VIRIDIS,
    interpolateColors,
} from '@ripl/web';

// Build a 0–1 → color interpolator from a scheme's stops.
const viridis = interpolateColors(COLOR_SCHEME_VIRIDIS);

viridis(0); // first stop
viridis(0.5); // midpoint color
viridis(1); // last stop
```

`interpolateColors` accepts any array of color stops, so you can pass your own palette just as easily.

## Color Scales

`scaleSequential` maps a **numeric** domain through a color interpolator (or an array of stops, such as a `COLOR_SCHEME_*` palette). Values are clamped to the domain, and the returned scale exposes `domain`, `ticks()`, and the underlying `interpolator` (handy for rendering a legend gradient).

```ts
import {
    COLOR_SCHEME_VIRIDIS,
    scaleSequential,
} from '@ripl/web';

const color = scaleSequential(COLOR_SCHEME_VIRIDIS, [0, 100]);

color(0); // first stop
color(50); // midpoint color
color(100); // last stop
color.ticks(5); // [0, 25, 50, 75, 100]
```

Passing a **three-element** domain `[min, neutral, max]` produces a diverging scale — `neutral` maps to the interpolator's midpoint, so signed data reads symmetrically around a reference value:

```ts
import {
    COLOR_SCHEME_RDBU,
    scaleSequential,
} from '@ripl/web';

const anomaly = scaleSequential(COLOR_SCHEME_RDBU, [-5, 0, 5]);

anomaly(-5); // deep red
anomaly(0); // neutral midpoint
anomaly(5); // deep blue
```

This is exactly how the heatmap chart and its continuous-color legend translate values into color. Tick generation defers to an underlying continuous scale; formatting is always left to the caller and is never bound to the scale.

## Internal Representation

All colors are internally represented as RGBA tuples:

```ts
type ColorRGBA = [red: number, green: number, blue: number, alpha: number];
```

- `red`, `green`, `blue`: 0–255
- `alpha`: 0–1
