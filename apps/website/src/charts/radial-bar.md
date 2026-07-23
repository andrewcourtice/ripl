# Radial Bar Chart

The **Radial Bar Chart** lays each category out as a concentric ring whose arc length encodes its value. This circular take on the bar chart reads well for a handful of comparable metrics or progress-style values. Each ring has a faint track behind a colored value arc that sweeps clockwise from the top.

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
            <RiplField label="Max value">
                <RiplInputNumber v-model="extras.maxValue" placeholder="auto" />
            </RiplField>
            <RiplField label="Inner radius">
                <RiplInputRange v-model="extras.innerRadius" :min="0" :max="0.6" :step="0.05" />
            </RiplField>
            <RiplField label="Range (°)">
                <RiplInputRange v-model="extras.range" :min="180" :max="360" :step="10" />
            </RiplField>
            <RiplField label="Ring gap">
                <RiplInputRange v-model="extras.gap" :min="0" :max="0.9" :step="0.05" />
            </RiplField>
            <RiplField label="Rounded" inline>
                <RiplSwitch v-model="extras.rounded" />
            </RiplField>
            <RiplField label="Track color" inline>
                <RiplColorInput v-model="extras.trackColor" />
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
    maxValue: 100 as number | undefined,
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
        maxValue: extras.maxValue,
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
    maxValue: 100,
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

- **`data`**: the data array
- **`key`**: category accessor (a field name or a function)
- **`value`**: numeric value accessor; encoded as the arc length
- **`label`**: optional label accessor (defaults to `key`)
- **`colorBy`**: optional per-category color accessor
- **`maxValue`**: value mapped to a full sweep (defaults to the data maximum)
- **`innerRadius`**: inner hole radius as a ratio of the chart size (default `0.2`)
- **`range`**: angular sweep of a full-value bar in degrees (default `360`)
- **`gap`**: gap between rings as a ratio of ring thickness (default `0.25`)
- **`rounded`**: round the ends of each value bar and its track (default `false`)
- **`trackColor`**: background track color
- **`legend`** (`boolean | ChartLegendOptions`): category legend
- **`format`**: value formatter for tooltips
- **`padding`**, **`title`**, **`animation`**: standard chart options
