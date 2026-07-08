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
    ref,
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

function makePoints(count: number) {
    return Array.from({ length: count }, () => ({
        angle: Math.round(Math.random() * 360),
        speed: Math.round(Math.random() * 100),
        gust: Math.round(Math.random() * 100 + 10),
    }));
}

let morning = makePoints(12);
let evening = makePoints(12);

function getSeries() {
    return [
        { id: 'morning', label: 'Morning', angle: 'angle', radius: 'speed', sizeBy: 'gust', color: config.colors.morning },
        { id: 'evening', label: 'Evening', angle: 'angle', radius: 'speed', sizeBy: 'gust', color: config.colors.evening },
    ];
}

const { contextChanged, chart } = useRiplChart(context => {
    return createPolarScatterChart(context, {
        data: [...morning, ...evening],
        series: getSeries(),
        maxRadiusValue: 100,
        format: v => `${v} km/h`,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({
        data: [...morning, ...evening],
        series: getSeries(),
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });

function randomize() {
    morning = makePoints(morning.length);
    evening = makePoints(evening.length);
    apply();
}

function addPoint() {
    morning = makePoints(morning.length + 1);
    evening = makePoints(evening.length + 1);
    apply();
}

function removePoint() {
    if (morning.length > 3) {
        morning = makePoints(morning.length - 1);
        evening = makePoints(evening.length - 1);
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
        { angle: 45, speed: 62, gust: 80 },
        { angle: 120, speed: 34, gust: 40 },
        { angle: 250, speed: 88, gust: 95 },
    ],
    series: [
        { id: 'wind', label: 'Wind', angle: 'angle', radius: 'speed', sizeBy: 'gust' },
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
