# Area Chart

The **Area Chart** renders filled areas beneath lines, making it easy to compare cumulative totals or show how individual series contribute to a whole. It supports stacked mode (areas stacked on top of each other), per-series opacity and line interpolation, and includes crosshair, grid, tooltips, and a legend. On entry the area is revealed left-to-right as the line draws on, and it transitions smoothly between data states on update.

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
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Area">
            <RiplField label="Stacked" inline>
                <RiplSwitch v-model="stacked" />
            </RiplField>
        </RiplChartConfig>
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
    createAreaChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const seriesMeta = [
    { id: 'desktop', label: 'Desktop' },
    { id: 'mobile', label: 'Mobile' },
];

const stacked = ref(false);

const config = useChartConfig({
    features: { title: true, legend: true, axes: true, grid: true, animation: true },
    title: 'Traffic by Device',
    axisX: 'Month',
    axisY: 'Sessions',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function generateData() {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
        month,
        desktop: Math.round(Math.random() * 600 + 200),
        mobile: Math.round(Math.random() * 600 - 200),
    }));
}

let data = generateData();

function getSeries() {
    return seriesMeta.map(s => ({
        id: s.id,
        value: s.id,
        label: s.label,
        opacity: 0.3,
        color: config.colors[s.id],
    }));
}

const { contextChanged, chart } = useRiplChart(context => {
    return createAreaChart(context, {
        data,
        key: 'month',
        stacked: stacked.value,
        padding: { top: 20, right: 20, bottom: 30, left: 20 },
        series: getSeries(),
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({
        stacked: stacked.value,
        series: getSeries(),
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });
watch(stacked, apply);

function randomize() {
    data = generateData();
    chart.value?.update({ data });
}
</script>

## Usage

```ts
import {
    createAreaChart,
} from '@ripl/charts';

const chart = createAreaChart('#container', {
    data: [...],
    key: 'month',
    stacked: false,
    series: [
        { id: 'desktop', value: 'desktop', label: 'Desktop' },
        { id: 'mobile', value: 'mobile', label: 'Mobile' },
    ],
});
```

## Data Format

Each item should contain a key field and one or more numeric value fields:

```ts
const data = [
    { month: 'Jan',
        desktop: 620,
        mobile: 340 },
    { month: 'Feb',
        desktop: 780,
        mobile: 290 },
    { month: 'Mar',
        desktop: 550,
        mobile: 410 },
];
```

## Variants

### Stacked

Stack series to show cumulative totals:

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    stacked: true,
    series: [
        { id: 'desktop',
            value: 'desktop',
            label: 'Desktop',
            opacity: 0.4 },
        { id: 'mobile',
            value: 'mobile',
            label: 'Mobile',
            opacity: 0.4 },
    ],
});
```

### Custom opacity and line type

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'desktop',
            value: 'desktop',
            label: 'Desktop',
            opacity: 0.2,
            lineType: 'monotoneX' },
        { id: 'mobile',
            value: 'mobile',
            label: 'Mobile',
            opacity: 0.6,
            lineType: 'step' },
    ],
});
```

## Options

- **`data`** — The data array
- **`series`** — Array of series with `id`, `value`, `label`, optional `color`, `opacity`, `lineType`
- **`key`** — Key accessor for data points
- **`stacked`** — Stack series on top of each other (default `false`)
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines (default `true`)
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair (default `true`)
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips (default `true`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes
