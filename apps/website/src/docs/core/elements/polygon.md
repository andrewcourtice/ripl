---
outline: "deep"
---

# Polygon

A **Polygon** draws a regular polygon (triangle, pentagon, hexagon, etc.) defined by a center point (`cx`, `cy`), `radius` (distance from center to vertex), and `sides` count. Polygons are useful for badges, icons, radar chart backgrounds, and decorative shapes. Increase `sides` to approximate a circle, or use 3 for triangles, 5 for pentagons, 6 for hexagons, and so on.

## Example

:::tabs
== Demo
<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <span>Sides</span>
            <RiplInputRange v-model="sides" :min="3" :max="12" :step="1" @update:model-value="redraw" />
            <span>Radius</span>
            <RiplInputRange v-model="radiusPct" :min="20" :max="100" :step="1" @update:model-value="redraw" />
        </RiplControlGroup>
    </template>
</ripl-example>
== Code
```ts
import {
    createContext,
    createPolygon,
} from '@ripl/web';

const context = createContext('.mount-element');

createPolygon({
    fill: '#3a86ff',
    cx: 200,
    cy: 150,
    radius: 80,
    sides: 6,
}).render(context);
```
:::

<script lang="ts" setup>
import {
    useDemoElements,
    useRiplExample,
} from '../../../.vitepress/compositions/example';

import {
    createPolygon,
    createText,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    ref,
} from 'vue';

const NAMES: Record<number, string> = {
    3: 'Triangle',
    4: 'Square',
    5: 'Pentagon',
    6: 'Hexagon',
    7: 'Heptagon',
    8: 'Octagon',
    9: 'Nonagon',
    10: 'Decagon',
    11: 'Hendecagon',
    12: 'Dodecagon',
};

const sides = ref(6);
const radiusPct = ref(70);
let currentContext: Context | undefined;

// Built once, on first render, so ids stay stable and every id-keyed cache hits.
const getElements = useDemoElements(() => {
    const polygon = createPolygon({
        fill: '#3a86ff',
        stroke: '#1a56db',
        lineWidth: 2,
        cx: 0,
        cy: 0,
        radius: 0,
        sides: 3,
    });

    const label = createText({
        x: 0,
        y: 0,
        content: '',
        fill: '#666',
        textAlign: 'center',
        font: '12px sans-serif',
    });

    return {
        polygon,
        label,
    };
});

function renderDemo(context: Context) {
    const {
        polygon,
        label,
    } = getElements();

    const w = context.width;
    const h = context.height;
    const r = Math.min(w, h) / 3 * (radiusPct.value / 100);

    polygon.cx = w / 2;
    polygon.cy = h / 2;
    polygon.radius = r;
    polygon.sides = sides.value;

    label.x = w / 2;
    label.y = h / 2 + r + 24;
    label.content = `${NAMES[sides.value] || sides.value + '-gon'}  (${sides.value} sides, r=${Math.round(r)})`;

    context.batch(() => {
        polygon.render(context);
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
</script>

## Usage

```ts
import {
    createPolygon,
} from '@ripl/web';

const hexagon = createPolygon({
    fill: '#3a86ff',
    cx: 200,
    cy: 150,
    radius: 80,
    sides: 6,
});
```

## Properties

The polygon's geometry is defined by `cx`, `cy`, `radius`, and `sides`.

> [!NOTE]
> For the full property list, see the [Polygon API Reference](/docs/api/@ripl/core/).
