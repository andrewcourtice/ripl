# Bar Chart

The **Bar Chart** is one of the most versatile chart types in Ripl. It supports grouped and stacked modes, vertical and horizontal orientations, and handles animated entry, exit, and update transitions automatically when data changes. Tooltips on hover, a configurable legend, grid lines, and axis labels are all built in and enabled by default, so you get a polished result with minimal configuration.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addData">Add Month</RiplButton>
            <RiplButton @click="removeData">Remove Month</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Bars" :extras-reset="reset">
            <RiplField label="Mode">
                <RiplSelect v-model="extras.stackMode">
                    <option value="grouped">Grouped</option>
                    <option value="stacked">Stacked</option>
                    <option value="percent">100% stacked</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Horizontal" inline>
                <RiplSwitch v-model="extras.horizontal" />
            </RiplField>
            <RiplField label="Corner radius">
                <RiplInputRange v-model="extras.borderRadius" :min="0" :max="8" :step="1" />
            </RiplField>
            <RiplField label="X label rotation">
                <RiplInputRange v-model="extras.labelRotation" :min="0" :max="60" :step="15" />
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
    createBarChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const seriesMeta = [
    { id: 'sales', label: 'Sales' },
    { id: 'costs', label: 'Costs' },
    { id: 'profit', label: 'Profit' },
    { id: 'returns', label: 'Returns' },
];

let monthCount = 6;

// Maps the drawer's three-way mode onto the chart's `stacked` option.
const STACK_MODE_VALUES = {
    grouped: false,
    stacked: true,
    percent: 'percent',
} as const;

const { extras, reset } = useChartExtras({
    stackMode: 'grouped' as keyof typeof STACK_MODE_VALUES,
    horizontal: false,
    borderRadius: 2,
    labelRotation: 0,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        axes: true,
        grid: true,
        tooltip: true,
        dataLabels: true,
        format: true,
        animation: true,
        theme: true,
        navigator: true,
        annotations: true,
    },
    title: 'Monthly Breakdown',
    axisX: 'Month',
    axisY: 'Amount ($)',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function generateItem(month: string) {
    return {
        month,
        sales: Math.round(Math.random() * 500 + 100),
        costs: Math.round(Math.random() * 300 + 50),
        profit: Math.round(Math.random() * 400 - 200),
        returns: Math.round(Math.random() * 100 + 10),
    };
}

function generateData() {
    return MONTHS.slice(0, monthCount).map(m => generateItem(m));
}

let data = generateData();

function getSeries() {
    return seriesMeta.map(s => ({
        id: s.id,
        value: s.id,
        label: s.label,
        color: config.colors[s.id],
    }));
}

function buildOptions() {
    const options = {
        stacked: STACK_MODE_VALUES[extras.stackMode],
        orientation: extras.horizontal ? 'horizontal' : 'vertical',
        borderRadius: extras.borderRadius,
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // Tick label rotation (degrees, counterclockwise-positive) applies to the x-axis; the label
    // band grows to fit and fewer labels are dropped on overflow.
    options.axis = {
        ...options.axis,
        x: {
            ...options.axis.x,
            labelRotation: extras.labelRotation || undefined,
        },
    };

    options.annotations = config.annotationsVisible
        ? [
            {
                axis: 'y',
                value: 500,
                label: 'Target',
            },
        ]
        : [];

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createBarChart(context, {
        data,
        key: 'month',
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    data = generateData();
    chart.value?.update({ data });
}

function addData() {
    if (monthCount < MONTHS.length) {
        monthCount++;
        data = generateData();
        chart.value?.update({ data });
    }
}

function removeData() {
    if (monthCount > 2) {
        monthCount--;
        data = generateData();
        chart.value?.update({ data });
    }
}
</script>

## Usage

```ts
import {
    createBarChart,
} from '@ripl/charts';

const chart = createBarChart('#container', {
    data: [/* ... */],
    key: 'quarter',
    stacked: false,          // set true to stack series
    orientation: 'vertical', // 'vertical' | 'horizontal'
    series: [
        { id: 'sales', value: 'sales', label: 'Sales' },
        { id: 'costs', value: 'costs', label: 'Costs' },
    ],
});
```

## Data Format

Each item in the `data` array should contain a category key and one or more numeric fields for series values:

```ts
const data = [
    {
        month: 'Jan',
        sales: 420,
        costs: 280,
    },
    {
        month: 'Feb',
        sales: 380,
        costs: 310,
    },
    {
        month: 'Mar',
        sales: 510,
        costs: 250,
    },
];
```

The `key` option identifies the category field (`'month'`), and each series maps to a numeric field via its `value` property.

## Variants

### Grouped (default)

Bars for each series sit side-by-side within each category:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    stacked: false,
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
        {
            id: 'costs',
            value: 'costs',
            label: 'Costs',
        },
    ],
});
```

### Stacked

Bars stack on top of each other, showing cumulative totals:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    stacked: true,
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
        {
            id: 'costs',
            value: 'costs',
            label: 'Costs',
        },
    ],
});
```

### 100% stacked

Pass `stacked: 'percent'` to normalize each category to its share of the category total. The value axis is fixed to 0–100% and values default to percentage formatting:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    stacked: 'percent',
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
        {
            id: 'costs',
            value: 'costs',
            label: 'Costs',
        },
    ],
});
```

### Rotated x labels

Rotate crowded tick labels with `axis.x.labelRotation` (degrees; positive tilts labels up to the right):

```ts
createBarChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
    ],
    axis: {
        x: { labelRotation: 45 },
    },
});
```

### Multiple y-axes

Vertical **grouped** bars support any number of y-axes. Supply an array of `axis.y` entries and bind each series to one with its `yAxis` option (an array index or the axis `id`); `position: 'right'` axes sit on the right and same-side axes stack outward in array order. Each axis scales independently to the series bound to it:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            yAxis: 0,
        },
        {
            id: 'orders',
            value: 'orders',
            label: 'Orders',
            yAxis: 1,
        },
    ],
    axis: {
        y: [
            { title: 'Revenue ($)' },
            { position: 'right', title: 'Orders' },
        ],
    },
});
```

