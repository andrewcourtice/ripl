# Realtime Chart

The **Realtime Chart** smoothly visualizes data streaming in over time. It maintains a sliding window of data points: while the window fills the line grows from the left, and once full it scrolls left with each new value entering from the right as you `push()`. Ideal for live dashboards, server monitoring, and any scenario where data arrives continuously. Each series can show an area fill with configurable opacity, and the chart includes crosshair, grid, legend, and tooltips.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="toggle">{{ streaming ? 'Stop' : 'Start' }}</RiplButton>
            <RiplButton @click="reset">Reset</RiplButton>
            <RiplSelect v-model="speed" @change="startStreaming">
                <option value="100">Fast (100ms)</option>
                <option value="300">Normal (300ms)</option>
                <option value="1000">Slow (1s)</option>
            </RiplSelect>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Stream" :extras-reset="resetExtras">
            <RiplField label="Window size" option="windowSize">
                <RiplInputRange v-model="extras.windowSize" :min="20" :max="120" :step="5" />
            </RiplField>
            <RiplField label="Transition (ms)" option="transitionDuration">
                <RiplInputRange v-model="extras.transitionDuration" :min="100" :max="1000" :step="50" />
            </RiplField>
            <RiplField label="CPU area" inline option="showArea">
                <RiplSwitch v-model="extras.cpuArea" />
            </RiplField>
            <RiplField v-if="extras.cpuArea" label="CPU fill" option="fillOpacity">
                <RiplInputRange v-model="extras.cpuOpacity" :min="0" :max="1" :step="0.05" />
            </RiplField>
            <RiplField label="Memory area" inline option="showArea">
                <RiplSwitch v-model="extras.memoryArea" />
            </RiplField>
            <RiplField v-if="extras.memoryArea" label="Memory fill" option="fillOpacity">
                <RiplInputRange v-model="extras.memoryOpacity" :min="0" :max="1" :step="0.05" />
            </RiplField>
            <RiplField label="Network area" inline option="showArea">
                <RiplSwitch v-model="extras.networkArea" />
            </RiplField>
            <RiplField v-if="extras.networkArea" label="Network fill" option="fillOpacity">
                <RiplInputRange v-model="extras.networkOpacity" :min="0" :max="1" :step="0.05" />
            </RiplField>
            <RiplField label="Line type" option="lineType">
                <RiplSelect v-model="extras.lineType">
                    <option value="linear">Linear</option>
                    <option value="monotoneX">Monotone X</option>
                    <option value="step">Step</option>
                    <option value="stepAfter">Step After</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Line width" option="lineWidth">
                <RiplInputRange
                    v-model="extras.lineWidth"
                    :min="1"
                    :max="5"
                    :step="0.5"
                />
            </RiplField>
            <template #axes>
                <RiplField label="Show y axis" option="showYAxis" inline>
                    <RiplSwitch v-model="extras.showYAxis" />
                </RiplField>
                <RiplField label="Y min" option="yMin">
                    <RiplInputNumber v-model="extras.yMin" placeholder="auto" />
                </RiplField>
                <RiplField label="Y max" option="yMax">
                    <RiplInputNumber v-model="extras.yMax" placeholder="auto" />
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
    seedColors,
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createRealtimeChart,
} from '@ripl/charts';

import type {
    PolylineRenderer,
} from '@ripl/web';

import {
    onUnmounted,
    ref,
    watch,
} from 'vue';

const streaming = ref(true);
const speed = ref('300');
let intervalId: ReturnType<typeof setInterval> | null = null;

const seriesMeta = [
    { id: 'cpu', label: 'CPU %' },
    { id: 'memory', label: 'Memory %' },
    { id: 'network', label: 'Network MB/s' },
];

