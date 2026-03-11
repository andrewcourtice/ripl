---
outline: "deep"
---

# Text

A **Text** element renders a text string at a given position. Unlike other built-in elements, Text extends `Element` directly (not `Shape`) because it uses the context's text rendering API rather than a path. Text supports both filled and stroked rendering, and can follow arbitrary SVG paths via the `pathData` property — perfect for curved labels, circular badges, and decorative typography.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Font Size</span>
            <RiplInputRange v-model="fontSize" :min="12" :max="48" :step="1" @update:model-value="redraw" />
            <RiplSelect v-model="textAlign" @change="redraw">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
            </RiplSelect>
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createContext,
    createText,
} from '@ripl/core';

const context = createContext('.mount-element');

createText({
    fill: '#3a86ff',
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
    fill: '#3a86ff',
    content: 'Text along a curved path!',
    font: 'bold 20px sans-serif',
    pathData: `M ${w * 0.05},${h * 0.5} C ${w * 0.3},${h * 0.1} ${w * 0.7},${h * 0.9} ${w * 0.95},${h * 0.5}`,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createLine,
    createText,
} from '@ripl/core';

import type {
    Context,
} from '@ripl/core';

import {
    ref,
} from 'vue';

const fontSize = ref(28);
const textAlign = ref('center');
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;

    context.batch(() => {
        const anchorX = textAlign.value === 'left' ? w * 0.1
            : textAlign.value === 'right' ? w * 0.9
                : w / 2;

        createLine({
            stroke: '#e9ecef', lineWidth: 1, lineDash: [4, 4],
            x1: anchorX, y1: 0, x2: anchorX, y2: h,
        }).render(context);

        createText({
            fill: '#3a86ff',
            x: anchorX, y: h * 0.3,
            content: 'Filled Text',
            font: `bold ${fontSize.value}px sans-serif`,
            textAlign: textAlign.value as CanvasTextAlign,
            textBaseline: 'middle',
        }).render(context);

        createText({
            stroke: '#ff006e',
            lineWidth: 1,
            x: anchorX, y: h * 0.55,
            content: 'Stroked Text',
            font: `bold ${fontSize.value}px sans-serif`,
            textAlign: textAlign.value as CanvasTextAlign,
            textBaseline: 'middle',
        }).render(context);

        createText({
            fill: '#666',
            x: w / 2, y: h * 0.8,
            content: `font: ${fontSize.value}px  align: ${textAlign.value}`,
            font: '13px sans-serif',
            textAlign: 'center', textBaseline: 'middle',
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

const {
    contextChanged: pathContextChanged
} = useRiplExample(context => {
    const w = context.width;
    const h = context.height;

    const render = () => {
        context.batch(() => {
            createText({
                fill: '#3a86ff',
                x: 0, y: 0,
                content: 'Text along a curved path!',
                font: 'bold 20px sans-serif',
                pathData: `M ${w * 0.05},${h * 0.5} C ${w * 0.3},${h * 0.1} ${w * 0.7},${h * 0.9} ${w * 0.95},${h * 0.5}`,
            }).render(context);

            createText({
                stroke: '#ff006e',
                lineWidth: 1,
                x: 0, y: 0,
                content: 'Stroked text on an arc',
                font: 'bold 18px sans-serif',
                pathData: `M ${w * 0.1},${h * 0.85} A ${w * 0.4},${w * 0.4} 0 0 1 ${w * 0.9},${h * 0.85}`,
            }).render(context);
        });
    };

    render();
    context.on('resize', render);
});
</script>

## Usage

```ts
import {
    createText,
} from '@ripl/core';

const text = createText({
    fill: '#333333',
    x: 100,
    y: 100,
    content: 'Hello, Ripl!',
    font: '24px sans-serif',
    textAlign: 'center',
    textBaseline: 'middle',
});
```

## Properties

The text element is defined by `x`, `y`, and `content`. Optional properties include `pathData` (SVG path string for text-on-path) and `startOffset` (0–1 position along the path). Style properties like `font`, `textAlign`, `textBaseline`, `fill`, and `stroke` control appearance.

> [!TIP]
> If `stroke` is set, the text is stroked (outlined). If `fill` is set, the text is filled. If both are set, `stroke` takes priority.

> [!NOTE]
> For the full property list, see the [Text API Reference](/docs/api/@ripl/core/).
