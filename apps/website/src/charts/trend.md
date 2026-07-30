# Trend Chart

The **Trend Chart** is a true mixed cartesian chart that combines line, bar, and area series on shared axes. Each series declares its `type` (`'line'`, `'bar'`, or `'area'`) plus the options specific to that type, and the chart reuses the same renderers as the standalone line, bar, and area charts. Series paint back-to-front as **area → bar → line** so lines never hide behind fills or bars, and overlaid areas are drawn largest-first so smaller areas stay visible. Same-type series can be stacked, and an optional **navigator** strip beneath the plot lets you window the visible x-range (with wheel/drag pan-zoom on the plot itself).

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Trend" :extras-reset="reset">
            <RiplField label="Stacked" inline>
                <RiplSwitch v-model="extras.stacked" />
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
            <RiplField label="Corner radius">
                <RiplInputRange v-model="extras.borderRadius" :min="0" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Fill opacity">
                <RiplInputRange v-model="extras.fillOpacity" :min="0" :max="1" :step="0.05" />
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
    createTrendChart,
} from '@ripl/charts';

import type {
    TrendChartSeriesOptions,
} from '@ripl/charts';

import type {
    PolylineRenderer,
} from '@ripl/web';

import {
    ref,
    watch,
} from 'vue';

interface SalesRow {
    month: string;
    revenue: number;
    expenses: number;
    orders: number;
    target: number;
}

const seriesMeta = [
    { type: 'area' as const, id: 'revenue', label: 'Revenue', value: 'revenue' },
    { type: 'area' as const, id: 'expenses', label: 'Expenses', value: 'expenses' },
    { type: 'bar' as const, id: 'orders', label: 'Orders', value: 'orders' },
    { type: 'line' as const, id: 'target', label: 'Target', value: 'target' },
];

