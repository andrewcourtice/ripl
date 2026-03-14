---
outline: "deep"
---

# Rect

A **Rect** draws a rectangle defined by position (`x`, `y`) and dimensions (`width`, `height`), with optional rounded corners via `borderRadius`. Rects are one of the most versatile shapes in Ripl — used for backgrounds, cards, bar chart segments, progress indicators, and layout scaffolding. The `borderRadius` property accepts a single number for uniform rounding or a `[topLeft, topRight, bottomRight, bottomLeft]` array for per-corner control.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Width</span>
            <RiplInputRange v-model="widthPct" :min="20" :max="100" :step="1" @update:model-value="redraw" />
            <span>Height</span>
            <RiplInputRange v-model="heightPct" :min="20" :max="100" :step="1" @update:model-value="redraw" />
            <span>Border Radius</span>
            <RiplInputRange v-model="borderRadiusVal" :min="0" :max="40" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createContext,
    createRect,
} from '@ripl/web';

const context = createContext('.mount-element');

createRect({
    fill: '#3a86ff',
    x: 50,
    y: 50,
    width: 200,
    height: 120,
    borderRadius: 8,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createRect,
    createText,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    ref,
} from 'vue';

const widthPct = ref(60);
const heightPct = ref(50);
const borderRadiusVal = ref(8);
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const rw = w * 0.7 * (widthPct.value / 100);
    const rh = h * 0.6 * (heightPct.value / 100);

    context.batch(() => {
        createRect({
            fill: '#3a86ff',
            x: w / 2 - rw / 2,
            y: h / 2 - rh / 2,
            width: rw,
            height: rh,
            borderRadius: borderRadiusVal.value,
        }).render(context);

        createText({
            x: w / 2, y: h / 2 + rh / 2 + 22,
            content: `${Math.round(rw)}×${Math.round(rh)}  radius: ${borderRadiusVal.value}`,
            fill: '#666', textAlign: 'center', font: '12px sans-serif',
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
</script>

## Usage

```ts
import {
    createRect,
} from '@ripl/web';

const rect = createRect({
    fill: '#3a86ff',
    x: 50,
    y: 50,
    width: 200,
    height: 120,
});
```

## Properties

The rect's geometry is defined by `x`, `y`, `width`, `height`, and optional `borderRadius`.

> [!NOTE]
> For the full property list, see the [Rect API Reference](/docs/api/@ripl/core/).
