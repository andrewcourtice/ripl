---
outline: "deep"
---

# Ellipse

An **Ellipse** draws an elliptical shape with independent X and Y radii (`radiusX`, `radiusY`), intrinsic `rotation`, and optional `startAngle`/`endAngle` for partial ellipses. Use ellipses when you need non-uniform curvature — for example, orbit paths, oval indicators, or stylized backgrounds.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Radius X</span>
            <RiplInputRange v-model="rxPct" :min="10" :max="100" :step="1" @update:model-value="redraw" />
            <span>Radius Y</span>
            <RiplInputRange v-model="ryPct" :min="10" :max="100" :step="1" @update:model-value="redraw" />
            <span>Rotation</span>
            <RiplInputRange v-model="rotationDeg" :min="0" :max="360" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createContext,
    createEllipse,
} from '@ripl/web';

const context = createContext('.mount-element');

createEllipse({
    fill: '#3a86ff',
    cx: 200,
    cy: 150,
    radiusX: 100,
    radiusY: 60,
    rotation: Math.PI / 6,
    startAngle: 0,
    endAngle: Math.PI * 2,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createEllipse,
    createText,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    ref,
} from 'vue';

const TAU = Math.PI * 2;
const rxPct = ref(70);
const ryPct = ref(45);
const rotationDeg = ref(0);
let currentContext: Context | undefined;

function renderDemo(context: Context) {
    const w = context.width;
    const h = context.height;
    const maxR = Math.min(w, h) / 3;
    const rx = maxR * (rxPct.value / 100);
    const ry = maxR * (ryPct.value / 100);

    context.batch(() => {
        createEllipse({
            fill: '#3a86ff',
            cx: w / 2, cy: h / 2,
            radiusX: rx, radiusY: ry,
            rotation: rotationDeg.value * Math.PI / 180,
            startAngle: 0, endAngle: TAU,
        }).render(context);

        createText({
            x: w / 2, y: h / 2 + maxR + 24,
            content: `rx: ${Math.round(rx)}  ry: ${Math.round(ry)}  rotation: ${rotationDeg.value}°`,
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
    createEllipse,
} from '@ripl/web';

const ellipse = createEllipse({
    fill: '#3a86ff',
    cx: 200,
    cy: 150,
    radiusX: 100,
    radiusY: 60,
    rotation: 0,
    startAngle: 0,
    endAngle: Math.PI * 2,
});
```

## Properties

The ellipse's geometry is defined by `cx`, `cy`, `radiusX`, `radiusY`, `rotation`, `startAngle`, and `endAngle`.

> [!NOTE]
> For the full property list, see the [Ellipse API Reference](/docs/api/@ripl/core/).
