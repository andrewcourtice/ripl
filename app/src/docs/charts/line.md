# Line Chart

The `LineChart` renders one or more data series as smooth or straight lines with optional markers. It supports multiple series, grid lines, crosshair, legend, and tooltips out of the box.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="randomize">Randomize</button>
            <button class="ripl-button" @click="addPoint">Add Point</button>
            <button class="ripl-button" @click="removePoint">Remove Point</button>
            <select class="ripl-select" v-model="lineType" @change="updateLineType">
                <option value="linear">Linear</option>
                <option value="monotoneX">Monotone X</option>
                <option value="natural">Natural</option>
                <option value="step">Step</option>
                <option value="cardinal">Cardinal</option>
                <option value="catmullRom">Catmull-Rom</option>
                <option value="bumpX">Bump X</option>
            </select>
        </div>
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

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `data` | `TData[]` | — | The data array |
| `series` | `LineChartSeriesOptions[]` | — | Series configuration |
| `key` | `keyof TData \| Function` | — | Key accessor for each data point |
| `grid` | `boolean \| ChartGridOptions` | `true` | Show/configure grid lines |
| `crosshair` | `boolean \| ChartCrosshairOptions` | `true` | Show/configure crosshair |
| `legend` | `boolean \| ChartLegendOptions` | — | Show/configure legend |
| `tooltip` | `boolean \| ChartTooltipOptions` | `true` | Show/configure tooltips |
| `axis` | `boolean \| ChartAxisOptions` | `true` | Configure x/y axes |
| `padding` | `Partial<ChartPadding>` | `10` all | Chart padding |

### Series Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | — | Unique series identifier |
| `value` | `keyof TData \| Function` | — | Value accessor |
| `label` | `string \| Function` | — | Label for tooltips/legend |
| `color` | `string` | auto | Series color |
| `lineType` | `PolylineRenderer` | `'linear'` | Line interpolation type |
| `lineWidth` | `number` | `2` | Line width |
| `markers` | `boolean` | `true` | Show data point markers |
| `markerRadius` | `number` | `3` | Marker radius |
