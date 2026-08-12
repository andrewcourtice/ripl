---
title: Polar Scatter Chart
description: Plot points on a circular grid where angle and radius each encode a variable and a third can drive marker size, over configurable level rings and spokes.
---

# Polar Scatter Chart

The **Polar Scatter Chart** plots points on a circular grid where each point's **angle** encodes one variable and its **distance from the center** another; a third can drive marker size. It suits directional and cyclical data — wind, radar returns, hourly measurements — where a cartesian scatter would break the wrap-around at the edge of the axis. `levels` sets the value rings, `sectors` the angular spokes, `max` pins the outer ring, and each series binds `angleBy`, `radiusBy` and optionally `sizeBy` between `minRadius` and `maxRadius`, with `labels`, `legend` and `format` for the annotation. Point it at a Canvas, SVG or [terminal context](/charts/advanced/rendering-targets) and nothing else changes.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addPoint">Add Point</RiplButton>
            <RiplButton @click="removePoint">Remove Point</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Polar Scatter" :extras-reset="reset">
            <RiplField label="Max value" option="max">
                <RiplInputNumber v-model="extras.max" placeholder="auto" />
            </RiplField>
            <RiplField label="Value rings" option="levels">
                <RiplInputRange v-model="extras.levels" :min="3" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Angle spokes" option="sectors">
                <RiplInputRange v-model="extras.sectors" :min="4" :max="16" :step="1" />
            </RiplField>
            <RiplField label="Min marker" option="minRadius">
                <RiplInputRange v-model="extras.minRadius" :min="2" :max="12" :step="1" />
            </RiplField>
            <RiplField label="Max marker" option="maxRadius">
                <RiplInputRange v-model="extras.maxRadius" :min="8" :max="30" :step="1" />
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
    createPolarScatterChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const seriesMeta = [
    { id: 'morning', label: 'Morning' },
    { id: 'evening', label: 'Evening' },
];

