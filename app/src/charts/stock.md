# Stock Chart

The **Stock Chart** renders OHLC (Open, High, Low, Close) candlestick data with an optional, labelled volume sub-chart beneath. Bullish and bearish candles are colored distinctly (`upColor` / `downColor`), and the chart includes both-axis crosshair tracking, grid lines, tooltips, annotations, and pan/zoom navigation. Candles and volume bars animate smoothly on data changes, and the volume overlay can be toggled on or off.

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
            <RiplField label="Volume" inline>
                <RiplSwitch v-model="extras.showVolume" />
            </RiplField>
            <RiplField label="Up colour" inline>
                <RiplColorInput v-model="extras.upColor" />
            </RiplField>
            <RiplField label="Down colour" inline>
                <RiplColorInput v-model="extras.downColor" />
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

        data.push({ date: label, open, high, low, close, volume });
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
                { type: 'line', axis: 'y', value: 150, label: 'Support', color: '#f59e0b' },
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
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
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

## Options

- **`data`** — The data array
- **`key`** — Key accessor for each data point (e.g. date)
- **`open`** / **`high`** / **`low`** / **`close`** — Price accessors
- **`volume`** — Volume accessor (optional)
- **`showVolume`** — Show volume bars below the chart (default `true`)
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair (tracks **both** axes by default)
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes
- **`navigator`** — `boolean | NavigatorInteractions` — Enable in-plot pan/zoom navigation
- **`overview`** — `boolean | ChartOverviewOptions` — Show the overview scrub-bar strip that windows the date axis
- **`annotations`** — `ChartAnnotation[]` — Reference lines, shaded bands, and point markers drawn over the plot
- **`format`** — `'number' | 'percentage' | 'date' | 'string' | Intl.NumberFormat options | ((value) => string)` — Formats the OHLC values shown in the candle tooltip
- **`upColor`** — Color for bullish candles (default `#6dd5b1`)
- **`downColor`** — Color for bearish candles (default `#f4a0b9`)
- **`padding`** — Chart padding
