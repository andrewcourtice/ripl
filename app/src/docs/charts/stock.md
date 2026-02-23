# Stock Chart

The `StockChart` renders OHLC (Open, High, Low, Close) candlestick data with optional volume bars. It supports animated transitions, crosshair, grid lines, and tooltips.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="randomize">Randomize</button>
            <label class="ripl-switch">
                <input type="checkbox" v-model="showVolume" @change="toggleVolume">
                <span class="ripl-switch__track"><span class="ripl-switch__thumb"></span></span>
                Volume
            </label>
        </div>
    </template>
</ripl-example>

<script setup lang="ts">
import { ref } from 'vue';
import { createStockChart, StockChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

const showVolume = ref(true);

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
        keyBy: 'date',
        openBy: 'open',
        highBy: 'high',
        lowBy: 'low',
        closeBy: 'close',
        volumeBy: 'volume',
        showVolume: showVolume.value,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
    });
});

function randomize() {
    data = generateData();
    chart.value?.update({ data });
}

function toggleVolume() {
    chart.value?.update({ showVolume: showVolume.value });
}
</script>

## Usage

```ts
import { createStockChart } from '@ripl/charts';

const chart = createStockChart('#container', {
    data: [...],
    keyBy: 'date',
    openBy: 'open',
    highBy: 'high',
    lowBy: 'low',
    closeBy: 'close',
    volumeBy: 'volume',
});

// Update data
chart.update({ data: newData });
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `data` | `TData[]` | — | The data array |
| `keyBy` | `keyof TData \| Function` | — | Key accessor for each data point (e.g. date) |
| `openBy` | `keyof TData \| Function` | — | Open price accessor |
| `highBy` | `keyof TData \| Function` | — | High price accessor |
| `lowBy` | `keyof TData \| Function` | — | Low price accessor |
| `closeBy` | `keyof TData \| Function` | — | Close price accessor |
| `volumeBy` | `keyof TData \| Function` | — | Volume accessor (optional) |
| `showVolume` | `boolean` | `true` | Show volume bars below the chart |
| `showGrid` | `boolean` | `true` | Show horizontal grid lines |
| `showCrosshair` | `boolean` | `true` | Show crosshair on hover |
| `upColor` | `string` | `#6dd5b1` | Color for bullish (close ≥ open) candles |
| `downColor` | `string` | `#f4a0b9` | Color for bearish (close < open) candles |
| `padding` | `Partial<ChartPadding>` | `10` all | Chart padding |
| `formatXLabel` | `Function` | — | Custom x-axis label formatter |
| `formatYLabel` | `Function` | — | Custom y-axis label formatter |
