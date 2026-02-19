# Realtime Chart

The `RealtimeChart` smoothly visualises data streaming in over time. It maintains a sliding window of data points and animates the line (and optional area fill) as new values arrive via the `push()` method. Ideal for live dashboards, monitoring, and any scenario where data arrives continuously.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div layout="row">
            <button class="ripl-button" @click="toggle">{{ streaming ? 'Stop' : 'Start' }}</button>
            <button class="ripl-button" @click="reset">Reset</button>
            <select class="ripl-select" v-model="speed" @change="restart">
                <option value="100">Fast (100ms)</option>
                <option value="300">Normal (300ms)</option>
                <option value="1000">Slow (1s)</option>
            </select>
        </div>
    </template>
</ripl-example>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { createRealtimeChart, RealtimeChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

const streaming = ref(true);
const speed = ref('300');
let intervalId: ReturnType<typeof setInterval> | null = null;

// Simulated metrics with smooth random walks
let cpuBase = 45;
let memBase = 60;
let netBase = 25;

function nextValue(base: number, volatility: number, min: number, max: number): number {
    const delta = (Math.random() - 0.5) * volatility;
    return Math.max(min, Math.min(max, base + delta));
}

const { contextChanged, chart } = useRiplChart(context => {
    const c = createRealtimeChart(context, {
        padding: { top: 30, right: 20, bottom: 20, left: 20 },
        windowSize: 60,
        transitionDuration: 200,
        series: [
            { id: 'cpu', label: 'CPU %', showArea: true, areaOpacity: 0.15 },
            { id: 'memory', label: 'Memory %', showArea: true, areaOpacity: 0.15 },
            { id: 'network', label: 'Network MB/s', showArea: false, lineWidth: 1.5 },
        ],
    });

    startStreaming(c);
    return c;
});

function startStreaming(c?: RealtimeChart) {
    stopStreaming();
    const target = c ?? chart.value;
    if (!target) return;

    intervalId = setInterval(() => {
        cpuBase = nextValue(cpuBase, 8, 5, 95);
        memBase = nextValue(memBase, 4, 20, 90);
        netBase = nextValue(netBase, 12, 0, 100);

        target.push({
            cpu: Math.round(cpuBase * 10) / 10,
            memory: Math.round(memBase * 10) / 10,
            network: Math.round(netBase * 10) / 10,
        });
    }, Number(speed.value));
}

function stopStreaming() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

function toggle() {
    if (streaming.value) {
        stopStreaming();
    } else {
        startStreaming();
    }
    streaming.value = !streaming.value;
}

function reset() {
    chart.value?.clear();
    cpuBase = 45;
    memBase = 60;
    netBase = 25;
}

function restart() {
    if (streaming.value) {
        startStreaming();
    }
}

onUnmounted(() => stopStreaming());
</script>

## Usage

```ts
import { createRealtimeChart } from '@ripl/charts';

const chart = createRealtimeChart('#container', {
    windowSize: 60,
    transitionDuration: 200,
    series: [
        { id: 'cpu', label: 'CPU %', showArea: true },
        { id: 'memory', label: 'Memory %', showArea: true },
    ],
});

// Push data as it arrives
setInterval(() => {
    chart.push({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
    });
}, 300);

// Clear the buffer
chart.clear();
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `series` | `RealtimeChartSeriesOptions[]` | — | Series configuration |
| `windowSize` | `number` | `60` | Maximum visible data points |
| `transitionDuration` | `number` | `300` | Transition duration per update (ms) |
| `showGrid` | `boolean` | `true` | Show horizontal grid lines |
| `showCrosshair` | `boolean` | `true` | Show crosshair on hover |
| `showYAxis` | `boolean` | `true` | Show the Y axis |
| `showLegend` | `boolean` | `true` | Show legend for multi-series |
| `yMin` | `number` | auto | Fixed Y axis minimum |
| `yMax` | `number` | auto | Fixed Y axis maximum |
| `formatYLabel` | `Function` | — | Custom Y axis label formatter |
| `padding` | `Partial<ChartPadding>` | `10` all | Chart padding |

### Series Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | — | Unique series identifier (matches keys in `push()`) |
| `label` | `string` | `id` | Display label for legend |
| `color` | `string` | auto | Series color |
| `lineType` | `PolylineRenderer` | `'linear'` | Line interpolation type |
| `lineWidth` | `number` | `2` | Line width |
| `showArea` | `boolean` | `true` | Show filled area beneath line |
| `areaOpacity` | `number` | `0.2` | Area fill opacity |

### Methods

| Method | Description |
|--------|-------------|
| `push(values: Record<string, number>)` | Append a data point for each series. Keys must match series `id` values. |
| `clear()` | Reset all buffers and clear the chart. |
| `update(options)` | Update chart options (inherited from `Chart`). |
| `destroy()` | Destroy the chart and release resources. |
