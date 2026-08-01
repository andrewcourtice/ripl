---
outline: "deep"
---

# Text

A **Text** element renders a text string at a given position. Unlike other built-in elements, Text extends `Element` directly (not `Shape`) because it uses the context's text rendering API rather than a path. Text supports both filled and stroked rendering, and can follow arbitrary SVG paths via the `pathData` property, which is perfect for curved labels, circular badges, and decorative typography.

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
} from '@ripl/web';

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
} from '@ripl/web';

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
    useDemoElements,
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createLine,
    createText,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    ref,
} from 'vue';

const fontSize = ref(28);
const textAlign = ref('center');
let currentContext: Context | undefined;

// Built once, on first render, so ids stay stable and every id-keyed cache hits.
const getElements = useDemoElements(() => {
    const guide = createLine({
        stroke: '#e9ecef',
        lineWidth: 1,
        lineDash: [4, 4],
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 0,
    });

    const filled = createText({
        fill: '#3a86ff',
        x: 0,
        y: 0,
        content: 'Filled Text',
        textBaseline: 'middle',
    });

    const stroked = createText({
        stroke: '#ff006e',
        lineWidth: 1,
        x: 0,
        y: 0,
        content: 'Stroked Text',
        textBaseline: 'middle',
    });

    const label = createText({
        fill: '#666',
        x: 0,
        y: 0,
        content: '',
        font: '13px sans-serif',
        textAlign: 'center',
        textBaseline: 'middle',
    });

    return {
        guide,
        filled,
        stroked,
        label,
    };
});

function renderDemo(context: Context) {
    const {
        guide,
        filled,
        stroked,
        label,
    } = getElements();

    const w = context.width;
    const h = context.height;

    const anchorX = textAlign.value === 'left' ? w * 0.1
        : textAlign.value === 'right' ? w * 0.9
            : w / 2;

    const font = `bold ${fontSize.value}px sans-serif`;
    const align = textAlign.value as CanvasTextAlign;

    guide.x1 = anchorX;
    guide.y1 = 0;
    guide.x2 = anchorX;
    guide.y2 = h;

    filled.x = anchorX;
    filled.y = h * 0.3;
    filled.font = font;
    filled.textAlign = align;

    stroked.x = anchorX;
    stroked.y = h * 0.55;
    stroked.font = font;
    stroked.textAlign = align;

    label.x = w / 2;
    label.y = h * 0.8;
    label.content = `font: ${fontSize.value}px  align: ${textAlign.value}`;

    context.batch(() => {
        guide.render(context);
        filled.render(context);
        stroked.render(context);
        label.render(context);
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

const curvedText = createText({
    fill: '#3a86ff',
    x: 0,
    y: 0,
    content: 'Text along a curved path!',
    font: 'bold 20px sans-serif',
});

const arcText = createText({
    stroke: '#ff006e',
    lineWidth: 1,
    x: 0,
    y: 0,
    content: 'Stroked text on an arc',
    font: 'bold 18px sans-serif',
});

const {
    contextChanged: pathContextChanged
} = useRiplExample(context => {
    const render = () => {
        const w = context.width;
        const h = context.height;

        curvedText.pathData = `M ${w * 0.05},${h * 0.5} C ${w * 0.3},${h * 0.1} ${w * 0.7},${h * 0.9} ${w * 0.95},${h * 0.5}`;
        arcText.pathData = `M ${w * 0.1},${h * 0.85} A ${w * 0.4},${w * 0.4} 0 0 1 ${w * 0.9},${h * 0.85}`;

        context.batch(() => {
            curvedText.render(context);
            arcText.render(context);
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
} from '@ripl/web';

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
