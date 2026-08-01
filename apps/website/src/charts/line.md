# Line Chart

The **Line Chart** renders one or more data series as smooth or straight lines with optional markers. Choose from 13 polyline interpolation modes (linear, monotone, cardinal, catmull-rom, step, and more) per series, and get crosshair tracking, grid lines, a legend, and tooltips out of the box. Data updates animate smoothly: points enter, exit, and reposition with configurable transitions.

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
            <RiplField label="Line type" option="lineType">
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
            <RiplField label="Line style" option="lineStyle">
                <RiplSelect v-model="extras.lineStyle">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                    <option value="segmented">Segmented</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Line width" option="lineWidth">
                <RiplInputRange
                    v-model="extras.lineWidth"
                    :min="1"
                    :max="5"
                    :step="0.5"
                />
            </RiplField>
            <RiplField label="Markers" option="markers" inline>
                <RiplSwitch v-model="extras.markers" />
            </RiplField>
            <RiplField
                v-if="extras.markers"
                label="Marker symbol"
                option="marker"
            >
                <RiplSelect v-model="extras.markerSymbol">
                    <option value="mixed">Mixed (per series)</option>
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                    <option value="diamond">Diamond</option>
                    <option value="triangle">Triangle</option>
                </RiplSelect>
            </RiplField>
            <RiplField
                v-if="extras.markers"
                label="Marker radius"
                option="markerRadius"
            >
                <RiplInputRange
                    v-model="extras.markerRadius"
                    :min="1"
                    :max="8"
                    :step="1"
                />
            </RiplField>
            <template #axes>
                <RiplField label="Time axis" option="axis" inline>
                    <RiplSwitch v-model="extras.timeAxis" />
                </RiplField>
                <RiplField label="Multiple axes" option="yAxis" inline>
                    <RiplSwitch v-model="extras.multiAxis" />
                </RiplField>
            </template>
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

// Three metrics in genuinely different units and magnitudes — dollars, a percentage, and thousands of
// units. On one shared axis the margin series is pinned flat against the baseline; that is the case
// the "Multiple axes" toggle exists to fix, so the sample data has to actually exhibit it.
const seriesMeta = [
    { id: 'revenue', label: 'Revenue' },
    { id: 'margin', label: 'Margin' },
    { id: 'units', label: 'Units' },
];

