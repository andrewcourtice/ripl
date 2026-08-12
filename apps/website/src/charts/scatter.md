---
title: Scatter Chart
description: Plot x/y points across multiple series with optional sizeBy bubbles, min and max radius, marker symbols, dual-axis crosshair, grid lines and pan-zoom.
---

# Scatter Chart

The **Scatter Chart** plots each datum at its own x and y, so the reading is the relationship between two continuous measures — correlation, clustering, outliers — rather than a trend along an ordered axis. Add `sizeBy` and it becomes a bubble chart, encoding a third measure as marker area between `minRadius` and `maxRadius`. Each series binds its own `xBy`, `yBy`, `marker` and `yAxis`, and dual-axis crosshair tracking, a legend, grid lines and axis titles are built in. Dense scatters take [panning and zooming](/charts/advanced/panning-and-zooming) via `navigator`, and points animate on entry, update and exit. The [target](/charts/advanced/rendering-targets) can be a Canvas, an SVG context or a terminal.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="removeData">Remove Data</RiplButton>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="resetView">Reset View</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Bubbles" :extras-reset="reset">
            <RiplField label="Size by value" inline option="sizeBy">
                <RiplSwitch v-model="extras.sizeBy" />
            </RiplField>
            <RiplField label="Min radius" option="minRadius">
                <RiplInputRange v-model="extras.minRadius" :min="2" :max="20" :step="1" />
            </RiplField>
            <RiplField
                v-if="extras.sizeBy"
                label="Max radius"
                option="maxRadius"
            >
                <RiplInputRange
                    v-model="extras.maxRadius"
                    :min="5"
                    :max="30"
                    :step="1"
                />
            </RiplField>
            <RiplField label="Marker symbol" option="marker">
                <RiplSelect v-model="extras.markerSymbol">
                    <option value="mixed">Mixed (per series)</option>
                    <option value="circle">Circle</option>
                    <option value="square">Square</option>
                    <option value="diamond">Diamond</option>
                    <option value="triangle">Triangle</option>
                </RiplSelect>
            </RiplField>
            <template #axes>
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
    createScatterChart,
} from '@ripl/charts';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    ref,
    watch,
} from 'vue';

const seriesMeta = [
    {
        id: 'sales',
        label: 'Sales',
        xBy: 'sales',
        yBy: 'profit',
        sizeBy: 'volume',
    },
    {
        id: 'marketing',
        label: 'Marketing',
        xBy: 'marketing',
        yBy: 'engagement',
        sizeBy: 'reach',
    },
    {
        id: 'support',
        label: 'Support',
        xBy: 'support',
        yBy: 'satisfaction',
        sizeBy: 'tickets',
    },
];

const { extras, reset } = useChartExtras({
    sizeBy: true,
    minRadius: 5,
    maxRadius: 15,
    markerSymbol: 'circle' as 'mixed' | 'circle' | 'square' | 'diamond' | 'triangle',
    multiAxis: true,
});

// Distinct per-series symbols used by the "Mixed" marker option.
const SERIES_SYMBOLS = ['circle', 'diamond', 'triangle'];

function resolveMarker(index: number) {
    if (extras.markerSymbol === 'mixed') {
        return SERIES_SYMBOLS[index % SERIES_SYMBOLS.length];
    }

    return extras.markerSymbol;
}

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        axes: true,
        axisScale: true,
        grid: true,
        tooltip: true,
        crosshair: true,
        format: true,
        animation: true,
        theme: true,
        navigator: true,
        annotations: true,
        dataLabels: true,
    },
    title: 'Channel Performance',
    axisX: 'X Value',
    axisY: 'Y Value',
    crosshairAxis: 'both',
    navigatorEnabled: true,
    colors: seedColors(seriesMeta.map(s => s.id)),
});

let data = Array.from({ length: 20 }, getDataItem);

function getSeries() {
    return seriesMeta.map((s, index) => ({
        id: s.id,
        label: s.label,
        xBy: s.xBy,
        yBy: s.yBy,
        sizeBy: extras.sizeBy ? s.sizeBy : undefined,
        minRadius: extras.minRadius,
        maxRadius: extras.maxRadius,
        marker: resolveMarker(index),
        color: config.colors[s.id],
        // Marketing plots impressions in the thousands, so it gets the right-hand axis.
        yAxis: extras.multiAxis && s.id === 'marketing' ? 'impressions' : undefined,
    }));
}

