# Radar Chart

The **Radar Chart** displays multivariate data on a radial grid, ideal for comparing strengths and weaknesses across multiple dimensions. Each axis radiates from a shared center, and data series form filled polygons whose shape reveals the profile at a glance. It supports multiple overlapping series, configurable grid levels, markers that animate in sync with the area polygon, and an optional legend.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addAxis">Add Axis</RiplButton>
            <RiplButton @click="removeAxis">Remove Axis</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Radar" :extras-reset="reset">
            <RiplField label="Grid levels">
                <RiplInputRange v-model="extras.levels" :min="3" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Max value">
                <RiplInputNumber v-model="extras.maxValue" placeholder="auto" />
            </RiplField>
            <RiplField label="Fill opacity">
                <RiplInputRange v-model="extras.fillOpacity" :min="0" :max="1" :step="0.05" />
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
    seedColors,
    useChartConfig,
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createRadarChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const AXIS_POOL = ['Speed', 'Strength', 'Defense', 'Magic', 'Luck', 'Agility', 'Stamina', 'Wisdom'];

const seriesMeta = [
    { id: 'player1', label: 'Player 1' },
    { id: 'player2', label: 'Player 2' },
];

let axisCount = 6;

const { extras, reset } = useChartExtras({
    levels: 5,
    maxValue: undefined as number | undefined,
    fillOpacity: 0.25,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Player Comparison',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function currentAxes() {
    return AXIS_POOL.slice(0, axisCount);
}

function generateData() {
    return currentAxes().map(axis => ({
        axis,
        player1: Math.round(Math.random() * 80 + 20),
        player2: Math.round(Math.random() * 80 + 20),
    }));
}

let data = generateData();

function getSeries() {
    return seriesMeta.map(s => ({
        id: s.id,
        value: s.id,
        label: s.label,
        fillOpacity: extras.fillOpacity,
        color: config.colors[s.id],
    }));
}

function buildOptions() {
    const options = {
        categories: currentAxes(),
        levels: extras.levels,
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // maxValue is optional (blank = auto-computed from the data); only pass it when set.
    if (extras.maxValue !== undefined) {
        options.maxValue = extras.maxValue;
    }

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createRadarChart(context, {
        data,
        padding: { top: 10, right: 10, bottom: 10, left: 10 },
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    data = generateData();
    chart.value?.update({ data });
}

function addAxis() {
    if (axisCount < AXIS_POOL.length) {
        axisCount++;
        data = generateData();
        chart.value?.update({ categories: currentAxes(), data });
    }
}

function removeAxis() {
    if (axisCount > 3) {
        axisCount--;
        data = generateData();
        chart.value?.update({ categories: currentAxes(), data });
    }
}
</script>

## Usage

```ts
import {
    createRadarChart,
} from '@ripl/charts';

const chart = createRadarChart('#container', {
    data: [/* ... */],
    categories: ['Speed', 'Strength', 'Defense', 'Magic', 'Luck', 'Agility'],
    series: [
        { id: 'player1', value: 'player1', label: 'Player 1' },
    ],
});
```

## Data Format

Each item represents one axis and contains the axis label plus one or more numeric series values:

```ts
const data = [
    { axis: 'Speed',
        player1: 80,
        player2: 65 },
    { axis: 'Strength',
        player1: 55,
        player2: 90 },
    { axis: 'Defense',
        player1: 70,
        player2: 45 },
];
```

The `categories` option lists axis labels, and each series references a numeric field via `value`.

## Variants

### Single series

```ts
createRadarChart('#container', {
    data,
    categories: ['Speed', 'Strength', 'Defense', 'Magic', 'Luck'],
    series: [
        { id: 'player1',
            value: 'player1',
            label: 'Player 1' },
    ],
});
```

### Custom levels and max value

```ts
createRadarChart('#container', {
    data,
    categories: ['Speed', 'Strength', 'Defense', 'Magic', 'Luck'],
    levels: 10,
    maxValue: 100,
    series: [
        { id: 'player1',
            value: 'player1',
            label: 'Player 1',
            fillOpacity: 0.3 },
        { id: 'player2',
            value: 'player2',
            label: 'Player 2',
            fillOpacity: 0.3 },
    ],
});
```

## Options

- **`data`** — The data array (one item per axis)
- **`categories`** — Array of axis labels
- **`series`** — Array of series with `id`, `value`, `label`, optional `color` and `fillOpacity`
- **`maxValue`** — Maximum value for the scale (auto-computed if omitted)
- **`levels`** — Number of concentric grid levels (default `5`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
