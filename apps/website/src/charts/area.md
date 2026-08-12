---
title: Area Chart
description: Fill the band beneath one or more line series, stacked or overlaid, with per-series fill opacity and interpolation, plus crosshair, grid, tooltips and a legend.
---

# Area Chart

The **Area Chart** fills the band between each line series and the baseline, so a total reads as area rather than as height. Use it when the composition of a total over time is the point: `stacked: true` stacks the series into that whole, `stacked: 'percent'` normalizes each category to 100%, and leaving it off overlays them. Each series carries its own `fillOpacity`, `lineType` and `markers`, and the chart draws a crosshair, grid, tooltips and a legend. Overlaid areas are painted largest-first so a smaller area is never hidden behind a larger one. On entry the area is revealed left-to-right as the line draws on, and it transitions between data states on update. It renders to Canvas, SVG or a [terminal context](/charts/advanced/rendering-targets) from the same options.

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
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Area" :extras-reset="reset">
            <RiplField label="Mode" option="stacked">
                <RiplSelect v-model="extras.stackMode">
                    <option value="overlaid">Overlaid</option>
                    <option value="stacked">Stacked</option>
                    <option value="percent">100% stacked</option>
                </RiplSelect>
            </RiplField>
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
            <RiplField label="Fill opacity" option="fillOpacity">
                <RiplInputRange
                    v-model="extras.fillOpacity"
                    :min="0"
                    :max="1"
                    :step="0.05"
                />
            </RiplField>
            <RiplField label="Markers" option="markers" inline>
                <RiplSwitch v-model="extras.markers" />
            </RiplField>
            <template #axes>
                <RiplField
                    v-if="extras.stackMode !== 'percent'"
                    label="Multiple axes"
                    option="yAxis"
                    inline
                >
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
    createAreaChart,
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
    { id: 'desktop', label: 'Desktop' },
    { id: 'mobile', label: 'Mobile' },
];

// Maps the drawer's three-way mode onto the chart's `stacked` option.
const STACK_MODE_VALUES = {
    overlaid: false,
    stacked: true,
    percent: 'percent',
} as const;

const { extras, reset } = useChartExtras({
    stackMode: 'overlaid' as keyof typeof STACK_MODE_VALUES,
    multiAxis: false,
    lineType: 'monotoneX' as PolylineRenderer,
    lineStyle: 'solid' as 'solid' | 'dashed' | 'dotted' | 'segmented',
    lineWidth: 2,
    fillOpacity: 0.3,
    markers: false,
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
    title: 'Traffic by Device',
    axisX: 'Month',
    axisY: 'Sessions',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function generateData(count = 6) {
    return MONTHS.slice(0, count).map(month => ({
        month,
        desktop: Math.round(Math.random() * 600 + 200),
        mobile: Math.round(Math.random() * 400 + 100),
    }));
}

let data = generateData();

// Percent stacking normalizes per axis group, so a second axis only applies to the other modes (the
// drawer hides the toggle in percent mode to match).
function multiAxisActive() {
    return extras.multiAxis && extras.stackMode !== 'percent';
}

// With multiple axes on, shrink the mobile series an order of magnitude so its units genuinely
// differ from desktop's and the right-hand axis is justified.
function activeData() {
    if (!multiAxisActive()) {
        return data;
    }

    return data.map(item => ({
        ...item,
        mobile: Math.round(item.mobile / 10),
    }));
}

// Bounds are read off the live dataset so the demo survives adding and removing points.
function resolveLineStyle() {
    if (extras.lineStyle !== 'segmented') {
        return extras.lineStyle;
    }

    return [
        {
            from: (data: any[]) => data[Math.floor(data.length * 0.25)]?.month,
            to: (data: any[]) => data[Math.floor(data.length * 0.5)]?.month,
            style: 'dashed',
        },
        {
            from: (data: any[]) => data[Math.floor(data.length * 0.75)]?.month,
            style: 'dotted',
        },
    ];
}

function getSeries() {
    const multiAxis = multiAxisActive();

    return seriesMeta.map(s => ({
        id: s.id,
        value: s.id,
        label: s.label,
        fillOpacity: extras.fillOpacity,
        lineType: extras.lineType,
        lineStyle: resolveLineStyle(),
        lineWidth: extras.lineWidth,
        markers: extras.markers,
        color: config.colors[s.id],
        yAxis: multiAxis && s.id === 'mobile' ? 'mobile' : undefined,
    }));
}

function buildOptions() {
    const options = {
        data: activeData(),
        stacked: STACK_MODE_VALUES[extras.stackMode],
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // A second `axis.y` entry renders a right-hand y-axis; the mobile series names it through its
    // `yAxis` option.
    if (multiAxisActive()) {
        options.axis = {
            ...options.axis,
            y: [
                {
                    ...options.axis.y,
                    id: 'desktop',
                },
                {
                    id: 'mobile',
                    visible: config.axesVisible,
                    title: 'Mobile (sessions)',
                },
            ],
        };
    }

    // Sample reference line + shaded band, drawn through the y scale.
    options.annotations = config.annotationsVisible
        ? [
            {
                axis: 'y',
                value: 500,
                label: 'Target',
            },
            {
                type: 'band',
                axis: 'y',
                from: 0,
                to: 200,
                label: 'Baseline',
            },
        ]
        : [];

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createAreaChart(context, {
        key: 'month',
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    data = generateData(data.length);
    chart.value?.update({ data: activeData() });
}

function addPoint() {
    if (data.length < MONTHS.length) {
        data = generateData(data.length + 1);
        chart.value?.update({ data: activeData() });
    }
}

function removePoint() {
    if (data.length > 2) {
        data = generateData(data.length - 1);
        chart.value?.update({ data: activeData() });
    }
}
</script>

## Usage

```ts
import {
    createAreaChart,
} from '@ripl/charts';

const chart = createAreaChart('#container', {
    data: [/* ... */],
    key: 'month',
    stacked: false,
    series: [
        { id: 'desktop', value: 'desktop', label: 'Desktop' },
        { id: 'mobile', value: 'mobile', label: 'Mobile' },
    ],
});
```

## Data Format

Each item should contain a key field and one or more numeric value fields:

```ts
const data = [
    {
        month: 'Jan',
        desktop: 620,
        mobile: 340,
    },
    {
        month: 'Feb',
        desktop: 780,
        mobile: 290,
    },
    {
        month: 'Mar',
        desktop: 550,
        mobile: 410,
    },
];
```

## Variants

### Stacked

Stack series to show cumulative totals:

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    stacked: true,
    series: [
        {
            id: 'desktop',
            value: 'desktop',
            label: 'Desktop',
            fillOpacity: 0.4,
        },
        {
            id: 'mobile',
            value: 'mobile',
            label: 'Mobile',
            fillOpacity: 0.4,
        },
    ],
});
```

### 100% stacked

Pass `stacked: 'percent'` to normalize each category to its share of the category total. The value axis is fixed to 0–100% and values default to percentage formatting:

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    stacked: 'percent',
    series: [
        {
            id: 'desktop',
            value: 'desktop',
            label: 'Desktop',
        },
        {
            id: 'mobile',
            value: 'mobile',
            label: 'Mobile',
        },
    ],
});
```

### Secondary y-axis

Supply a second `axis.y` entry to render a right-hand axis, and bind a series to it with the series `yAxis` option, naming the axis's `id`. When the chart is stacked, series stack per axis group:

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'sessions',
            value: 'sessions',
            label: 'Sessions',
        },
        {
            id: 'conversion',
            value: 'conversion',
            label: 'Conversion %',
            yAxis: 'conversion',
        },
    ],
    axis: {
        y: [
            {
                id: 'sessions',
                title: 'Sessions',
            },
            {
                id: 'conversion',
                title: 'Conversion %',
                format: 'percentage',
            },
        ],
    },
});
```

### Custom opacity and line type

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'desktop',
            value: 'desktop',
            label: 'Desktop',
            fillOpacity: 0.2,
            lineType: 'monotoneX',
        },
        {
            id: 'mobile',
            value: 'mobile',
            label: 'Mobile',
            fillOpacity: 0.6,
            lineType: 'step',
        },
    ],
});
```