> [!NOTE]
> Multiple y-axes apply to vertical grouped bars only. Stacked bars share one cumulative value
> scale, and horizontal bars read categories along the y-axis, so both use the primary axis.

### Horizontal

Swap axes so bars extend horizontally:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    orientation: 'horizontal',
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
    ],
});
```

## Options

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createBarChart('#container', {
    data,   // TData[]
    series, // BarChartSeriesOptions<TData>[]
    key,    // keyof TData | ((item: TData) => string)
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface BarChartOptions<TData> {
    // Chart-specific
    /** The dataset rendered by the chart. */
    data: TData[];

    /** The series to draw from each data item. */
    series: BarChartSeriesOptions<TData>[];

    /** Accessor for each item's category key (the value plotted along the categorical axis). */
    key: keyof TData | ((item: TData) => string);

    /** Whether bars run vertically (default) or horizontally. */
    orientation?: BarChartOrientation;

    /**
     * Whether multiple series are stacked into a single bar per category (`true`) or grouped side
     * by side (default `false`). Pass `'percent'` for a 100%-stacked chart: each category's values
     * are normalized to their share of the category's positive total (negative values contribute
     * zero), the value axis is fixed to 0–100%, and values default to percentage formatting.
     */
    stacked?: boolean | 'percent';

    /** Corner radius in pixels applied to each bar. Defaults to 2. */
    borderRadius?: number;

    /**
     * Show value labels next to each bar. `true` uses the default anchor; a string sets the anchor
     * side.
     */
    labels?: ChartDataLabelsInput;

    /** Format applied to bar values shown as text (tooltips and labels). */
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

interface BarChartSeriesOptions<TData> {
    /** Unique identifier for the series, used for color assignment, legend, and data joins. */
    id: string;

    /** Explicit series color; falls back to the chart's generated palette when omitted. */
    color?: string;

    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;

    /** Human-readable series name shown in the legend and tooltips. */
    label: string;

    /**
     * Which y-axis this series binds to: an index into `axis.y` or a y-axis `id`. Defaults to the
     * primary axis. Takes effect for vertical grouped bars; stacked/percent modes and horizontal
     * orientation always render against the primary axis.
     */
    yAxis?: number | string;
}

interface BarChartEventMap {
    /** Emitted when a bar is clicked. */
    barclick: BarChartBarEvent;

    /** Emitted when the pointer enters a bar. */
    barenter: BarChartBarEvent;

    /** Emitted when the pointer leaves a bar. */
    barleave: BarChartBarEvent;
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
// Emitted when a bar is clicked.
chart.on('barclick', event => console.log(event.data)); // event.data: BarChartBarEvent
// Emitted when the pointer enters a bar.
chart.on('barenter', event => console.log(event.data)); // event.data: BarChartBarEvent
// Emitted when the pointer leaves a bar.
chart.on('barleave', event => console.log(event.data)); // event.data: BarChartBarEvent
```
<!-- events:end -->
