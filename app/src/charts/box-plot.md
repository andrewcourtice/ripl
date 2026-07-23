# Box Plot Chart

The **Box Plot Chart** summarises the distribution of a numeric field per category using the shared `boxplotStats` transform: a box spanning the interquartile range (Q1–Q3), a median line, whiskers to the 1.5×IQR fences, and outlier points. It's the standard view for comparing spread and skew across groups.

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
        <RiplChartConfig :config="config" extra-title="Box Plot" :extras-reset="reset">
            <RiplField label="Box colour" inline>
                <RiplColorInput v-model="extras.color" />
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
    createBoxPlotChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const REGIONS = ['US', 'EU', 'APAC', 'LATAM'];

const { extras, reset } = useChartExtras({
    color: '#7cacf8',
});

const config = useChartConfig({
    features: {
        title: true,
        grid: true,
        tooltip: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Latency by Region',
});

const example = ref();

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

function buildOptions() {
    return {
        color: extras.color,
        ...buildCommonOptions(config),
    };
}

const { contextChanged, chart } = useRiplChart(context => {
    return createBoxPlotChart(context, {
        data,
        key: 'region',
        value: 'latency',
        categories: REGIONS,
        axis: {
            x: { title: 'Region' },
            y: { title: 'Latency (ms)' },
        },
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