const { extras, reset } = useChartExtras({
    max: 100 as number | undefined,
    levels: 4,
    sectors: 8,
    minRadius: 4,
    maxRadius: 14,
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
    title: 'Wind Samples',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

// Each sample row carries both readings, so the two series occupy visibly distinct regions:
// a gentler easterly morning breeze vs a stronger westerly evening front.
function makeSample() {
    return {
        morningAngle: Math.round(30 + Math.random() * 120),
        morningSpeed: Math.round(20 + Math.random() * 40),
        morningGust: Math.round(30 + Math.random() * 35),
        eveningAngle: Math.round(210 + Math.random() * 120),
        eveningSpeed: Math.round(50 + Math.random() * 45),
        eveningGust: Math.round(60 + Math.random() * 50),
    };
}

let samples = Array.from({ length: 12 }, makeSample);

function getSeries() {
    return [
        {
            id: 'morning',
            label: 'Morning',
            angleBy: 'morningAngle',
            radiusBy: 'morningSpeed',
            sizeBy: 'morningGust',
            minRadius: extras.minRadius,
            maxRadius: extras.maxRadius,
            color: config.colors.morning,
        },
        {
            id: 'evening',
            label: 'Evening',
            angleBy: 'eveningAngle',
            radiusBy: 'eveningSpeed',
            sizeBy: 'eveningGust',
            minRadius: extras.minRadius,
            maxRadius: extras.maxRadius,
            color: config.colors.evening,
        },
    ];
}

function buildOptions() {
    const options = {
        series: getSeries(),
        max: extras.max,
        levels: extras.levels,
        sectors: extras.sectors,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v} km/h`;

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createPolarScatterChart(context, {
        data: samples,
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    // Re-roll every sample's values but keep the count, so points morph in place.
    samples = samples.map(makeSample);
    chart.value?.update({ data: samples });
}

function addPoint() {
    // Append a single new sample; existing points stay put while the new one animates in.
    samples = [...samples, makeSample()];
    chart.value?.update({ data: samples });
}

function removePoint() {
    if (samples.length > 3) {
        // Drop only the newest sample so exactly one point exits.
        samples = samples.slice(0, -1);
        chart.value?.update({ data: samples });
    }
}
</script>

## Usage

```ts
import {
    createPolarScatterChart,
} from '@ripl/charts';

const chart = createPolarScatterChart('#container', {
    data: [
        {
            angle: 45,
            speed: 62,
            gust: 80,
        },
        {
            angle: 120,
            speed: 34,
            gust: 40,
        },
        {
            angle: 250,
            speed: 88,
            gust: 95,
        },
    ],
    series: [
        {
            id: 'wind',
            label: 'Wind',
            angleBy: 'angle',
            radiusBy: 'speed',
            sizeBy: 'gust',
        },
    ],
    max: 100,
});
```

## Data Format

Each item provides an angle (in degrees, `0°` at the top and increasing clockwise), a radial value, and optionally a size value:

```ts
const data = [
    {
        angle: 45,
        speed: 62,
        gust: 80,
    },
    {
        angle: 120,
        speed: 34,
        gust: 40,
    },
];
```

Every series reads **all** rows through its own accessors. For multiple series, keep one row per
observation and point each series at its own fields:

```ts
const data = [
    {
        morningAngle: 60,
        morningSpeed: 32,
        eveningAngle: 250,
        eveningSpeed: 78,
    },
];

const series = [
    {
        id: 'morning',
        label: 'Morning',
        angleBy: 'morningAngle',
        radiusBy: 'morningSpeed',
    },
    {
        id: 'evening',
        label: 'Evening',
        angleBy: 'eveningAngle',
        radiusBy: 'eveningSpeed',
    },
];
```

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createPolarScatterChart('#container', {
    data,
    // Outer bound of the radial scale; omit to derive it from the data.
    max: 100,
    // Concentric value rings and angular spokes.
    levels: 5,
    sectors: 12,
    labels: true,
    legend: { position: 'bottom' },
    format: 'number',
    series: [
        {
            id: 'morning',
            label: 'Morning',
            color: '#7cacf8',
            angleBy: 'bearing',
            radiusBy: 'distance',
            sizeBy: 'weight',
            minRadius: 4,
            maxRadius: 18,
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
// Emitted when a marker is clicked.
chart.on('markerclick', event => console.log(event.data)); // event.data: PolarScatterMarkerEvent
// Emitted when the pointer enters a marker.
chart.on('markerenter', event => console.log(event.data)); // event.data: PolarScatterMarkerEvent
// Emitted when the pointer leaves a marker.
chart.on('markerleave', event => console.log(event.data)); // event.data: PolarScatterMarkerEvent
```
<!-- events:end -->

## Programmatic Interaction

`highlightMarker` applies the treatment hovering a marker does — it grows and every other series dims
— without waiting for a pointer. The chart has no key accessor, since every series plots the whole
dataset, so markers are addressed by the item's position in `data` as a string — the `index` the
events above report. A bare index lights that item in every series; `{ key, series }` narrows it to
one, and an accessor over the chart's data can find the index for you. `{ tooltip: true }` opens the
marker's tooltip where hovering would; a polar scatter chart draws no crosshair, so `crosshair` is
ignored here.

```ts
const chart = createPolarScatterChart('#container', { data, series, max: 100 });

// Light the third reading in every series, with its tooltip.
chart.highlightMarker('2', { tooltip: true });

// Only the wind series' marker, then the first gust above 90.
chart.highlightMarker({ key: '2', series: 'wind' });
chart.highlightMarker(data => String(data.findIndex(item => item.gust > 90)));

chart.clearHighlight();
```

One highlight is active at a time — a matching call replaces the last — and it is one-shot: the next
render (a resize, an `update`, a legend toggle) or the next pointer hover restores the chart, and it
emits none of the `marker*` events above. `clearHighlight()` restores it explicitly, and
`highlightSeries('wind')` dims every other series exactly as hovering its legend entry does. Both
methods return `false` when nothing matched.