function buildOptions() {
    const options = {
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // A second `axis.y` entry renders a right-hand axis for the impressions series.
    if (extras.multiAxis) {
        options.axis = {
            ...options.axis,
            y: [
                {
                    ...options.axis.y,
                    id: 'score',
                    title: 'Score',
                },
                {
                    id: 'impressions',
                    visible: config.axesVisible,
                    title: 'Impressions',
                    position: 'right',
                },
            ],
        };
    }

    // Sample reference line + shaded band, drawn through the y scale.
    options.annotations = config.annotationsVisible
        ? [
            {
                axis: 'y',
                value: 50,
                label: 'Median',
            },
            {
                type: 'band',
                axis: 'y',
                from: 70,
                to: 100,
                label: 'High',
            },
        ]
        : [];

    return options;
}

const example = ref();

const {
    chart,
    contextChanged,
} = useRiplChart(context => createScatterChart(context, {
    data,
    key: 'id',
    ...buildOptions(),
}));

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function getValue(min: number, max: number) {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100;
}

function getDataItem() {
    return {
        id: stringUniqueId(),
        sales: getValue(10, 100),
        profit: getValue(10, 100),
        volume: getValue(5, 50),
        marketing: getValue(10, 100),
        // Thousands, against the 10-100 the others plot; turning "Multiple axes" off flattens them.
        engagement: getValue(2000, 9000),
        reach: getValue(5, 50),
        support: getValue(10, 100),
        satisfaction: getValue(10, 100),
        tickets: getValue(5, 50),
    };
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

function randomize() {
    data = data.map(value => ({
        ...getDataItem(),
        id: value.id,
    }));

    chart.value?.update({ data });
}

function resetView() {
    chart.value?.navigator?.reset();
}
</script>

> [!TIP]
> This chart has the **navigator** enabled. Scroll to zoom toward the cursor and click-and-hold to
> pan (⌘/Ctrl-drag works too). Use **Reset View** to return to the default framing.

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
    {
        id: 'a',
        sales: 42,
        profit: 78,
        volume: 15,
    },
    {
        id: 'b',
        sales: 68,
        profit: 35,
        volume: 30,
    },
    {
        id: 'c',
        sales: 91,
        profit: 52,
        volume: 8,
    },
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
            maxRadius: 15,
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
        {
            id: 'sales',
            label: 'Sales',
            xBy: 'sales',
            yBy: 'profit',
        },
        {
            id: 'marketing',
            label: 'Marketing',
            xBy: 'marketing',
            yBy: 'engagement',
        },
    ],
});
```

### Multiple y-axes

Supply an array of `axis.y` entries to plot series with different y units on their own independently-scaled axes. Bind each series to an axis with its `yAxis` option, naming the axis's `id`; `position: 'right'` axes sit on the right and same-side axes stack outward in array order:

```ts
createScatterChart('#container', {
    data,
    key: 'id',
    series: [
        {
            id: 'sales',
            label: 'Sales',
            xBy: 'spend',
            yBy: 'revenue',
            yAxis: 'revenue',
        },
        {
            id: 'efficiency',
            label: 'Efficiency',
            xBy: 'spend',
            yBy: 'roas',
            yAxis: 'roas',
        },
    ],
    axis: {
        y: [
            {
                id: 'revenue',
                title: 'Revenue ($)',
            },
            {
                id: 'roas',
                position: 'right',
                title: 'ROAS (×)',
            },
        ],
    },
});
```

### Pan & zoom (navigator)

Set `navigator: true` to make the plot explorable: wheel-zoom toward the cursor and click-and-hold
to pan, with the axis domains rescaling as the view changes (no data rebuild). Pass an object to tune
which interactions are active:

```ts
const chart = createScatterChart('#container', {
    data,
    key: 'id',
    series: [/* ... */],
    navigator: {
        zoom: true,
        pan: true,
        brush: true,
    },
});

// The controller is available for imperative framing and brush-and-link:
chart.navigator?.fitBounds({ x0: 0, y0: 0, x1: 200, y1: 200 });
chart.navigator?.on('brushend', ({ data: extent }) => console.log(extent));
chart.navigator?.reset();
```

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createScatterChart('#container', {
    data,
    key: 'id',
    labels: true,
    format: 'number',
    series: [
        {
            id: 'sales',
            label: 'Sales',
            color: '#7cacf8',
            xBy: 'spend',
            yBy: 'revenue',
            // Scales each bubble between `minRadius` and `maxRadius`.
            sizeBy: 'volume',
            minRadius: 4,
            maxRadius: 20,
            marker: 'circle',
            yAxis: 'revenue',
        },
        {
            id: 'reach',
            label: 'Reach',
            color: '#6dd5b1',
            xBy: 'spend',
            yBy: 'impressions',
            yAxis: 'impressions',
        },
    ],
    axis: {
        y: [
            {
                id: 'revenue',
                title: 'Revenue ($)',
            },
            {
                id: 'impressions',
                position: 'right',
                title: 'Impressions',
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
// Emitted when a bubble is clicked.
chart.on('markerclick', event => console.log(event.data)); // event.data: ScatterChartMarkerEvent
// Emitted when the pointer enters a bubble.
chart.on('markerenter', event => console.log(event.data)); // event.data: ScatterChartMarkerEvent
// Emitted when the pointer leaves a bubble.
chart.on('markerleave', event => console.log(event.data)); // event.data: ScatterChartMarkerEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightMarker` applies the treatment hovering a bubble does — that bubble grows and the rest of the
chart dims — without waiting for a pointer. A bare key is the item's `key`, so it lights that item in
every series at once; `{ key, series }` narrows it to one, and an accessor receives the chart's data
when it is easier to address a bubble by position. `{ tooltip: true }` opens the tooltip where
hovering would (the shared axis tooltip when `tooltip.trigger` is `'axis'`), and `{ crosshair: true }`
places the crosshair on the bubble.

```ts
const chart = createScatterChart('#container', { data, key: 'id', series });

// Light item `a` in every series, with its tooltip and the crosshair.
chart.highlightMarker('a', { tooltip: true, crosshair: true });

// Only the sales series' bubble, then the same item addressed by position.
chart.highlightMarker({ key: 'a', series: 'sales' });
chart.highlightMarker(data => data[2].id);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`, a legend toggle) or the next pointer hover restores the chart, and it
emits none of the `marker*` events above. `clearHighlight()` restores it explicitly, and
`highlightSeries('sales')` dims every other series exactly as hovering its legend entry does. Both
methods return `false` when nothing matched.
