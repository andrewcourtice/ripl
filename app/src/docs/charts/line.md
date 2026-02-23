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
import { ref } from 'vue';
import type { PolylineRenderer } from '@ripl/core';
import { createLineChart, LineChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

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
        keyBy: 'month',
        padding: { top: 30, right: 20, bottom: 30, left: 20 },
        series: [
            {
                id: 'revenue',
                valueBy: 'revenue',
                labelBy: 'Revenue',
                lineType: lineType.value,
            },
            {
                id: 'profit',
                valueBy: 'profit',
                labelBy: 'Profit',
                lineType: lineType.value,
            },
            {
                id: 'expenses',
                valueBy: 'expenses',
                labelBy: 'Expenses',
                lineType: lineType.value,
            },
        ],
    });
});

function getSeries() {
    return [
        { id: 'revenue', valueBy: 'revenue' as const, labelBy: 'Revenue', lineType: lineType.value },
        { id: 'profit', valueBy: 'profit' as const, labelBy: 'Profit', lineType: lineType.value },
        { id: 'expenses', valueBy: 'expenses' as const, labelBy: 'Expenses', lineType: lineType.value },
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
import { createLineChart } from '@ripl/charts';

const chart = createLineChart('#container', {
    data: [...],
    keyBy: 'month',
    series: [
        {
            id: 'revenue',
            valueBy: 'revenue',
            labelBy: 'Revenue',
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
| `keyBy` | `keyof TData \| Function` | — | Key accessor for each data point |
| `showGrid` | `boolean` | `true` | Show horizontal grid lines |
| `showCrosshair` | `boolean` | `true` | Show vertical crosshair on hover |
| `showLegend` | `boolean` | `true` | Show legend for multi-series |
| `padding` | `Partial<ChartPadding>` | `10` all | Chart padding |

### Series Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | — | Unique series identifier |
| `valueBy` | `keyof TData \| Function` | — | Value accessor |
| `labelBy` | `string \| Function` | — | Label for tooltips/legend |
| `color` | `string` | auto | Series color |
| `lineType` | `PolylineRenderer` | `'linear'` | Line interpolation type |
| `lineWidth` | `number` | `2` | Line width |
| `showMarkers` | `boolean` | `true` | Show data point markers |
| `markerRadius` | `number` | `3` | Marker radius |