const { extras, reset } = useChartExtras({
    timeAxis: false,
    multiAxis: false,
    lineType: 'monotoneX' as PolylineRenderer,
    lineStyle: 'solid' as 'solid' | 'dashed' | 'dotted' | 'segmented',
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
        dataLabels: true,
        format: true,
        animation: true,
        theme: true,
        navigator: true,
        annotations: true,
    },
    title: 'Monthly Performance',
    axisX: 'Month',
    // Deliberately generic: with one shared axis it carries three different units at once. Turning on
    // "Multiple axes" replaces it with a per-metric title.
    axisY: 'Value',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function generateValues() {
    return {
        revenue: Math.round(Math.random() * 800 + 200),
        margin: Math.round(Math.random() * 35 + 5),
        units: Math.round(Math.random() * 3000 + 1500),
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

function activeData() {
    return extras.timeAxis ? timeData : monthData;
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

// Bounds are read off the live dataset so the demo survives adding, removing and the time axis.
function resolveLineStyle() {
    if (extras.lineStyle !== 'segmented') {
        return extras.lineStyle;
    }

    const key = activeKey();

    return [
        {
            from: (data: any[]) => data[Math.floor(data.length * 0.25)]?.[key],
            to: (data: any[]) => data[Math.floor(data.length * 0.5)]?.[key],
            style: 'dashed',
        },
        {
            from: (data: any[]) => data[Math.floor(data.length * 0.75)]?.[key],
            style: 'dotted',
        },
    ];
}

function getSeries() {
    return seriesMeta.map((s, index) => ({
        id: s.id,
        value: s.id,
        label: s.label,
        lineType: extras.lineType,
        lineStyle: resolveLineStyle(),
        lineWidth: extras.lineWidth,
        markers: extras.markers,
        marker: resolveMarker(index),
        markerRadius: extras.markerRadius,
        color: config.colors[s.id],
        // Bind each series to its own y-axis when multiple axes are enabled.
        yAxis: extras.multiAxis ? s.id : undefined,
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
    // left axes stack outward from the plot and the third sits on the right. Revenue stays on the
    // primary axis: the grid and the annotations below are drawn through it.
    if (extras.multiAxis) {
        options.axis = {
            ...options.axis,
            y: [
                {
                    ...options.axis.y,
                    id: 'revenue',
                    title: 'Revenue ($)',
                },
                {
                    id: 'margin',
                    visible: config.axesVisible,
                    title: 'Margin (%)',
                    position: 'right',
                },
                {
                    id: 'units',
                    visible: config.axesVisible,
                    title: 'Units',
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
            lineType: 'monotoneX',
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
    {
        month: 'Jan',
        revenue: 620,
        margin: 18,
        units: 2400,
    },
    {
        month: 'Feb',
        revenue: 780,
        margin: 24,
        units: 3100,
    },
    {
        month: 'Mar',
        revenue: 550,
        margin: 11,
        units: 1900,
    },
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
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            markers: true,
        },
        {
            id: 'units',
            value: 'units',
            label: 'Units',
            markers: true,
        },
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
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            lineType: 'monotoneX',
        },
        {
            id: 'units',
            value: 'units',
            label: 'Units',
            lineType: 'step',
        },
    ],
});
```

### Segmented line styles

`lineStyle` also accepts spans anchored to data keys, so one line can change style along its
length — actuals solid and a forecast dashed, say. The line is still a single polyline, so the
draw-on animation and point morphing are unaffected.

Pass an array of segments and everything they do not cover stays solid:

```ts
createLineChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            lineStyle: [
                {
                    from: 'Feb',
                    to: 'Jun',
                    style: 'dashed',
                },
                {
                    // A function receives the dataset and returns the key to anchor to.
                    from: data => data[data.length - 3].month,
                    style: 'dotted',
                },
            ],
        },
    ],
});
```

Or name the fallback explicitly with the object form:

```ts
createLineChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            lineStyle: {
                default: 'solid',
                segments: [
                    {
                        from: 'Feb',
                        to: 'Jun',
                        style: 'dashed',
                    },
                ],
            },
        },
    ],
});
```

`from` defaults to the start of the line and `to` — which is inclusive — to its end. Segments apply
in order, so a later one wins where two overlap, and a segment whose key is not in the data is
skipped rather than throwing, leaving that span at the default style.

> [!NOTE]
> A `basis` line is a B-spline that passes through none of its points, so there is no point at which
> to split it: a segmented `basis` line falls back to a single style. On a `cardinal` line a boundary
> on the second point resolves to the third, because its curve skips that point.

### Time x-axis

Set `axis.x.scale` to `'time'` to treat keys as dates: points are positioned continuously by timestamp (unevenly spaced samples sit proportionally to their dates, not evenly), and ticks are calendar-aligned `Date` values:

```ts
createLineChart('#container', {
    data: [
        {
            date: '2024-01-02',
            value: 34,
        },
        {
            date: '2024-01-05',
            value: 41,
        },
        {
            date: '2024-02-19',
            value: 28,
        },
    ],
    key: 'date',
    series: [
        {
            id: 'value',
            value: 'value',
            label: 'Value',
        },
    ],
    axis: {
        x: { scale: 'time' },
    },
});
```

### Marker symbols

Each series can render its markers with a distinct symbol shape (`'circle'`, `'square'`, `'diamond'`, or `'triangle'`; non-circle symbols are sized to the same visual area as the circle):

```ts
createLineChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            marker: 'circle',
        },
        {
            id: 'units',
            value: 'units',
            label: 'Units',
            marker: 'diamond',
        },
    ],
});
```

### Multiple y-axes

Supply an array of `axis.y` entries to render any number of y-axes, and bind each series to one with its `yAxis` option, naming the axis's `id`. Every axis scales independently to the extent of the series bound to it, so metrics with very different units and magnitudes stay readable on one plot. Axes with `position: 'right'` sit on the right of the plot; the rest default to the left, and axes on the same side stack outward in array order:

```ts
createLineChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            yAxis: 'revenue',
        },
        {
            id: 'margin',
            value: 'margin',
            label: 'Margin',
            yAxis: 'margin',
        },
        {
            id: 'units',
            value: 'units',
            label: 'Units',
            yAxis: 'units',
        },
    ],
    axis: {
        y: [
            {
                id: 'revenue',
                title: 'Revenue ($)',
            },
            {
                id: 'margin',
                title: 'Margin (%)',
                position: 'right',
            },
            {
                id: 'units',
                title: 'Units',
                position: 'left',
            },
        ],
    },
});
```

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createLineChart('#container', {
    data,
    key: 'month',
    labels: true,
    format: 'number',
    series: [
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            color: '#7cacf8',
            lineType: 'monotoneX',
            lineStyle: 'solid',
            lineWidth: 2,
            markers: true,
            marker: 'circle',
            markerRadius: 3,
            yAxis: 'revenue',
        },
        {
            id: 'margin',
            value: 'margin',
            label: 'Margin',
            color: '#6dd5b1',
            marker: 'diamond',
            yAxis: 'margin',
        },
    ],
    axis: {
        y: [
            {
                id: 'revenue',
                title: 'Revenue ($)',
            },
            {
                id: 'margin',
                position: 'right',
                title: 'Margin (%)',
            },
        ],
    },
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when a marker is clicked.
chart.on('markerclick', event => console.log(event.data)); // event.data: LineChartMarkerEvent
// Emitted when the pointer enters a marker.
chart.on('markerenter', event => console.log(event.data)); // event.data: LineChartMarkerEvent
// Emitted when the pointer leaves a marker.
chart.on('markerleave', event => console.log(event.data)); // event.data: LineChartMarkerEvent
```
<!-- events:end -->
