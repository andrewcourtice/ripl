# Line Chart

The **Line Chart** renders one or more data series as smooth or straight lines with optional markers. Choose from 13 polyline interpolation modes (linear, monotone, cardinal, catmull-rom, step, and more) per series, and get crosshair tracking, grid lines, a legend, and tooltips out of the box. Data updates animate smoothly — points enter, exit, and reposition with configurable transitions.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/charts/charts).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addPoint">Add Point</RiplButton>
            <RiplButton @click="removePoint">Remove Point</RiplButton>
            <RiplSelect v-model="lineType" @change="updateLineType">
                <option value="linear">Linear</option>
                <option value="monotoneX">Monotone X</option>
                <option value="natural">Natural</option>
                <option value="step">Step</option>
                <option value="cardinal">Cardinal</option>
                <option value="catmullRom">Catmull-Rom</option>
                <option value="bumpX">Bump X</option>
            </RiplSelect>
        </RiplControlGroup>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    createLineChart,
    LineChart,
} from '@ripl/charts';

import type {
    PolylineRenderer,
} from '@ripl/core';

import {
    ref,
} from 'vue';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const lineType = ref<PolylineRenderer>('monotoneX');

function generateData(count = 8) {
    return MONTHS.slice(0, count).map(month => ({
        month,
        revenue: Math.round(Math.random() * 800 + 200),
        profit: Math.round(Math.random() * 800 - 400),
        expenses: Math.round(Math.random() * 300 + 150),
    }));
}

let data = generateData();

const { contextChanged, chart } = useRiplChart(context => {
    return createLineChart(context, {
        data,
        key: 'month',
        padding: { top: 30, right: 20, bottom: 30, left: 20 },
        series: [
            {
                id: 'revenue',
                value: 'revenue',
                label: 'Revenue',
                lineType: lineType.value,
            },
            {
                id: 'profit',
                value: 'profit',
                label: 'Profit',
                lineType: lineType.value,
            },
            {
                id: 'expenses',
                value: 'expenses',
                label: 'Expenses',
                lineType: lineType.value,
            },
        ],
    });
});

function getSeries() {
    return [
        { id: 'revenue', value: 'revenue' as const, label: 'Revenue', lineType: lineType.value },
        { id: 'profit', value: 'profit' as const, label: 'Profit', lineType: lineType.value },
        { id: 'expenses', value: 'expenses' as const, label: 'Expenses', lineType: lineType.value },
    ];
}

function randomize() {
    data = generateData(data.length);
    chart.value?.update({ data });
}

function addPoint() {
    if (data.length < MONTHS.length) {
        data = generateData(data.length + 1);
        chart.value?.update({ data });
    }
}

function removePoint() {
    if (data.length > 2) {
        data = generateData(data.length - 1);
        chart.value?.update({ data });
    }
}

function updateLineType() {
    chart.value?.update({ series: getSeries() });
}
</script>

## Usage

```ts
import {
    createLineChart,
} from '@ripl/charts';

const chart = createLineChart('#container', {
    data: [...],
    key: 'month',
    series: [
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            lineType: 'monotone',
        },
    ],
});

// Update data
chart.update({ data: newData });
```

## Data Format

Each item should contain a key field and one or more numeric value fields:

```ts
const data = [
    { month: 'Jan',
        revenue: 620,
        expenses: 340 },
    { month: 'Feb',
        revenue: 780,
        expenses: 290 },
    { month: 'Mar',
        revenue: 550,
        expenses: 410 },
];
```

The `key` option identifies the x-axis category (`'month'`), and each series references a numeric field via `value`.

## Variants

### Multi-series with markers

```ts
createLineChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            markers: true },
        { id: 'expenses',
            value: 'expenses',
            label: 'Expenses',
            markers: true },
    ],
});
```

### Custom line interpolation

Each series can use a different polyline renderer:

```ts
createLineChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            lineType: 'monotoneX' },
        { id: 'expenses',
            value: 'expenses',
            label: 'Expenses',
            lineType: 'step' },
    ],
});
```

## Options

- **`data`** — The data array
- **`series`** — Array of series with `id`, `value`, `label`, optional `color`, `lineType`, `lineWidth`, `markers`, `markerRadius`
- **`key`** — Key accessor for each data point
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines (default `true`)
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair (default `true`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips (default `true`)
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes
- **`padding`** — Chart padding
