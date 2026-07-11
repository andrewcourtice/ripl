# Polar Scatter Chart

The **Polar Scatter Chart** plots points on a circular grid, where each point's **angle** encodes one variable and its **distance from the centre** another — with an optional third variable driving marker size. It's ideal for directional data (wind, radar returns, cyclical measurements) where a cartesian scatter would misrepresent the wrap-around nature of the angle.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addPoint">Add Point</RiplButton>
            <RiplButton @click="removePoint">Remove Point</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Polar Scatter" />
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    buildCommonOptions,
    seedColors,
    useChartConfig,
} from '../../.vitepress/compositions/use-chart-config';

import {
    createPolarScatterChart,
} from '@ripl/charts';

import {
    watch,
} from 'vue';

const seriesMeta = [
    { id: 'morning', label: 'Morning' },
    { id: 'evening', label: 'Evening' },
];

const config = useChartConfig({
    features: { title: true, legend: true, animation: true },
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
        { id: 'morning', label: 'Morning', angle: 'morningAngle', radius: 'morningSpeed', sizeBy: 'morningGust', color: config.colors.morning },
        { id: 'evening', label: 'Evening', angle: 'eveningAngle', radius: 'eveningSpeed', sizeBy: 'eveningGust', color: config.colors.evening },
    ];
}

const { contextChanged, chart } = useRiplChart(context => {
    return createPolarScatterChart(context, {
        data: samples,
        series: getSeries(),
        maxRadiusValue: 100,
        format: v => `${v} km/h`,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({
        data: [...samples],
        series: getSeries(),
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });

function randomize() {
    // Re-roll every sample's values but keep the count, so points morph in place.
    samples = samples.map(makeSample);
    apply();
}

function addPoint() {
    // Append a single new sample — existing points stay put while the new one animates in.
    samples = [...samples, makeSample()];
    apply();
}

function removePoint() {
    if (samples.length > 3) {
        // Drop only the newest sample so exactly one point exits.
        samples = samples.slice(0, -1);
        apply();
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
        { angle: 45,
            speed: 62,
            gust: 80 },
        { angle: 120,
            speed: 34,
            gust: 40 },
        { angle: 250,
            speed: 88,
            gust: 95 },
    ],
    series: [
        { id: 'wind',
            label: 'Wind',
            angle: 'angle',
            radius: 'speed',
            sizeBy: 'gust' },
    ],
    maxRadiusValue: 100,
});
```

## Data Format

Each item provides an angle (in degrees, `0°` at the top and increasing clockwise), a radial value, and optionally a size value:

```ts
const data = [
    { angle: 45,
        speed: 62,
        gust: 80 },
    { angle: 120,
        speed: 34,
        gust: 40 },
];
```

Every series reads **all** rows through its own accessors. For multiple series, keep one row per
observation and point each series at its own fields:

```ts
const data = [
    { morningAngle: 60,
        morningSpeed: 32,
        eveningAngle: 250,
        eveningSpeed: 78 },
];

const series = [
    { id: 'morning',
        label: 'Morning',
        angle: 'morningAngle',
        radius: 'morningSpeed' },
    { id: 'evening',
        label: 'Evening',
        angle: 'eveningAngle',
        radius: 'eveningSpeed' },
];
```

## Options

- **`data`** — The data array
- **`series`** — Array of series with `id`, `label`, `angle` (degrees accessor), `radius` (value accessor), optional `color`, `sizeBy`, `minRadius`, `maxRadius`
- **`maxRadiusValue`** — Value mapped to the outer ring (defaults to the data maximum)
- **`levels`** — Number of concentric value rings (default `4`)
- **`angleTicks`** — Number of angular spokes/labels (default `8`)
- **`legend`** — `boolean | ChartLegendOptions` — Series legend (shown by default for multiple series)
- **`format`** — Value formatter for tooltips and ring labels
- **`padding`** — Chart padding
- **`title`** — `string | ChartTitleOptions` — Chart title
- **`animation`** — `boolean | ChartAnimationOptions` — Enable/configure animations