### Segmented line styles

`lineStyle` also accepts spans anchored to data keys, so one line can change style along its
length — actuals solid and a forecast dashed, say. The line is still a single polyline, so the
draw-on animation and point morphing are unaffected.

```ts
createAreaChart('#container', {
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

`from` defaults to the start of the line and `to` — which is inclusive — to its end. Use the object
form to name the fallback style explicitly:

```ts
createAreaChart('#container', {
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

See the [line chart](/charts/line#segmented-line-styles) for the full rules.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createAreaChart('#container', {
    data,
    key: 'month',
    labels: true,
    format: 'number',
    // `stacked` shares one cumulative scale across a group, so it is shown on its own in Variants
    // above rather than combined with the second axis here.
    series: [
        {
            id: 'sessions',
            value: 'sessions',
            label: 'Sessions',
            color: '#7cacf8',
            lineType: 'monotoneX',
            lineStyle: 'solid',
            lineWidth: 2,
            fillOpacity: 0.3,
            markers: true,
            yAxis: 'sessions',
        },
        {
            id: 'conversion',
            value: 'conversion',
            label: 'Conversion %',
            color: '#6dd5b1',
            yAxis: 'conversion',
        },
    ],
    axis: {
        y: [
            {
                id: 'sessions',
                title: 'Sessions',
            },
            {
                id: 'conversion',
                position: 'right',
                title: 'Conversion %',
                format: 'percentage',
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
chart.on('markerclick', event => console.log(event.data)); // event.data: AreaChartMarkerEvent
// Emitted when the pointer enters a marker.
chart.on('markerenter', event => console.log(event.data)); // event.data: AreaChartMarkerEvent
// Emitted when the pointer leaves a marker.
chart.on('markerleave', event => console.log(event.data)); // event.data: AreaChartMarkerEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightMarker` puts a point into the same hover state the pointer would — the marker grows and
takes its highlight color — without waiting for one. A bare key is the category the point sits on,
so it lights that point in every series at once; `{ key, series }` narrows it to one, and an
accessor receives the chart's data when it is easier to address a point by position. `{ tooltip:
true }` opens the tooltip where hovering would (the shared axis tooltip when `tooltip.trigger` is
`'axis'`), and `{ crosshair: true }` places the crosshair on the marker. Series drawn with `markers:
false` have nothing to highlight.

```ts
const chart = createAreaChart('#container', { data, key: 'month', series });

// Light February in every series, with its tooltip and the crosshair.
chart.highlightMarker('Feb', { tooltip: true, crosshair: true });

// Only the desktop series' point, then the same point addressed by position.
chart.highlightMarker({ key: 'Feb', series: 'desktop' });
chart.highlightMarker(data => data[1].month);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`, a legend toggle) or the next pointer hover restores the chart, and it
emits none of the `marker*` events above. `clearHighlight()` restores it explicitly, and
`highlightSeries('desktop')` dims every other series exactly as hovering its legend entry does. Both
methods return `false` when nothing matched.