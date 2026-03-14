# Scatter Chart

The **Scatter Chart** (also known as a bubble chart when using variable sizes) plots data points on a two-dimensional plane, with optional size variation via `sizeBy` to represent a third dimension. It supports multiple series, crosshair tracking on both axes, a legend, grid lines, and configurable axis titles. Data points animate smoothly on entry, exit, and update.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="removeData">Remove Data</RiplButton>
            <RiplButton @click="randomise">Randomise</RiplButton>
        </RiplControlGroup>
    </template>    
</ripl-example>

<script lang="ts" setup>
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    createScatterChart,
} from '@ripl/charts';

import {
    scaleContinuous,
} from '@ripl/web';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    ref,
} from 'vue';

const xScale = scaleContinuous([0, 1], [0, 100]);
const yScale = scaleContinuous([0, 1], [0, 100]);
const sizeScale = scaleContinuous([0, 1], [5, 50]);

let data = Array.from({ length: 20 }, getDataItem);

const {
    chart,
    contextChanged,
} = useRiplChart(context => createScatterChart(context, {
    data,
    key: 'id',
    axis: {
        x: { title: 'X Value' },
        y: { title: 'Y Value' },
    },
    series: [
        {
            id: 'sales',
            label: 'Sales',
            xBy: 'sales',
            yBy: 'profit',
            sizeBy: 'volume',
            minRadius: 5,
            maxRadius: 25,
        },
        {
            id: 'marketing',
            label: 'Marketing',
            xBy: 'marketing',
            yBy: 'engagement',
            sizeBy: 'reach',
            minRadius: 5,
            maxRadius: 25,
        },
        {
            id: 'support',
            label: 'Support',
            xBy: 'support',
            yBy: 'satisfaction',
            sizeBy: 'tickets',
            minRadius: 5,
            maxRadius: 25,
        },
    ],
}));

function getDataItem() {
    return {
        id: stringUniqueId(),
        sales: getValue(xScale),
        profit: getValue(yScale),
        volume: getValue(sizeScale),
        marketing: getValue(xScale),
        engagement: getValue(yScale),
        reach: getValue(sizeScale),
        support: getValue(xScale),
        satisfaction: getValue(yScale),
        tickets: getValue(sizeScale),
    };
}

function getValue(scale: any) {
    return Math.round(scale(Math.random()) * 100) / 100;
}

function addData() {
    data.push(getDataItem());
    chart.value?.update({ data });
}

function removeData() {
    if (data.length > 1) {
        data.splice(Math.floor(Math.random() * data.length), 1);
        chart.value?.update({ data });
    }
}

function randomise() {
    data = data.map(value => ({
        ...getDataItem(),
        id: value.id,
    }));

    chart.value?.update({ data });
}
</script>

## Usage

```ts
import {
    createScatterChart,
} from '@ripl/charts';

const chart = createScatterChart('#container', {
    data,
    key: 'id',
    series: [
        {
            id: 'sales',
            label: 'Sales',
            xBy: 'sales',
            yBy: 'profit',
        },
    ],
});
```

## Data Format

Each item needs a unique `key` and numeric fields for x/y position (and optionally size):

```ts
const data = [
    { id: 'a',
        sales: 42,
        profit: 78,
        volume: 15 },
    { id: 'b',
        sales: 68,
        profit: 35,
        volume: 30 },
    { id: 'c',
        sales: 91,
        profit: 52,
        volume: 8 },
];
```

Each series maps `xBy` and `yBy` to numeric fields, and optionally `sizeBy` for bubble sizing.

## Variants

### Bubble chart

Add `sizeBy`, `minRadius`, and `maxRadius` to enable bubble sizing:

```ts
createScatterChart('#container', {
    data,
    key: 'id',
    series: [
        {
            id: 'sales',
            label: 'Sales',
            xBy: 'sales',
            yBy: 'profit',
            sizeBy: 'volume',
            minRadius: 5,
            maxRadius: 25,
        },
    ],
});
```

### Multi-series

Plot multiple series on the same axes for comparison:

```ts
createScatterChart('#container', {
    data,
    key: 'id',
    series: [
        { id: 'sales',
            label: 'Sales',
            xBy: 'sales',
            yBy: 'profit' },
        { id: 'marketing',
            label: 'Marketing',
            xBy: 'marketing',
            yBy: 'engagement' },
    ],
});
```

## Options

- **`data`** — The data array
- **`key`** — Unique identifier field for each point
- **`series`** — Array of series with `id`, `label`, `xBy`, `yBy`, optional `sizeBy`, `minRadius`, `maxRadius`, `color`
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines (default `true`)
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair (default `true`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips (default `true`)
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes with optional titles
