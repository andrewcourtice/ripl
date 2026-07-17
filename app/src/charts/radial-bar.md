# Radial Bar Chart

The **Radial Bar Chart** lays each category out as a concentric ring whose arc length encodes its value — a circular take on the bar chart that reads well for a handful of comparable metrics or progress-style values. Each ring has a faint track behind a colored value arc that sweeps clockwise from the top.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Radial Bar">
            <RiplField label="Range (°)">
                <RiplInputRange v-model="range" :min="180" :max="360" :step="10" />
            </RiplField>
            <RiplField label="Rounded" inline>
                <RiplSwitch v-model="rounded" />
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
} from '../.vitepress/compositions/use-chart-config';

import {
    createRadialBarChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const LANGUAGES = ['JavaScript', 'Python', 'Rust', 'Go', 'TypeScript'];

const range = ref(300);
const rounded = ref(true);

const config = useChartConfig({
    features: { title: true, legend: true, animation: true },
    title: 'Language Popularity',
});

function generateData() {
    return LANGUAGES.map(language => ({
        language,
        share: Math.round(Math.random() * 80 + 20),
    }));
}

let data = generateData();

const { contextChanged, chart } = useRiplChart(context => {
    return createRadialBarChart(context, {
        data,
        key: 'language',
        value: 'share',
        maxValue: 100,
        innerRadius: 0.25,
        range: range.value,
        rounded: rounded.value,
        format: v => `${v}%`,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({
        range: range.value,
        rounded: rounded.value,
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });
watch([range, rounded], apply);

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
        { language: 'JavaScript',
            share: 92 },
        { language: 'Python',
            share: 78 },
        { language: 'Rust',
            share: 61 },
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
    { language: 'JavaScript',
        share: 92 },
    { language: 'Python',
        share: 78 },
];
```

## Options

- **`data`** — The data array
- **`key`** — Category accessor (a field name or a function)
- **`value`** — Numeric value accessor; encoded as the arc length
- **`label`** — Optional label accessor (defaults to `key`)
- **`colorBy`** — Optional per-category color accessor
- **`maxValue`** — Value mapped to a full sweep (defaults to the data maximum)
- **`innerRadius`** — Inner hole radius as a ratio of the chart size (default `0.2`)
- **`range`** — Angular sweep of a full-value bar in degrees (default `360`)
- **`gap`** — Gap between rings as a ratio of ring thickness (default `0.25`)
- **`rounded`** — Round the ends of each value bar and its track (default `false`)
- **`trackColor`** — Background track color
- **`legend`** — `boolean | ChartLegendOptions` — Category legend
- **`format`** — Value formatter for tooltips
- **`padding`**, **`title`**, **`animation`** — Standard chart options