const { extras, reset } = useChartExtras({
    stacked: false,
    lineType: 'monotoneX' as PolylineRenderer,
    borderRadius: 2,
    fillOpacity: 0.25,
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
    },
    title: 'Sales Trend',
    axisY: 'Value',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function getSeries(): TrendChartSeriesOptions<SalesRow>[] {
    return seriesMeta.map(s => ({
        type: s.type,
        id: s.id,
        label: s.label,
        value: s.value,
        color: config.colors[s.id],
        ...(s.type === 'area' ? { fillOpacity: extras.fillOpacity } : {}),
        ...(s.type === 'bar' ? {} : { lineType: extras.lineType }),
    })) as TrendChartSeriesOptions<SalesRow>[];
}

function buildOptions() {
    return {
        stacked: extras.stacked,
        borderRadius: extras.borderRadius,
        series: getSeries(),
        ...buildCommonOptions(config),
    };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let data = Array.from({ length: MONTHS.length }, (_, index) => getDataItem(index));

const example = ref();

const {
    chart,
    contextChanged,
} = useRiplChart(context => createTrendChart(context, {
    data,
    key: 'month',
    ...buildOptions(),
}));

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function monthLabel(index: number): string {
    const year = 24 + Math.floor(index / MONTHS.length);
    return `${MONTHS[index % MONTHS.length]} '${year}`;
}

function getValue(min: number, max: number) {
    return Math.round(min + Math.random() * (max - min));
}

function rollValues() {
    return {
        revenue: getValue(400, 1000),
        expenses: getValue(120, 420),
        orders: getValue(60, 320),
        target: getValue(520, 900),
    };
}

function getDataItem(index: number): SalesRow {
    return {
        month: monthLabel(index),
        ...rollValues(),
    };
}

function addData() {
    data.push(getDataItem(data.length));
    chart.value?.update({ data });
}

function randomize() {
    data = data.map(item => ({
        month: item.month,
        ...rollValues(),
    }));

    chart.value?.update({ data });
}
</script>

## Usage

```ts
import {
    createTrendChart,
} from '@ripl/charts';

const chart = createTrendChart('#container', {
    data: [/* ... */],
    key: 'month',
    series: [
        { type: 'area', id: 'revenue', label: 'Revenue', value: 'revenue' },
        { type: 'bar', id: 'orders', label: 'Orders', value: 'orders' },
        { type: 'line', id: 'target', label: 'Target', value: 'target' },
    ],
});
```

## Data Format

A single flat dataset is shared by every series; each series reads its own numeric field via `value`, and `key` gives the category plotted along the x axis:

```ts
const data = [
    {
        month: 'Jan',
        revenue: 620,
        orders: 140,
        target: 700,
    },
    {
        month: 'Feb',
        revenue: 780,
        orders: 190,
        target: 720,
    },
    {
        month: 'Mar',
        revenue: 550,
        orders: 120,
        target: 680,
    },
];
```

## Variants

### Stacked

Same-type series stack independently, so bars stack among bar series and areas among area series:

```ts
createTrendChart('#container', {
    data,
    key: 'month',
    stacked: true,
    series: [
        { type: 'area', id: 'revenue', label: 'Revenue', value: 'revenue' },
        { type: 'area', id: 'expenses', label: 'Expenses', value: 'expenses' },
        { type: 'line', id: 'target', label: 'Target', value: 'target' },
    ],
});
```

### Navigator

Enable the overview strip to window the visible x-range (and pan/zoom on the plot):

```ts
createTrendChart('#container', {
    data,
    key: 'month',
    overview: true,
    series: [
        { type: 'bar', id: 'orders', label: 'Orders', value: 'orders' },
        { type: 'line', id: 'target', label: 'Target', value: 'target' },
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
createTrendChart('#container', {
    data,   // TData[]
    series, // TrendChartSeriesOptions<TData>[]
    key,    // keyof TData | ((item: TData) => string)
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface TrendChartOptions<TData> {
    // Chart-specific
    /** The dataset plotted across all series. */
    data: TData[];

    /** The series to render, mixing line, bar, and area types on shared axes. */
    series: TrendChartSeriesOptions<TData>[];

    /** Accessor for each item's category key (the value plotted along the x axis). */
    key: keyof TData | ((item: TData) => string);

    /** Stack same-type series cumulatively (bars among bars, areas among areas). Defaults to false. */
    stacked?: boolean;

    /** Corner radius in pixels applied to each bar. Defaults to 2. */
    borderRadius?: number;

    /**
     * Show value labels next to each mark. `true` uses the default anchor; a string sets the
     * anchor side.
     */
    labels?: ChartDataLabelsInput;

    /** Format applied to values shown as text (tooltips and labels). */
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

interface TrendChartLineSeriesOptions<TData> {
    // Chart-specific
    /** Discriminant marking this as a line series. */
    type: 'line';

    /** Renderer used to draw the line (e.g. straight or curved); defaults to straight segments. */
    lineType?: PolylineRenderer;

    /** Width in pixels of the series line. */
    lineWidth?: number;

    /** Line dash style: `'solid'` (default), `'dashed'`, `'dotted'`, or a custom dash array. */
    lineStyle?: LineStyle;

    /** Show point markers along the line. Defaults to `true`. */
    markers?: boolean;

    /** Radius in pixels of each point marker. Defaults to 3. */
    markerRadius?: number;

    // Inherited from TrendChartBaseSeriesOptions
    /** Unique identifier for the series, used for color assignment, legend, and data joins. */
    id: string;

    // Inherited from TrendChartBaseSeriesOptions
    /** Explicit series color; falls back to the chart's generated palette when omitted. */
    color?: string;

    // Inherited from TrendChartBaseSeriesOptions
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;

    // Inherited from TrendChartBaseSeriesOptions
    /** Series name shown in the legend and tooltips (or a per-item function). */
    label: string | ((item: TData) => string);
}

interface TrendChartBarSeriesOptions<TData> {
    // Chart-specific
    /** Discriminant marking this as a bar series. */
    type: 'bar';

    // Inherited from TrendChartBaseSeriesOptions
    /** Unique identifier for the series, used for color assignment, legend, and data joins. */
    id: string;

    // Inherited from TrendChartBaseSeriesOptions
    /** Explicit series color; falls back to the chart's generated palette when omitted. */
    color?: string;

    // Inherited from TrendChartBaseSeriesOptions
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;

    // Inherited from TrendChartBaseSeriesOptions
    /** Series name shown in the legend and tooltips (or a per-item function). */
    label: string | ((item: TData) => string);
}

interface TrendChartAreaSeriesOptions<TData> {
    // Chart-specific
    /** Discriminant marking this as an area series. */
    type: 'area';

    /**
     * Renderer used to draw the area top edge (e.g. straight or curved); defaults to straight
     * segments.
     */
    lineType?: PolylineRenderer;

    /** Width in pixels of the series line. */
    lineWidth?: number;

    /** Line dash style: `'solid'` (default), `'dashed'`, `'dotted'`, or a custom dash array. */
    lineStyle?: LineStyle;

    /** Fill opacity of the area band. Defaults to 0.3. */
    fillOpacity?: number;

    /** Show point markers at each data value. Defaults to `true`. */
    markers?: boolean;

    // Inherited from TrendChartBaseSeriesOptions
    /** Unique identifier for the series, used for color assignment, legend, and data joins. */
    id: string;

    // Inherited from TrendChartBaseSeriesOptions
    /** Explicit series color; falls back to the chart's generated palette when omitted. */
    color?: string;

    // Inherited from TrendChartBaseSeriesOptions
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;

    // Inherited from TrendChartBaseSeriesOptions
    /** Series name shown in the legend and tooltips (or a per-item function). */
    label: string | ((item: TData) => string);
}

interface TrendChartEventMap {
    /** Emitted when a bar is clicked. */
    barclick: TrendChartBarEvent;

    /** Emitted when the pointer enters a bar. */
    barenter: TrendChartBarEvent;

    /** Emitted when the pointer leaves a bar. */
    barleave: TrendChartBarEvent;

    /** Emitted when a line/area marker is clicked. */
    markerclick: TrendChartMarkerEvent;

    /** Emitted when the pointer enters a line/area marker. */
    markerenter: TrendChartMarkerEvent;

    /** Emitted when the pointer leaves a line/area marker. */
    markerleave: TrendChartMarkerEvent;
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
chart.on('barclick',    event => console.log(event.data)); // event.data: TrendChartBarEvent
// Emitted when the pointer enters a bar.
chart.on('barenter',    event => console.log(event.data)); // event.data: TrendChartBarEvent
// Emitted when the pointer leaves a bar.
chart.on('barleave',    event => console.log(event.data)); // event.data: TrendChartBarEvent
// Emitted when a line/area marker is clicked.
chart.on('markerclick', event => console.log(event.data)); // event.data: TrendChartMarkerEvent
// Emitted when the pointer enters a line/area marker.
chart.on('markerenter', event => console.log(event.data)); // event.data: TrendChartMarkerEvent
// Emitted when the pointer leaves a line/area marker.
chart.on('markerleave', event => console.log(event.data)); // event.data: TrendChartMarkerEvent
```
<!-- events:end -->
