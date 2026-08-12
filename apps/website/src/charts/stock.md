---
title: Stock Chart
description: Draw OHLC candlesticks with a labeled volume sub-chart, distinct up and down colors, dual-axis crosshair, annotations and wheel-and-drag pan-zoom navigation.
---

# Stock Chart

The **Stock Chart** draws OHLC (open, high, low, close) data as candlesticks, each one carrying a period's full range and direction in a single mark, with an optional labeled volume sub-chart beneath. It fits price history, and any other data where a period's extremes matter as much as its close. `open`, `high`, `low`, `close` and `volume` bind the accessors, `showVolume` toggles the sub-chart, and `upColor`/`downColor` separate bullish from bearish candles. Dual-axis crosshair tracking, grid lines, tooltips, [annotations](/charts/advanced/annotations) and [pan-zoom navigation](/charts/advanced/panning-and-zooming) are built in, and candles and volume bars animate on data changes. Canvas is the default target; pass an SVG or [terminal context](/charts/advanced/rendering-targets) to draw the same chart elsewhere.

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

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createStockChart('#container', {
    data,
    key: 'date',
    open: 'open',
    high: 'high',
    low: 'low',
    close: 'close',
    volume: 'volume',
    // Draws the volume histogram beneath the candles.
    showVolume: true,
    upColor: '#6dd5b1',
    downColor: '#f4a0b9',
    format: 'number',
});
```

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

## Programmatic Interaction

`highlightCandle` applies the treatment hovering a candle's body does — it lifts and the rest of the
chart dims — without waiting for a pointer. Pass the candle's key, exactly as the chart reports it in
the events above, the `{ key }` ref form, or an accessor over the chart's data returning either.
`{ tooltip: true }` opens the candle's tooltip where hovering would, and `{ crosshair: true }` places
the crosshair on it.

```ts
const chart = createStockChart('#container', {
    data,
    key: 'date',
    open: 'open',
    high: 'high',
    low: 'low',
    close: 'close',
});

// Light one session, with its tooltip and the crosshair.
chart.highlightCandle('2024-01-03', { tooltip: true, crosshair: true });

// The most recent candle in the dataset.
chart.highlightCandle(data => data[data.length - 1].date);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`, a pan or zoom) or the next pointer hover restores the chart, and it
emits none of the `candle*` events above. `clearHighlight()` restores it explicitly;
`highlightCandle` returns `false` when the selector matched no live candle, which includes a key
scrolled outside the visible range.
