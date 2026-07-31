# Scatter Chart

The **Scatter Chart** (also known as a bubble chart when using variable sizes) plots data points on a two-dimensional plane, with optional size variation via `sizeBy` to represent a third dimension. It supports multiple series, crosshair tracking on both axes, a legend, grid lines, and configurable axis titles. Data points animate smoothly on entry, exit, and update.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

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
                    :max="40"
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
    maxRadius: 25,
    markerSymbol: 'circle' as 'mixed' | 'circle' | 'square' | 'diamond' | 'triangle',
    multiAxis: false,
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
        yAxis: extras.multiAxis && s.id === 'marketing' ? 1 : undefined,
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
                options.axis.y,
                {
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
        // Thousands of impressions, against the 10-100 scores the other series plot. On one shared
        // y-axis this flattens every other series against the baseline; that is the case the
        // "Multiple axes" toggle resolves.
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

Supply an array of `axis.y` entries to plot series with different y units on their own independently-scaled axes. Bind each series to an axis with its `yAxis` option (an array index or the axis `id`); `position: 'right'` axes sit on the right and same-side axes stack outward in array order:

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
            yAxis: 0,
        },
        {
            id: 'efficiency',
            label: 'Efficiency',
            xBy: 'spend',
            yBy: 'roas',
            yAxis: 1,
        },
    ],
    axis: {
        y: [
            { title: 'Revenue ($)' },
            { position: 'right', title: 'ROAS (×)' },
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

- **`data`**: the data array
- **`key`**: unique identifier field for each point
- **`series`**: array of series with `id`, `label`, `xBy`, `yBy`, optional `sizeBy`, `minRadius`, `maxRadius`, `color`
- **`grid`** (`boolean | ChartGridOptions`): show/configure grid lines (default `true`)
- **`crosshair`** (`boolean | ChartCrosshairOptions`): show/configure crosshair (default `true`)
- **`legend`** (`boolean | ChartLegendOptions`): show/configure legend
- **`tooltip`** (`boolean | ChartTooltipOptions`): show/configure tooltips (default `true`)
- **`axis`** (`boolean | ChartAxisOptions`): configure x/y axes with optional titles (`y` accepts an array for multiple y-axes)
- **`series[].yAxis`**: binds a series to a secondary y-axis by index or id (defaults to the primary axis)
- **`navigator`** (`boolean | NavigatorInteractions`): enable pan/zoom (and optional brush) navigation. Access the controller via `chart.navigator`