const { extras, reset: resetExtras } = useChartExtras({
    windowSize: 60,
    transitionDuration: 200,
    cpuArea: true,
    cpuOpacity: 0.15,
    memoryArea: true,
    memoryOpacity: 0.15,
    networkArea: false,
    networkOpacity: 0.15,
    lineType: 'monotoneX' as PolylineRenderer,
    lineWidth: 2,
    showYAxis: true,
    yMin: undefined as number | undefined,
    yMax: undefined as number | undefined,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        tooltip: true,
        crosshair: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'System Metrics',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

// Simulated metrics with smooth random walks
let cpuBase = 45;
let memBase = 60;
let netBase = 25;

function nextValue(base: number, volatility: number, min: number, max: number): number {
    const delta = (Math.random() - 0.5) * volatility;
    return Math.max(min, Math.min(max, base + delta));
}

function getSeries() {
    return [
        {
            id: 'cpu',
            label: 'CPU %',
            showArea: extras.cpuArea,
            fillOpacity: extras.cpuOpacity,
            color: config.colors.cpu,
            lineType: extras.lineType,
            lineWidth: extras.lineWidth,
        },
        {
            id: 'memory',
            label: 'Memory %',
            showArea: extras.memoryArea,
            fillOpacity: extras.memoryOpacity,
            color: config.colors.memory,
            lineType: extras.lineType,
            lineWidth: extras.lineWidth,
        },
        {
            id: 'network',
            label: 'Network MB/s',
            showArea: extras.networkArea,
            fillOpacity: extras.networkOpacity,
            color: config.colors.network,
            lineType: extras.lineType,
            lineWidth: extras.lineWidth,
        },
    ];
}

function buildOptions() {
    const options = {
        windowSize: extras.windowSize,
        transitionDuration: extras.transitionDuration,
        showYAxis: extras.showYAxis,
        yMin: extras.yMin,
        yMax: extras.yMax,
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${Math.round(v)}%`;

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    const instance = createRealtimeChart(context, {
        ...buildOptions(),
    });

    startStreaming();
    return instance;
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });

// The crosshair and the y-axis label format are read only in the constructor — realtime builds its
// own axis and crosshair rather than reconciling them per render — so those two still need a rebuild.
// Legend position does not: `Legend.setOptions` relocates the live legend, so rebuilding for it only
// threw the sliding window away. The stream loop always feeds the current chart via `chart.value`, so
// it keeps running across a rebuild; the window restarts empty and refills as data arrives.
watch(
    () => [config.crosshairVisible, config.crosshairAxis, config.valueFormat],
    () => example.value?.recreate()
);

function pushSample() {
    cpuBase = nextValue(cpuBase, 8, 5, 95);
    memBase = nextValue(memBase, 4, 20, 90);
    netBase = nextValue(netBase, 12, 0, 100);

    chart.value?.push({
        cpu: Math.round(cpuBase * 10) / 10,
        memory: Math.round(memBase * 10) / 10,
        network: Math.round(netBase * 10) / 10,
    });
}

function startStreaming() {
    stopStreaming();

    if (!streaming.value) {
        return;
    }

    intervalId = setInterval(pushSample, Number(speed.value));
}

function stopStreaming() {
    if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

function toggle() {
    streaming.value = !streaming.value;

    if (streaming.value) {
        startStreaming();
    } else {
        stopStreaming();
    }
}

function reset() {
    chart.value?.clear();
    cpuBase = 45;
    memBase = 60;
    netBase = 25;
}

onUnmounted(() => stopStreaming());
</script>

## Usage

```ts
import {
    createRealtimeChart,
} from '@ripl/charts';

const chart = createRealtimeChart('#container', {
    windowSize: 60,
    transitionDuration: 200,
    series: [
        {
            id: 'cpu',
            label: 'CPU %',
            showArea: true,
        },
        {
            id: 'memory',
            label: 'Memory %',
            showArea: true,
        },
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

- **`series`**: array of series with `id`, `label`, optional `color`, `lineType`, `lineWidth`, `showArea`, `fillOpacity`
- **`windowSize`**: maximum visible data points (default `60`)
- **`transitionDuration`**: transition duration per update in ms (default `300`)
- **`grid`** (`boolean | ChartGridOptions`): show/configure grid lines (default `true`)
- **`crosshair`** (`boolean | ChartCrosshairOptions`): show/configure crosshair (default `true`)
- **`tooltip`** (`boolean | ChartTooltipOptions`): show/configure tooltips
- **`legend`** (`boolean | ChartLegendOptions`): show/configure legend (default `true`)
- **`axis`** (`boolean | ChartAxisOptions`): configure axes (default `true`)
- **`format`** (`'number' | 'percentage' | 'date' | 'string' | Intl.NumberFormat options | ((value) => string)`): formats the y-axis tick labels
- **`yMin`** / **`yMax`**: fixed Y axis bounds (auto-computed if omitted)
- **`padding`**: chart padding

### Methods

- **`push(values)`**: append a data point for each series. Keys must match series `id` values.
- **`clear()`**: reset all buffers and clear the chart.
- **`update(options)`**: update chart options (inherited from `Chart`).
- **`destroy()`**: destroy the chart and release resources.
