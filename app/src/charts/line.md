# Line Chart

The **Line Chart** renders one or more data series as smooth or straight lines with optional markers. Choose from 13 polyline interpolation modes (linear, monotone, cardinal, catmull-rom, step, and more) per series, and get crosshair tracking, grid lines, a legend, and tooltips out of the box. Data updates animate smoothly — points enter, exit, and reposition with configurable transitions.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addPoint">Add Point</RiplButton>
            <RiplButton @click="removePoint">Remove Point</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Line" :extras-reset="reset">
            <RiplField label="Line type">
                <RiplSelect v-model="extras.lineType">
                    <option value="linear">Linear</option>
                    <option value="spline">Spline</option>
                    <option value="basis">Basis</option>
                    <option value="cardinal">Cardinal</option>
                    <option value="catmullRom">Catmull-Rom</option>
                    <option value="natural">Natural</option>
                    <option value="monotoneX">Monotone X</option>
                    <option value="monotoneY">Monotone Y</option>
                    <option value="bumpX">Bump X</option>
                    <option value="bumpY">Bump Y</option>
                    <option value="step">Step</option>
                    <option value="stepBefore">Step Before</option>
                    <option value="stepAfter">Step After</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Line style">
                <RiplSelect v-model="extras.lineStyle">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Line width">
                <RiplInputRange v-model="extras.lineWidth" :min="1" :max="5" :step="0.5" />
            </RiplField>
            <RiplField label="Markers" inline>
                <RiplSwitch v-model="extras.markers" />
            </RiplField>
            <RiplField v-if="extras.markers" label="Marker radius">
                <RiplInputRange v-model="extras.markerRadius" :min="1" :max="8" :step="1" />
            </RiplField>
        </RiplChartConfig>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../.vitepress/compositions/example';

import {
    buildCommonOptions,
    seedColors,
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createLineChart,
} from '@ripl/charts';

import type {
    PolylineRenderer,
} from '@ripl/web';

import {
    ref,
    watch,
} from 'vue';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const seriesMeta = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'profit', label: 'Profit' },
    { id: 'expenses', label: 'Expenses' },
];

const { extras, reset } = useChartExtras({
    lineType: 'monotoneX' as PolylineRenderer,
    lineStyle: 'solid' as 'solid' | 'dashed' | 'dotted',
    lineWidth: 2,
    markers: true,
    markerRadius: 3,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        axes: true,
        grid: true,
        tooltip: true,
        crosshair: true,
        format: true,
        animation: true,
        theme: true,
        navigator: true,
        annotations: true,
    },
    title: 'Monthly Performance',
    axisX: 'Month',
    axisY: 'Amount ($)',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function generateData(count = 8) {
    return MONTHS.slice(0, count).map(month => ({
        month,
        revenue: Math.round(Math.random() * 800 + 200),
        profit: Math.round(Math.random() * 450 + 100),
        expenses: Math.round(Math.random() * 300 + 150),
    }));
}

let data = generateData();

function getSeries() {
    return seriesMeta.map(s => ({
        id: s.id,
        value: s.id,
        label: s.label,
        lineType: extras.lineType,
        lineStyle: extras.lineStyle,
        lineWidth: extras.lineWidth,
        markers: extras.markers,
        markerRadius: extras.markerRadius,
        color: config.colors[s.id],
    }));
}

function buildOptions() {
    const options = {
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // Sample reference line + shaded band, drawn through the y scale.
    options.annotations = config.annotationsVisible
        ? [
            {
                axis: 'y',
                value: 600,
                label: 'Target',
            },
            {
                type: 'band',
                axis: 'y',
                from: 0,
                to: 300,
                label: 'Baseline',
            },
        ]
        : [];

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createLineChart(context, {
        data,
        key: 'month',
        padding: { top: 30, right: 20, bottom: 30, left: 20 },
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


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
</script>

## Usage

```ts
import {
    createLineChart,
} from '@ripl/charts';

const chart = createLineChart('#container', {
    data: [/* ... */],
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
- **`series`** — Array of series with `id`, `value`, `label`, optional `color`, `lineType`, `lineStyle` (`'solid'` \| `'dashed'` \| `'dotted'` \| custom dash array), `lineWidth`, `markers` (show/hide point markers, default `true`), `markerRadius`
- **`key`** — Key accessor for each data point
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines (default `true`)
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair (default `true`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend (shown by default for multiple series, at the bottom)
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips (default `true`)
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes
- **`overview`** — `boolean | { size }` — Show the navigator scrub bar beneath the plot; enabling it also turns on category-axis (horizontal) pan/zoom on the plot
- **`padding`** — Chart padding
