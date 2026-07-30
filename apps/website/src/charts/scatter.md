# Scatter Chart

The **Scatter Chart** (also known as a bubble chart when using variable sizes) plots data points on a two-dimensional plane, with optional size variation via `sizeBy` to represent a third dimension. It supports multiple series, crosshair tracking on both axes, a legend, grid lines, and configurable axis titles. Data points animate smoothly on entry, exit, and update.

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
            <RiplField label="Size by value" inline>
                <RiplSwitch v-model="extras.sizeBy" />
            </RiplField>
            <RiplField label="Min radius">
                <RiplInputRange v-model="extras.minRadius" :min="2" :max="20" :step="1" />
            </RiplField>
            <RiplField v-if="extras.sizeBy" label="Max radius">
                <RiplInputRange v-model="extras.maxRadius" :min="5" :max="40" :step="1" />
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
});

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
    return seriesMeta.map(s => ({
        id: s.id,
        label: s.label,
        xBy: s.xBy,
        yBy: s.yBy,
        sizeBy: extras.sizeBy ? s.sizeBy : undefined,
        minRadius: extras.minRadius,
        maxRadius: extras.maxRadius,
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
        engagement: getValue(10, 100),
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

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createScatterChart('#container', {
    data,   // TData[]
    series, // ScatterChartSeriesOptions<TData>[]
    key,    // keyof TData | ((item: TData) => string)
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface ScatterChartOptions<TData> {
    // Chart-specific
    /** The dataset plotted across all series. */
    data: TData[];

    /** The series to render, each mapping the data to x/y (and optional size) positions. */
    series: ScatterChartSeriesOptions<TData>[];

    /** Accessor for each item's unique key, used to match bubbles across data updates. */
    key: keyof TData | ((item: TData) => string);

    /**
     * Show value labels next to each bubble. `true` uses the default anchor; a string sets the
     * anchor side.
     */
    labels?: ChartDataLabelsInput;

    /** Format applied to bubble values shown as text (tooltips and labels). */
    format?: ValueFormatInput;

    // Shared by every chart (BaseChartOptions)
    /**
     * Whether the chart renders automatically on construction and after every `Chart.update`.
     * Defaults to `true`.
     */
    autoRender?: boolean;

    /**
     * Space reserved around the chart, in pixels. A single number applies to all four edges; a
     * `[top, right, bottom, left]` tuple or a partial `{ top, right, bottom, left }` object sets
     * individual edges, leaving unspecified edges at the default. Defaults to `16`.
     */
    padding?: PaddingInput;

    /** Chart title as plain text, or a `ChartTitleOptions` object for full control. */
    title?: string | Partial<ChartTitleOptions>;

    /** Animation configuration, or a boolean toggling all transitions. See `ChartAnimationOptions`. */
    animation?: boolean | Partial<ChartAnimationOptions>;

    /**
     * Theme for this chart: a registered name (`'light'`/`'dark'`/`'auto'`), or a `Theme`. Falls
     * back to the module default (see `setDefaultTheme`).
     */
    theme?: string | Theme;

    /**
     * Accessible description announced by screen readers (sets the rendering element's ARIA
     * label). Defaults to the title text.
     */
    description?: string;

    // Shared by every cartesian chart (CartesianChartOptions)
    /** X/y axis configuration, or a boolean toggling both axes. See `ChartAxisInput`. */
    axis?: ChartAxisInput<TData>;

    /** Background grid configuration, or a boolean toggle. See `ChartGridInput`. */
    grid?: ChartGridInput;

    /** Hover-tooltip configuration, or a boolean toggle. See `ChartTooltipInput`. */
    tooltip?: ChartTooltipInput;

    /** Legend configuration, a position string, or a boolean toggle. See `ChartLegendInput`. */
    legend?: ChartLegendInput;

    /** Crosshair configuration, or a boolean toggle. See `ChartCrosshairInput`. */
    crosshair?: ChartCrosshairInput;

    /** Reference lines, shaded bands, and point markers drawn over the plot. See `ChartAnnotation`. */
    annotations?: ChartAnnotation[];

    /**
     * Enables pan/zoom (and optionally brush) navigation on the plot. `true` turns on wheel-zoom
     * and click-drag pan; an object configures each interaction individually. The chart
     * auto-creates a `DOMNavigator` on its context and rescales the axis domains as the view
     * changes, with no data rebuild. Access the underlying controller via `chart.navigator` for
     * imperative framing (`centerOn`/`fitBounds`) or brush-and-link.
     */
    navigator?: boolean | NavigatorInteractions;

    /**
     * Enables an overview "scrub bar" strip beside the plot with a draggable window that selects
     * the visible range of the **category** axis (a bottom bar for category-on-x charts, a side
     * bar for a horizontal bar chart). `true` uses the default size; an object sets it. Enabling
     * the strip also turns on in-plot wheel/drag pan-zoom (category-axis only) unless `navigator`
     * is explicitly `false`. Only category-axis charts (line, area, bar, trend) render the strip.
     */
    overview?: boolean | ChartOverviewOptions;
}

interface ScatterChartSeriesOptions<TData> {
    /** Unique identifier for the series. */
    id: string;

    /** Optional color override for the series (otherwise a palette color is generated). */
    color?: string;

    /** Accessor for each item's value on the x-axis. */
    xBy: NumericAccessor<TData>;

    /** Accessor for each item's value on the y-axis. */
    yBy: NumericAccessor<TData>;

    /** Optional accessor whose value scales each bubble's size between `minRadius` and `maxRadius`. */
    sizeBy?: NumericAccessor<TData> | number;

    /** Display label for the series, or an accessor deriving a per-item label. */
    label: string | ((item: TData) => string);

    /** Smallest bubble radius in pixels. Defaults to 3. */
    minRadius?: number;

    /** Largest bubble radius in pixels when `sizeBy` is set. Defaults to 20. */
    maxRadius?: number;

    /**
     * Which y-axis this series binds to: an index into `axis.y` or a y-axis `id`. Defaults to the
     * primary axis.
     */
    yAxis?: number | string;

    /**
     * Bubble symbol shape: `'circle'` (default), `'square'`, `'diamond'`, or `'triangle'`.
     * Non-circle symbols are sized to the same visual area as the circle.
     */
    marker?: SymbolType;
}

interface ScatterChartEventMap {
    /** Emitted when a bubble is clicked. */
    markerclick: ScatterChartMarkerEvent;

    /** Emitted when the pointer enters a bubble. */
    markerenter: ScatterChartMarkerEvent;

    /** Emitted when the pointer leaves a bubble. */
    markerleave: ScatterChartMarkerEvent;
}
```
<!-- options:end -->

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
