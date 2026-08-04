# Radial Bar Chart

The **Radial Bar Chart** lays each category out as a concentric ring whose arc length encodes its value. This circular take on the bar chart reads well for a handful of comparable metrics or progress-style values. Each ring has a faint track behind a colored value arc that sweeps clockwise from the top. Value arcs are hit-tested on their stroke, so every ring is hoverable rather than only the outermost.

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
        <RiplChartConfig :config="config" extra-title="Rings" :extras-reset="reset">
            <RiplField label="Max value" option="max">
                <RiplInputNumber v-model="extras.max" placeholder="auto" />
            </RiplField>
            <RiplField label="Inner radius" option="innerRadius">
                <RiplInputRange v-model="extras.innerRadius" :min="0" :max="0.6" :step="0.05" />
            </RiplField>
            <RiplField label="Range (°)" option="range">
                <RiplInputRange v-model="extras.range" :min="180" :max="360" :step="10" />
            </RiplField>
            <RiplField label="Ring gap" option="gap">
                <RiplInputRange v-model="extras.gap" :min="0" :max="0.9" :step="0.05" />
            </RiplField>
            <RiplField label="Rounded" inline option="rounded">
                <RiplSwitch v-model="extras.rounded" />
            </RiplField>
            <template #colors>
                <RiplField label="Track color" inline option="trackColor">
                    <RiplColorInput v-model="extras.trackColor" />
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
    createRadialBarChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const LANGUAGES = ['JavaScript', 'Python', 'Rust', 'Go', 'TypeScript'];

const { extras, reset } = useChartExtras({
    max: 100 as number | undefined,
    innerRadius: 0.25,
    range: 300,
    gap: 0.25,
    rounded: true,
    trackColor: '#eceff3',
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
    title: 'Language Popularity',
});

const example = ref();

function generateData() {
    return LANGUAGES.map(language => ({
        language,
        share: Math.round(Math.random() * 80 + 20),
    }));
}

let data = generateData();

function buildOptions() {
    const options = {
        max: extras.max,
        innerRadius: extras.innerRadius,
        range: extras.range,
        gap: extras.gap,
        rounded: extras.rounded,
        trackColor: extras.trackColor,
        ...buildCommonOptions(config),
    };

    // The demo's bespoke format applies when no preset is selected.
    options.format ??= (v: number) => `${v}%`;

    return options;
}

const { contextChanged, chart } = useRiplChart(context => {
    return createRadialBarChart(context, {
        data,
        key: 'language',
        value: 'share',
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
    createRadialBarChart,
} from '@ripl/charts';

const chart = createRadialBarChart('#container', {
    data: [
        {
            language: 'JavaScript',
            share: 92,
        },
        {
            language: 'Python',
            share: 78,
        },
        {
            language: 'Rust',
            share: 61,
        },
    ],
    key: 'language',
    value: 'share',
    max: 100,
    format: v => `${v}%`,
});
```

## Data Format

Each item provides a category key and a numeric value:

```ts
const data = [
    {
        language: 'JavaScript',
        share: 92,
    },
    {
        language: 'Python',
        share: 78,
    },
];
```

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createRadialBarChart('#container', {
    data,
    key: 'id',
    value: 'progress',
    label: 'name',
    colorBy: 'team',
    max: 100,
    // Hole in the middle, as a ratio of the chart size (0–1).
    innerRadius: 0.3,
    // Sweep of a full-value bar, in degrees.
    range: 270,
    // Gap between rings, as a ratio of the ring thickness (0–0.9).
    gap: 0.3,
    trackColor: '#e5e7eb',
    rounded: true,
    legend: { position: 'right' },
    // Each ring's value, printed just past the end of its bar. The position is fixed, so
    // `anchor` has no effect here.
    labels: {
        visible: true,
        font: '11px sans-serif',
        fontColor: '#555555',
    },
    format: 'percentage',
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when a bar is clicked.
chart.on('barclick', event => console.log(event.data)); // event.data: RadialBarChartBarEvent
// Emitted when the pointer enters a bar.
chart.on('barenter', event => console.log(event.data)); // event.data: RadialBarChartBarEvent
// Emitted when the pointer leaves a bar.
chart.on('barleave', event => console.log(event.data)); // event.data: RadialBarChartBarEvent
```
<!-- events:end -->
