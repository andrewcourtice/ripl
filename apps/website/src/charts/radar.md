---
title: Radar Chart
description: Compare series across shared categories as filled polygons on a radial grid, with a configurable level count, max value, markers, labels and a legend.
---

# Radar Chart

The **Radar Chart** gives each category its own spoke radiating from a shared center and joins one series' values into a filled polygon, so a series is read as a shape. Reach for it to compare a handful of subjects across the same fixed set of measures — skill profiles, product scorecards, survey dimensions. `categories` fixes the spokes, `levels` sets the grid rings, `max` pins the outer ring, and each series takes its own `value` accessor and `fillOpacity`. Markers animate in step with the polygon, and `labels`, `legend` and `format` handle the annotation. It works against any Ripl [rendering target](/charts/advanced/rendering-targets): Canvas, SVG or a terminal.

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
            <RiplField label="Grid levels" option="levels">
                <RiplInputRange v-model="extras.levels" :min="3" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Max value" option="max">
                <RiplInputNumber v-model="extras.max" placeholder="auto" />
            </RiplField>
            <RiplField label="Fill opacity" option="fillOpacity">
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
    max: undefined as number | undefined,
    fillOpacity: 0.25,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
        dataLabels: true,
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

    // max is optional (blank = auto-computed from the data); only pass it when set.
    if (extras.max !== undefined) {
        options.max = extras.max;
    }

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createRadarChart(context, {
        data,
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
    {
        axis: 'Speed',
        player1: 80,
        player2: 65,
    },
    {
        axis: 'Strength',
        player1: 55,
        player2: 90,
    },
    {
        axis: 'Defense',
        player1: 70,
        player2: 45,
    },
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
        {
            id: 'player1',
            value: 'player1',
            label: 'Player 1',
        },
    ],
});
```

### Custom levels and max value

```ts
createRadarChart('#container', {
    data,
    categories: ['Speed', 'Strength', 'Defense', 'Magic', 'Luck'],
    levels: 10,
    max: 100,
    series: [
        {
            id: 'player1',
            value: 'player1',
            label: 'Player 1',
            fillOpacity: 0.3,
        },
        {
            id: 'player2',
            value: 'player2',
            label: 'Player 2',
            fillOpacity: 0.3,
        },
    ],
});
```

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createRadarChart('#container', {
    data,
    categories: ['Speed', 'Power', 'Range', 'Accuracy', 'Defence'],
    max: 100,
    // Concentric grid rings.
    levels: 5,
    labels: true,
    legend: { position: 'bottom' },
    format: 'number',
    series: [
        {
            id: 'player-1',
            label: 'Player 1',
            value: 'playerOne',
            color: '#7cacf8',
            fillOpacity: 0.3,
        },
    ],
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when a point marker is clicked.
chart.on('markerclick', event => console.log(event.data)); // event.data: RadarChartMarkerEvent
// Emitted when the pointer enters a point marker.
chart.on('markerenter', event => console.log(event.data)); // event.data: RadarChartMarkerEvent
// Emitted when the pointer leaves a point marker.
chart.on('markerleave', event => console.log(event.data)); // event.data: RadarChartMarkerEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightMarker` applies the treatment hovering a point does — that marker grows and every other
series dims — without waiting for a pointer. Markers are keyed by their axis label, the same
`axisLabel` the events above report, so a bare label lights that axis in every series;
`{ key, series }` narrows it to one series' point, and an accessor receives the chart's data.
`{ tooltip: true }` opens the point's tooltip where hovering would; a radar chart draws no crosshair,
so `crosshair` is ignored here.

```ts
const chart = createRadarChart('#container', { data, categories, series });

// Light the Speed axis on every series, with its tooltip.
chart.highlightMarker('Speed', { tooltip: true });

// Only player 1's point, then the axis the third row describes.
chart.highlightMarker({ key: 'Speed', series: 'player1' });
chart.highlightMarker(data => data[2].axis);

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`, a legend toggle) or the next pointer hover restores the chart, and it
emits none of the `marker*` events above. `clearHighlight()` restores it explicitly, and
`highlightSeries('player1')` dims every other series exactly as hovering its legend entry does. Both
methods return `false` when nothing matched.
