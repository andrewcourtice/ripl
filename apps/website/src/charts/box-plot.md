# Box Plot Chart

The **Box Plot Chart** summarizes the distribution of a numeric field per category using the shared `boxplotStats` transform: a box spanning the interquartile range (Q1–Q3), a median line, whiskers to the 1.5×IQR fences, and outlier points. It's the standard view for comparing spread and skew across groups.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Box Plot" :extras-reset="reset">
            <RiplField label="Box color" inline>
                <RiplColorInput v-model="extras.color" />
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
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createBoxPlotChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const REGIONS = ['US', 'EU', 'APAC', 'LATAM'];

const { extras, reset } = useChartExtras({
    color: '#7cacf8',
});

const config = useChartConfig({
    features: {
        title: true,
        grid: true,
        tooltip: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Latency by Region',
});

const example = ref();

function generateData() {
    return REGIONS.flatMap((region, index) => {
        const center = 60 + index * 30;

        return Array.from({ length: 20 }, () => ({
            region,
            latency: Math.round(center + (Math.random() - 0.5) * 80),
        }));
    });
}

let data = generateData();

function buildOptions() {
    return {
        color: extras.color,
        ...buildCommonOptions(config),
    };
}

const { contextChanged, chart } = useRiplChart(context => {
    return createBoxPlotChart(context, {
        data,
        key: 'region',
        value: 'latency',
        categoryOrder: REGIONS,
        axis: {
            x: { title: 'Region' },
            y: { title: 'Latency (ms)' },
        },
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });

function randomize() {
    data = generateData();
    chart.value?.update({ data });
}
</script>

## Usage

```ts
import {
    createBoxPlotChart,
} from '@ripl/charts';

const chart = createBoxPlotChart('#container', {
    data: [/* ... */],
    key: 'region',
    value: 'latency',
});
```

## Data Format

Each item contributes one numeric value to a category. The chart groups items by the `key`
accessor and summarizes the `value` accessor per group, so no pre-aggregation is required.

## Options

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createBoxPlotChart('#container', {
    data,  // TData[]
    key,   // keyof TData | ((item: TData) => string)
    value, // NumericAccessor<TData>
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface BoxPlotChartOptions<TData> {
    // Chart-specific
    /** The dataset summarized by the chart. */
    data: TData[];

    /** Accessor for the category each value belongs to. */
    key: keyof TData | ((item: TData) => string);

    /** Accessor for the numeric value to summarize. */
    value: NumericAccessor<TData>;

    /** Explicit category order (defaults to first-seen order in the data). */
    categoryOrder?: string[];

    /** Color used for every box; falls back to the first palette color when omitted. */
    color?: string;

    /** Format applied to summary values shown in tooltips. */
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

interface BoxPlotChartEventMap {
    /** Emitted when a box is clicked. */
    boxclick: BoxPlotBoxEvent;

    /** Emitted when the pointer enters a box. */
    boxenter: BoxPlotBoxEvent;

    /** Emitted when the pointer leaves a box. */
    boxleave: BoxPlotBoxEvent;
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
// Emitted when a box is clicked.
chart.on('boxclick', event => console.log(event.data)); // event.data: BoxPlotBoxEvent
// Emitted when the pointer enters a box.
chart.on('boxenter', event => console.log(event.data)); // event.data: BoxPlotBoxEvent
// Emitted when the pointer leaves a box.
chart.on('boxleave', event => console.log(event.data)); // event.data: BoxPlotBoxEvent
```
<!-- events:end -->
