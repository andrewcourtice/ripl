---
outline: "deep"
---

# Color

Ripl includes a complete color toolkit for parsing, converting, and serializing colors across multiple color spaces. Any CSS color string you pass to `fill` or `stroke` is automatically parsed — but you can also use the color utilities directly for programmatic color manipulation, palette generation, and animation.

> [!NOTE]
> For the full API, see the [Color API Reference](/docs/api/core/color).

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
    serialiseHEX,
    serialiseHSL,
    serialiseRGB,
    serialiseRGBA,
    setColorAlpha,
} from '@ripl/core';

const rgba = parseColor('#3a86ff');
// [58, 134, 255, 1]

serialiseHEX(...rgba); // '#3a86ff'
serialiseRGB(...rgba); // 'rgb(58, 134, 255)'
serialiseRGBA(...rgba); // 'rgba(58, 134, 255, 1)'
serialiseHSL(...rgba); // 'hsl(216, 100%, 61%)'

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
    serialiseHEX,
    serialiseHSL,
    serialiseRGBA,
    setColorAlpha,
} from '@ripl/core';

import type {
    Context,
    ColorRGBA,
} from '@ripl/core';

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
                `HEX: ${serialiseHEX(...rgba)}`,
                `RGB: ${serialiseRGBA(...rgba)}`,
                `HSL: ${serialiseHSL(...rgba)}`,
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

| Space | Parse | Serialise | Example |
| --- | --- | --- | --- |
| HEX | `parseHEX` | `serialiseHEX` | `#3a86ff`, `#3a86ff80` |
| RGB | `parseRGB` | `serialiseRGB` | `rgb(58, 134, 255)` |
| RGBA | `parseRGBA` | `serialiseRGBA` | `rgba(58, 134, 255, 0.5)` |
| HSL | `parseHSL` | `serialiseHSL` | `hsl(216, 100%, 61%)` |
| HSLA | `parseHSLA` | `serialiseHSLA` | `hsla(216, 100%, 61%, 0.5)` |
| HSV | `parseHSV` | `serialiseHSV` | `hsv(216, 77%, 100%)` |
| HSVA | `parseHSVA` | `serialiseHSVA` | `hsva(216, 77%, 100%, 0.5)` |

## Parsing Colors

`parseColor` auto-detects the format and returns an RGBA tuple `[r, g, b, a]`:

```ts
import {
    parseColor,
} from '@ripl/core';

parseColor('#3a86ff'); // [58, 134, 255, 1]
parseColor('rgb(58, 134, 255)'); // [58, 134, 255, 1]
parseColor('hsl(216, 100%, 61%)'); // [58, 134, 255, 1]
```

For a specific format, use the named parser:

```ts
import {
    parseHEX,
    parseRGB,
} from '@ripl/core';

parseHEX('#ff006e'); // [255, 0, 110, 1]
parseRGB('rgb(255, 0, 110)'); // [255, 0, 110, 1]
```

## Serializing Colors

Serializers convert RGBA channel values back to a color string:

```ts
import {
    serialiseHEX,
    serialiseRGBA,
} from '@ripl/core';

serialiseHEX(58, 134, 255, 1); // '#3a86ff'
serialiseRGBA(58, 134, 255, 1); // 'rgba(58, 134, 255, 1)'
```

## Color Space Conversion

Convert between color spaces using the conversion utilities:

```ts
import {
    hslToRGBA,
    hsvToRGBA,
    rgbaToHSL,
    rgbaToHSV,
} from '@ripl/core';

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
} from '@ripl/core';

setColorAlpha('#3a86ff', 0.5); // 'rgba(58, 134, 255, 0.5)'
setColorAlpha('rgb(255, 0, 110)', 0.8); // 'rgba(255, 0, 110, 0.8)'
```

## Color Interpolation

When animating between colors via `renderer.transition()`, Ripl uses `interpolateColor` under the hood. It parses both colors to RGBA, interpolates each channel linearly, and serializes back:

```ts
import {
    interpolateColor,
} from '@ripl/core';

const lerp = interpolateColor('#3a86ff', '#ff006e');
lerp(0); // 'rgba(58, 134, 255, 1)'
lerp(0.5); // 'rgba(157, 67, 162, 1)'
lerp(1); // 'rgba(255, 0, 110, 1)'
```

This happens automatically when transitioning `fill` or `stroke` between color values.

## Internal Representation

All colors are internally represented as RGBA tuples:

```ts
type ColorRGBA = [red: number, green: number, blue: number, alpha: number];
```

- `red`, `green`, `blue`: 0–255
- `alpha`: 0–1
