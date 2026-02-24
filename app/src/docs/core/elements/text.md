---
outline: "deep"
---

# Text

A **Text** element renders a text string at a given position. Unlike other built-in elements, Text extends `Element` directly (not `Shape`) because it uses the context's text rendering API rather than a path.

## Usage

```ts
import { createText } from '@ripl/core';

const text = createText({
    fillStyle: '#333333',
    x: 100,
    y: 100,
    content: 'Hello, Ripl!',
    font: '24px sans-serif',
    textAlign: 'center',
    textBaseline: 'middle',
});
```

## Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| `x` | `number` | Yes | X coordinate |
| `y` | `number` | Yes | Y coordinate |
| `content` | `string \| number` | Yes | The text to render |
| `pathData` | `string` | No | SVG path `d` string to render text along |
| `startOffset` | `number` | No | Position along the path to start text (0–1) |

The following inherited style properties are particularly relevant for text:

| Property | Type | Description |
| --- | --- | --- |
| `font` | `string` | CSS font string (e.g. `'16px sans-serif'`) |
| `textAlign` | `'start' \| 'end' \| 'left' \| 'right' \| 'center'` | Horizontal alignment relative to `x` |
| `textBaseline` | `'top' \| 'hanging' \| 'middle' \| 'alphabetic' \| 'ideographic' \| 'bottom'` | Vertical alignment relative to `y` |
| `fillStyle` | `string` | Text fill color (renders filled text) |
| `strokeStyle` | `string` | Text stroke color (renders stroked/outlined text) |

> [!NOTE]
> If `strokeStyle` is set, the text is stroked (outlined). If `fillStyle` is set, the text is filled. If both are set, `strokeStyle` takes priority.

## Demo

:::tabs
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createText,
} from '@ripl/core';

const context = createContext('.mount-element');

createText({
    fillStyle: '#3a86ff',
    x: context.width / 2,
    y: context.height / 2,
    content: 'Hello, Ripl!',
    font: '32px sans-serif',
    textAlign: 'center',
    textBaseline: 'middle',
}).render(context);
```
:::

## Text on Path

Text can be rendered along an arbitrary path by providing a `pathData` string (an SVG path `d` attribute). The text follows the curve of the path, with each character positioned and rotated to match the path direction. This works with both SVG and Canvas contexts.

Use `startOffset` (0–1) to control where along the path the text begins.

:::tabs
== Demo
<ripl-example @context-changed="pathContextChanged"></ripl-example>
== Code
```ts
import {
    createContext,
    createText,
} from '@ripl/core';

const context = createContext('.mount-element');
const w = context.width;
const h = context.height;

createText({
    fillStyle: '#3a86ff',
    content: 'Text along a curved path!',
    font: 'bold 20px sans-serif',
    pathData: `M ${w * 0.05},${h * 0.5} C ${w * 0.3},${h * 0.1} ${w * 0.7},${h * 0.9} ${w * 0.95},${h * 0.5}`,
}).render(context);
```
:::

<script lang="ts" setup>
import { createText } from '@ripl/core';
import { useRiplExample } from '../../../.vitepress/compositions/example';

const {
    contextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;

    const render = () => {
        context.markRenderStart();

        createText({
            fillStyle: '#3a86ff',
            x: w / 2, y: h * 0.3,
            content: 'Filled Text',
            font: 'bold 28px sans-serif',
            textAlign: 'center', textBaseline: 'middle',
        }).render(context);

        createText({
            strokeStyle: '#ff006e',
            lineWidth: 1,
            x: w / 2, y: h * 0.55,
            content: 'Stroked Text',
            font: 'bold 28px sans-serif',
            textAlign: 'center', textBaseline: 'middle',
        }).render(context);

        createText({
            fillStyle: '#666',
            x: w / 2, y: h * 0.8,
            content: `Context: ${context.type} | Size: ${Math.round(w)}×${Math.round(h)}`,
            font: '14px sans-serif',
            textAlign: 'center', textBaseline: 'middle',
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});

const {
    contextChanged: pathContextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;

    const render = () => {
        context.markRenderStart();

        createText({
            fillStyle: '#3a86ff',
            x: 0, y: 0,
            content: 'Text along a curved path!',
            font: 'bold 20px sans-serif',
            pathData: `M ${w * 0.05},${h * 0.5} C ${w * 0.3},${h * 0.1} ${w * 0.7},${h * 0.9} ${w * 0.95},${h * 0.5}`,
        }).render(context);

        createText({
            strokeStyle: '#ff006e',
            lineWidth: 1,
            x: 0, y: 0,
            content: 'Stroked text on an arc',
            font: 'bold 18px sans-serif',
            pathData: `M ${w * 0.1},${h * 0.85} A ${w * 0.4},${w * 0.4} 0 0 1 ${w * 0.9},${h * 0.85}`,
        }).render(context);

        context.markRenderEnd();
    };

    render();
    context.on('resize', () => { context.clear(); render(); });
});
</script>
