---
outline: "deep"
---

# Gradients

Ripl supports CSS gradient strings directly in `fillStyle` and `strokeStyle` properties. The gradient syntax is parsed at render time and converted to the appropriate native gradient for the current context (Canvas or SVG).

## Supported Gradient Types

### Linear Gradient

```ts
const rect = createRect({
    fillStyle: 'linear-gradient(90deg, #3a86ff, #ff006e)',
    x: 0, y: 0, width: 200, height: 100,
});
```

The angle specifies the direction of the gradient. Common values:

| Angle | Direction |
| --- | --- |
| `0deg` | Bottom to top |
| `90deg` | Left to right |
| `180deg` | Top to bottom |
| `270deg` | Right to left |

### Radial Gradient

```ts
const circle = createCircle({
    fillStyle: 'radial-gradient(circle, #3a86ff, #ff006e)',
    cx: 100, cy: 100, radius: 80,
});
```

### Conic Gradient

```ts
const circle = createCircle({
    fillStyle: 'conic-gradient(from 0deg, #3a86ff, #ff006e, #3a86ff)',
    cx: 100, cy: 100, radius: 80,
});
```

## Color Stops

Color stops define the colors and their positions along the gradient. You can use any CSS color format:

```ts
// Implicit positions (evenly distributed)
'linear-gradient(90deg, red, green, blue)'

// Explicit positions
'linear-gradient(90deg, red 0%, green 30%, blue 100%)'

// Pixel positions
'linear-gradient(90deg, red 0px, blue 200px)'

// Multiple colors at the same position (hard stop)
'linear-gradient(90deg, red 50%, blue 50%)'
```

## Supported Color Formats

Gradient color stops accept:

- **Named colors** — `red`, `blue`, `transparent`, etc.
- **Hex** — `#ff0000`, `#f00`
- **RGB** — `rgb(255, 0, 0)`
- **RGBA** — `rgba(255, 0, 0, 0.5)`
- **HSL** — `hsl(0, 100%, 50%)`
- **HSLA** — `hsla(0, 100%, 50%, 0.5)`

## Repeating Gradients

Add the `repeating-` prefix to create repeating gradients:

```ts
'repeating-linear-gradient(45deg, #3a86ff 0px, #3a86ff 10px, #ff006e 10px, #ff006e 20px)'
```

## Using Gradients

Gradients work in both `fillStyle` and `strokeStyle`:

```ts
const rect = createRect({
    fillStyle: 'linear-gradient(135deg, #3a86ff, #8338ec)',
    strokeStyle: 'linear-gradient(135deg, #1a56db, #5b21b6)',
    lineWidth: 4,
    x: 50, y: 50, width: 200, height: 120,
});
```

## How It Works

When Ripl encounters a gradient string in a style property:

1. The string is **parsed** into a structured gradient object (type, angle, color stops, etc.)
2. The context converts it to a **native gradient**:
   - **Canvas**: Creates a `CanvasGradient` via `createLinearGradient` or `createRadialGradient`
   - **SVG**: Creates `<linearGradient>` or `<radialGradient>` elements in a `<defs>` block
3. The native gradient is applied as the fill or stroke style

Gradient parsing happens automatically — you just write CSS gradient strings and Ripl handles the rest.

## Gradient Interpolation

When animating between two gradient values using `renderer.transition()`, Ripl automatically interpolates between the gradient color stops:

```ts
await renderer.transition(rect, {
    duration: 1000,
    state: {
        fillStyle: 'linear-gradient(90deg, #ff006e, #fb5607)',
    },
});
```

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createRect,
    createCircle,
} from '@ripl/core';

const context = createContext('.mount-element');

createRect({
    fillStyle: 'linear-gradient(135deg, #3a86ff, #8338ec)',
    x: 50,
    y: 50,
    width: 200,
    height: 120,
}).render(context);

createCircle({
    fillStyle: 'radial-gradient(circle, #ff006e, #fb5607)',
    cx: 400,
    cy: 110,
    radius: 70,
}).render(context);
```
:::

<script lang="ts" setup>
import { createRect, createCircle, createText } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;
    const size = Math.min(w, h) / 3;

    const render = () => {
        context.markRenderStart();

        createRect({
            fillStyle: 'linear-gradient(135deg, #3a86ff, #8338ec)',
            x: w * 0.08, y: h / 2 - size / 2,
            width: size * 1.2, height: size,
            borderRadius: 8,
        }).render(context);

        createText({
            x: w * 0.08 + size * 0.6, y: h / 2 + size / 2 + 20,
            content: 'Linear', fillStyle: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createCircle({
            fillStyle: 'radial-gradient(circle, #ff006e, #fb5607)',
            cx: w * 0.55, cy: h / 2, radius: size / 2,
        }).render(context);

        createText({
            x: w * 0.55, y: h / 2 + size / 2 + 20,
            content: 'Radial', fillStyle: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        createRect({
            fillStyle: 'linear-gradient(90deg, #3a86ff 0%, #3a86ff 33%, #ff006e 33%, #ff006e 66%, #8338ec 66%, #8338ec 100%)',
            x: w * 0.72, y: h / 2 - size / 2,
            width: size * 1.2, height: size,
            borderRadius: 8,
        }).render(context);

        createText({
            x: w * 0.72 + size * 0.6, y: h / 2 + size / 2 + 20,
            content: 'Hard Stops', fillStyle: '#666',
            textAlign: 'center', font: '13px sans-serif',
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>
