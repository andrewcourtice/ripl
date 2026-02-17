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
== Code
```ts
import { createContext, createText } from '@ripl/core';

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
== Demo
<ripl-example @context-changed="contextChanged"></ripl-example>
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
</script>
