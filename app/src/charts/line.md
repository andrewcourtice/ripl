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
            <RiplField label="Time axis" inline>
                <RiplSwitch v-model="extras.timeAxis" />
            </RiplField>
            <RiplField label="Multiple axes" inline>
                <RiplSwitch v-model="extras.multiAxis" />
            </RiplField>
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
            <RiplField v-if="extras.markers" label="Marker symbol">
                <RiplSelect v-model="extras.markerSymbol">
                    <option value="mixed">Mixed (per series)</option>
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                    <option value="diamond">Diamond</option>
                    <option value="triangle">Triangle</option>
                </RiplSelect>
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

// Deliberately irregular sample dates (clusters and gaps) so the time axis visibly repositions
// points by timestamp instead of spacing them evenly.
const TIME_POINTS = [
    '2024-01-02',
    '2024-01-04',
    '2024-01-05',
    '2024-01-26',
    '2024-02-14',
    '2024-02-17',
    '2024-03-08',
    '2024-03-30',
    '2024-04-02',
    '2024-04-03',
    '2024-04-27',
    '2024-05-19',
];

// Distinct per-series symbols used by the "Mixed" marker option.
const SERIES_SYMBOLS = ['circle', 'diamond', 'triangle'];

const seriesMeta = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'profit', label: 'Profit' },
    { id: 'expenses', label: 'Expenses' },
];

