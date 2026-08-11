---
title: Realtime Chart
description: Stream values into a sliding window that scrolls as you push(), with a configurable window size, y bounds, per-series area fills, crosshair, grid and legend.
---

# Realtime Chart

The **Realtime Chart** holds a sliding window of the most recent values and scrolls it as you `push()` new ones: while the window fills the line grows from the left, and once full each new value enters from the right and the oldest falls off. It fits live dashboards, server and device monitoring, and anything where data arrives continuously and only the recent past matters. `windowSize` sets how much history stays on screen, `yMin`/`yMax` pin the value axis instead of letting it track the data, `transitionDuration` sets how long each push's scroll takes, and each series takes `showArea` with its own `fillOpacity`. Crosshair, grid, legend and tooltips are built in. Canvas and SVG both draw it, as does a headless [terminal context](/charts/advanced/rendering-targets).

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="toggle">{{ streaming ? 'Stop' : 'Start' }}</RiplButton>
            <RiplButton @click="reset">Reset</RiplButton>
        </RiplControlGroup>
        <RiplField label="Speed">
            <RiplSelect v-model="speed" @change="startStreaming">
                <option value="100">Fast (100ms)</option>
                <option value="300">Normal (300ms)</option>
                <option value="1000">Slow (1s)</option>
            </RiplSelect>
        </RiplField>
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

## Data Format

A realtime chart has no `data` option: it holds a rolling window and you push samples into it. Each
push is one object keyed by series id:

```ts
const chart = createRealtimeChart('#container', {
    windowSize: 60,
    series: [
        {
            id: 'cpu',
            label: 'CPU %',
        },
        {
            id: 'memory',
            label: 'Memory %',
        },
    ],
});

chart.push({
    cpu: 42,
    memory: 61,
});
```

The chart keeps the most recent `windowSize` samples and drops the rest. `chart.clear()` empties the
window.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createRealtimeChart('#container', {
    // Samples kept in the sliding window; older ones scroll off the left.
    windowSize: 60,
    // Duration of the transition applied on each `push()`, in milliseconds.
    transitionDuration: 300,
    showYAxis: true,
    yMin: 0,
    yMax: 100,
    grid: true,
    crosshair: true,
    tooltip: true,
    legend: { position: 'bottom' },
    axis: { y: { title: 'Utilisation' } },
    format: 'number',
    series: [
        {
            id: 'cpu',
            label: 'CPU %',
            color: '#7cacf8',
            lineType: 'monotoneX',
            lineWidth: 2,
            showArea: true,
            fillOpacity: 0.15,
        },
    ],
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
This chart emits no events.
<!-- events:end -->
