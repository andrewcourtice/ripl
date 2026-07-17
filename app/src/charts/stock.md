# Stock Chart

The **Stock Chart** renders OHLC (Open, High, Low, Close) candlestick data with optional volume bars beneath. Bullish and bearish candles are colored distinctly (`upColor` / `downColor`), and the chart includes crosshair tracking, grid lines, and tooltips. Candles and volume bars animate smoothly on data changes, and the volume overlay can be toggled on or off.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Candles">
            <RiplField label="Volume" inline>
                <RiplSwitch v-model="showVolume" />
            </RiplField>
            <RiplField label="Up colour" inline>
                <RiplColorInput v-model="upColor" />
            </RiplField>
            <RiplField label="Down colour" inline>
                <RiplColorInput v-model="downColor" />
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
} from '../.vitepress/compositions/use-chart-config';

import {
    createStockChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const showVolume = ref(true);
const upColor = ref('#6dd5b1');
const downColor = ref('#f4a0b9');

const config = useChartConfig({
    features: { title: true, axes: true, grid: true, animation: true },
    title: 'Daily Prices',
    axisX: 'Date',
    axisY: 'Price ($)',
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

const { contextChanged, chart } = useRiplChart(context => {
    return createStockChart(context, {
        data,
        key: 'date',
        open: 'open',
        high: 'high',
        low: 'low',
        close: 'close',
        volume: 'volume',
        showVolume: showVolume.value,
        upColor: upColor.value,
        downColor: downColor.value,
        format: v => `$${v.toFixed(2)}`,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
    });
});

function apply() {
    chart.value?.update({
        showVolume: showVolume.value,
        upColor: upColor.value,
        downColor: downColor.value,
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });
watch([showVolume, upColor, downColor], apply);

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
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes
- **`format`** — `'number' | 'percentage' | 'date' | 'string' | Intl.NumberFormat options | ((value) => string)` — Formats the OHLC values shown in the candle tooltip
- **`upColor`** — Color for bullish candles (default `#6dd5b1`)
- **`downColor`** — Color for bearish candles (default `#f4a0b9`)
- **`padding`** — Chart padding