const { extras, reset } = useChartExtras({
    timeAxis: false,
    multiAxis: false,
    lineType: 'monotoneX' as PolylineRenderer,
    lineStyle: 'solid' as 'solid' | 'dashed' | 'dotted',
    lineWidth: 2,
    markers: true,
    markerSymbol: 'mixed' as 'mixed' | 'circle' | 'square' | 'diamond' | 'triangle',
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

function generateValues() {
    return {
        revenue: Math.round(Math.random() * 800 + 200),
        profit: Math.round(Math.random() * 450 + 100),
        expenses: Math.round(Math.random() * 300 + 150),
    };
}

function generateData(count = 8) {
    return MONTHS.slice(0, count).map(month => ({
        month,
        ...generateValues(),
    }));
}

function generateTimeData(count = 8) {
    return TIME_POINTS.slice(0, count).map(date => ({
        date,
        ...generateValues(),
    }));
}

let monthData = generateData();
let timeData = generateTimeData();

function baseData() {
    return extras.timeAxis ? timeData : monthData;
}

// With multiple axes on, push the three series into genuinely different ranges (dollars, a single-
// digit-ish percentage, and thousands of units) so each of the three independently-scaled y-axes is
// justified. Single-axis mode leaves the data untouched.
function activeData() {
    const rows = baseData();

    if (!extras.multiAxis) {
        return rows;
    }

    return rows.map(row => ({
        ...row,
        profit: Math.round(row.profit / 15),
        expenses: row.expenses * 10,
    }));
}

function activeKey() {
    return extras.timeAxis ? 'date' : 'month';
}

function regenerate(count: number) {
    if (extras.timeAxis) {
        timeData = generateTimeData(count);
    } else {
        monthData = generateData(count);
    }

    return activeData();
}

function resolveMarker(index: number) {
    if (extras.markerSymbol === 'mixed') {
        return SERIES_SYMBOLS[index % SERIES_SYMBOLS.length];
    }

    return extras.markerSymbol;
}

function getSeries() {
    return seriesMeta.map((s, index) => ({
        id: s.id,
        value: s.id,
        label: s.label,
        lineType: extras.lineType,
        lineStyle: extras.lineStyle,
        lineWidth: extras.lineWidth,
        markers: extras.markers,
        marker: resolveMarker(index),
        markerRadius: extras.markerRadius,
        color: config.colors[s.id],
        // Bind each series to its own y-axis when multiple axes are enabled.
        axis: extras.multiAxis ? index : undefined,
    }));
}

function buildOptions() {
    const options = {
        data: activeData(),
        key: activeKey(),
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // Continuous time positioning: date keys place each point proportionally to its timestamp
    // (the irregular gaps in TIME_POINTS make this obvious) with calendar-aligned Date ticks.
    if (extras.timeAxis) {
        options.axis = {
            ...options.axis,
            x: {
                ...options.axis.x,
                scale: 'time',
            },
        };
    }

    // Three independently-scaled y-axes. Each series binds to its own axis (see getSeries); the two
    // left axes stack outward from the plot and the third sits on the right.
    if (extras.multiAxis) {
        options.axis = {
            ...options.axis,
            y: [
                {
                    ...options.axis.y,
                    title: 'Revenue ($)',
                },
                {
                    visible: config.axesVisible,
                    title: 'Profit (%)',
                    position: 'right',
                },
                {
                    visible: config.axesVisible,
                    title: 'Expenses (units)',
                    position: 'left',
                },
            ],
        };
    }

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
        padding: { top: 30, right: 20, bottom: 30, left: 20 },
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    chart.value?.update({ data: regenerate(activeData().length) });
}

function addPoint() {
    const limit = extras.timeAxis ? TIME_POINTS.length : MONTHS.length;
    const count = activeData().length;

    if (count < limit) {
        chart.value?.update({ data: regenerate(count + 1) });
    }
}

function removePoint() {
    const count = activeData().length;

    if (count > 2) {
        chart.value?.update({ data: regenerate(count - 1) });
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

### Time x-axis

Set `axis.x.scale` to `'time'` to treat keys as dates: points are positioned continuously by timestamp (unevenly spaced samples sit proportionally to their dates, not evenly), and ticks are calendar-aligned `Date` values:

```ts
createLineChart('#container', {
    data: [
        { date: '2024-01-02',
            value: 34 },
        { date: '2024-01-05',
            value: 41 },
        { date: '2024-02-19',
            value: 28 },
    ],
    key: 'date',
    series: [
        { id: 'value',
            value: 'value',
            label: 'Value' },
    ],
    axis: {
        x: { scale: 'time' },
    },
});
```

### Marker symbols

Each series can render its markers with a distinct symbol shape (`'circle'`, `'square'`, `'diamond'`, or `'triangle'` — non-circle symbols are sized to the same visual area as the circle):

```ts
createLineChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            marker: 'circle' },
        { id: 'expenses',
            value: 'expenses',
            label: 'Expenses',
            marker: 'diamond' },
    ],
});
```

### Multiple y-axes

Supply an array of `axis.y` entries to render any number of y-axes, and bind each series to one with its `axis` option (an array index or the axis `id`). Every axis scales independently to the extent of the series bound to it, so metrics with very different units and magnitudes stay readable on one plot. Axes with `position: 'right'` sit on the right of the plot; the rest default to the left, and axes on the same side stack outward in array order:

```ts
createLineChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            axis: 0 },
        { id: 'margin',
            value: 'margin',
            label: 'Margin',
            axis: 1 },
        { id: 'units',
            value: 'units',
            label: 'Units',
            axis: 2 },
    ],
    axis: {
        y: [
            { title: 'Revenue ($)' },
            { title: 'Margin (%)',
                position: 'right' },
            { title: 'Units',
                position: 'left' },
        ],
    },
});
```

## Options

- **`data`** — The data array
- **`series`** — Array of series with `id`, `value`, `label`, optional `color`, `lineType`, `lineStyle` (`'solid'` \| `'dashed'` \| `'dotted'` \| custom dash array), `lineWidth`, `markers` (show/hide point markers, default `true`), `marker` (symbol shape: `'circle'` \| `'square'` \| `'diamond'` \| `'triangle'`), `markerRadius`, `axis` (y-axis index/id binding)
- **`key`** — Key accessor for each data point
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines (default `true`)
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair (default `true`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend (shown by default for multiple series, at the bottom)
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips (default `true`)
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes (`x.scale: 'time'` positions date keys continuously; `y` accepts an array for multiple y-axes)
- **`overview`** — `boolean | { size }` — Show the navigator scrub bar beneath the plot; enabling it also turns on category-axis (horizontal) pan/zoom on the plot
- **`padding`** — Chart padding
