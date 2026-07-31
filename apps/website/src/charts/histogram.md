# Histogram Chart

The **Histogram Chart** bins a numeric field and draws each bin as a bar on a continuous value axis against a frequency axis, the go-to view for the shape of a distribution. Binning uses the shared `bin` transform (nice uniform bins by default, or explicit `thresholds`), and bars animate on entry, update, and exit.

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
        <RiplChartConfig :config="config" extra-title="Bins" :extras-reset="reset">
            <RiplField label="Bin count" option="bins">
                <RiplInputRange v-model="extras.bins" :min="4" :max="20" :step="1" />
            </RiplField>
            <RiplField label="Corner radius" option="borderRadius">
                <RiplInputRange v-model="extras.borderRadius" :min="0" :max="8" :step="1" />
            </RiplField>
            <template #colors>
                <RiplField label="Bar color" inline option="color">
                    <RiplColorInput v-model="extras.color" />
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
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createHistogramChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    bins: 10,
    borderRadius: 2,
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
        crosshair: true,
        axes: true,
    },
    title: 'Response Time Distribution',
});

const example = ref();

function generateData() {
    // A roughly normal distribution via the central-limit trick.
    return Array.from({ length: 240 }, () => {
        const sample = (Math.random() + Math.random() + Math.random()) / 3;

        return { value: Math.round(sample * 400 + 50) };
    });
}

let data = generateData();

function buildOptions() {
    return {
        bins: extras.bins,
        borderRadius: extras.borderRadius,
        color: extras.color,
        ...buildCommonOptions(config),
    };
}

const { contextChanged, chart } = useRiplChart(context => {
    return createHistogramChart(context, {
        data,
        value: 'value',
        axis: {
            x: { title: 'Response time (ms)' },
            y: { title: 'Frequency' },
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
    createHistogramChart,
} from '@ripl/charts';

const chart = createHistogramChart('#container', {
    data: [/* ... */],
    value: 'amount',
    bins: 12,
});
```

## Data Format

Each item contributes one numeric value, read via the `value` accessor (a field name or a function). The chart bins those values itself, so no pre-aggregation is required.

## Options

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createHistogramChart('#container', {
    data,  // TData[]
    value, // NumericAccessor<TData>
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface HistogramChartOptions<TData> {
    // Chart-specific
    /** The dataset whose values are binned into the histogram. */
    data: TData[];

    /** The numeric field (or accessor) to bin. */
    value: NumericAccessor<TData>;

    /** Target number of bins (ignored when `thresholds` is given). Defaults to Sturges' rule. */
    bins?: number;

    /** Explicit bin boundaries; overrides `bins`. */
    thresholds?: number[];

    /** Bar color (defaults to the first palette color). */
    color?: string;

    /** Corner radius in pixels applied to the top of each bar. Defaults to 2. */
    borderRadius?: number;

    /** Format applied to bin bounds shown in tooltips. */
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

interface HistogramChartEventMap {
    /** Emitted when a bin bar is clicked. */
    binclick: HistogramBinEvent;

    /** Emitted when the pointer enters a bin bar. */
    binenter: HistogramBinEvent;

    /** Emitted when the pointer leaves a bin bar. */
    binleave: HistogramBinEvent;
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
// Emitted when a bin bar is clicked.
chart.on('binclick', event => console.log(event.data)); // event.data: HistogramBinEvent
// Emitted when the pointer enters a bin bar.
chart.on('binenter', event => console.log(event.data)); // event.data: HistogramBinEvent
// Emitted when the pointer leaves a bin bar.
chart.on('binleave', event => console.log(event.data)); // event.data: HistogramBinEvent
```
<!-- events:end -->
