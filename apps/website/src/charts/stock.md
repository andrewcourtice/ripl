# Stock Chart

The **Stock Chart** renders OHLC (Open, High, Low, Close) candlestick data with an optional, labeled volume sub-chart beneath. Bullish and bearish candles are colored distinctly (`upColor` / `downColor`), and the chart includes both-axis crosshair tracking, grid lines, tooltips, annotations, and pan/zoom navigation. Candles and volume bars animate smoothly on data changes, and the volume overlay can be toggled on or off.

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
        <RiplChartConfig :config="config" extra-title="Candles" :extras-reset="reset">
            <RiplField label="Volume" inline option="showVolume">
                <RiplSwitch v-model="extras.showVolume" />
            </RiplField>
            <template #colors>
                <RiplField label="Up color" inline option="upColor">
                    <RiplColorInput v-model="extras.upColor" />
                </RiplField>
                <RiplField label="Down color" inline option="downColor">
                    <RiplColorInput v-model="extras.downColor" />
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
    createStockChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const { extras, reset } = useChartExtras({
    showVolume: true,
    upColor: '#6dd5b1',
    downColor: '#f4a0b9',
});

const config = useChartConfig({
    features: {
        title: true,
        axes: true,
        grid: true,
        tooltip: true,
        crosshair: true,
        navigator: true,
        annotations: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Daily Prices',
    axisX: 'Date',
    axisY: 'Price ($)',
    crosshairAxis: 'both',
});

function generateData(count = 30) {
    const data = [];
    let price = 150;

    for (let i = 0; i < count; i++) {
        const date = new Date(2025, 0, i + 1);
        const label = `${date.getMonth() + 1}/${date.getDate()}`;
        const change = (Math.random() - 0.48) * 6;
        const open = Math.round((price + change) * 100) / 100;
        const close = Math.round((open + (Math.random() - 0.48) * 8) * 100) / 100;
        const high = Math.round((Math.max(open, close) + Math.random() * 4) * 100) / 100;
        const low = Math.round((Math.min(open, close) - Math.random() * 4) * 100) / 100;
        const volume = Math.round(Math.random() * 8000000 + 2000000);

        data.push({
            date: label,
            open,
            high,
            low,
            close,
            volume,
        });
        price = close;
    }

    return data;
}

let data = generateData();

function buildOptions() {
    const options = {
        showVolume: extras.showVolume,
        upColor: extras.upColor,
        downColor: extras.downColor,
        annotations: config.annotationsVisible
            ? [
                {
                    type: 'line',
                    axis: 'y',
                    value: 150,
                    label: 'Support',
                    color: '#f59e0b',
                },
            ]
            : [],
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `$${v.toFixed(2)}`;

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createStockChart(context, {
        data,
        key: 'date',
        open: 'open',
        high: 'high',
        low: 'low',
        close: 'close',
        volume: 'volume',
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
    createStockChart,
} from '@ripl/charts';

const chart = createStockChart('#container', {
    data: [/* ... */],
    key: 'date',
    open: 'open',
    high: 'high',
    low: 'low',
    close: 'close',
    volume: 'volume',
});

// Update data
chart.update({ data: newData });
```

## Data Format

Each item is one candle: a key for the x axis plus its open, high, low and close. `volume` is
optional and enables the volume panel beneath the candles:

```ts
const data = [
    {
        date: '2024-01-02',
        open: 184.2,
        high: 188.4,
        low: 183.9,
        close: 187.6,
        volume: 12_400_000,
    },
    {
        date: '2024-01-03',
        open: 187.6,
        high: 189.1,
        low: 184.0,
        close: 184.5,
        volume: 9_800_000,
    },
];
```

A candle closing at or above its open is drawn with `upColor`, below its open with `downColor`.

## Options

Every option is listed below, generated from the chart's TypeScript definitions so this reference
cannot drift from the code. See [Shared Options](/charts/shared-options) for how the options common
to every chart behave, and [Migration](/charts/migration) if you are upgrading.

### Required

<!-- required:start -->
<!-- eslint-skip -->
```ts
createStockChart('#container', {
    data,  // TData[]
    key,   // keyof TData | ((item: TData) => string)
    open,  // NumericAccessor<TData>
    high,  // NumericAccessor<TData>
    low,   // NumericAccessor<TData>
    close, // NumericAccessor<TData>
});
```
<!-- required:end -->

### All options

<!-- options:start -->
<!-- eslint-skip -->
```ts
interface StockChartOptions<TData> {
    // Chart-specific
    /** The dataset to render, one candlestick per item. */
    data: TData[];

    /**
     * Accessor for each item's unique key, used along the x-axis and to match candles across
     * updates.
     */
    key: keyof TData | ((item: TData) => string);

    /** Accessor for each item's opening price. */
    open: NumericAccessor<TData>;

    /** Accessor for each item's high price. */
    high: NumericAccessor<TData>;

    /** Accessor for each item's low price. */
    low: NumericAccessor<TData>;

    /** Accessor for each item's closing price. */
    close: NumericAccessor<TData>;

    /** Optional accessor for each item's traded volume, enabling the volume sub-chart. */
    volume?: NumericAccessor<TData>;

    /** Show the volume sub-chart below the candlesticks. Defaults to `true` (requires `volume`). */
    showVolume?: boolean;

    /** Format applied to the open/high/low/close values shown in the candle tooltip. */
    format?: ValueFormatInput;

    /** Color for candles that close at or above their open (bullish). */
    upColor?: string;

    /** Color for candles that close below their open (bearish). */
    downColor?: string;

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

interface StockChartEventMap {
    /** Emitted when a candlestick is clicked. */
    candleclick: StockChartCandleEvent;

    /** Emitted when the pointer enters a candlestick. */
    candleenter: StockChartCandleEvent;

    /** Emitted when the pointer leaves a candlestick. */
    candleleave: StockChartCandleEvent;
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
// Emitted when a candlestick is clicked.
chart.on('candleclick', event => console.log(event.data)); // event.data: StockChartCandleEvent
// Emitted when the pointer enters a candlestick.
chart.on('candleenter', event => console.log(event.data)); // event.data: StockChartCandleEvent
// Emitted when the pointer leaves a candlestick.
chart.on('candleleave', event => console.log(event.data)); // event.data: StockChartCandleEvent
```
<!-- events:end -->
