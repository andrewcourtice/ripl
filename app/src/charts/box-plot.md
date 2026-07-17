# Box Plot Chart

The **Box Plot Chart** summarises the distribution of a numeric field per category using the shared `boxplotStats` transform: a box spanning the interquartile range (Q1–Q3), a median line, whiskers to the 1.5×IQR fences, and outlier points. It's the standard view for comparing spread and skew across groups.

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
        <RiplChartConfig :config="config" extra-title="Box Plot" />
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
    createBoxPlotChart,
} from '@ripl/charts';

import {
    watch,
} from 'vue';

const REGIONS = ['US', 'EU', 'APAC', 'LATAM'];

const config = useChartConfig({
    features: { title: true, animation: true, navigator: true },
    title: 'Latency by Region',
});

function generateData() {
    return REGIONS.flatMap((region, index) => {
        const centre = 60 + index * 30;

        return Array.from({ length: 20 }, () => ({
            region,
            latency: Math.round(centre + (Math.random() - 0.5) * 80),
        }));
    });
}

let data = generateData();

const { contextChanged, chart } = useRiplChart(context => {
    return createBoxPlotChart(context, {
        data,
        key: 'region',
        value: 'latency',
        categories: REGIONS,
        padding: { top: 20, right: 20, bottom: 40, left: 40 },
        axis: {
            x: { title: 'Region' },
            y: { title: 'Latency (ms)' },
        },
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({ ...buildCommonOptions(config) });
}

watch(config, apply, { deep: true });

function randomize() {
    data = generateData();
    chart.value?.update({ data });
}
</script>

## Usage

```ts
import {
    createBoxPlotChart,
} from '@ripl/charts';

const chart = createBoxPlotChart('#container', {
    data: [/* ... */],
    key: 'region',
    value: 'latency',
});
```

## Data Format

Each item contributes one numeric value to a category. The chart groups items by the `key`
accessor and summarises the `value` accessor per group — no pre-aggregation required.

## Options

- **`data`** — The data array
- **`key`** — Accessor for the category (field name or function)
- **`value`** — Accessor for the numeric value (field name or function)
- **`categories`** — Explicit category order (default: first-seen order)
- **`color`** — Box colour (default: first palette colour)
- **`format`** — Format applied to summary values in tooltips
