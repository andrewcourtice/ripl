# Trend Chart

The **Trend Chart** is a true mixed cartesian chart that combines line, bar, and area series on shared axes. Each series declares its `type` (`'line'`, `'bar'`, or `'area'`) plus the options specific to that type, and the chart reuses the same renderers as the standalone line, bar, and area charts. Series paint back-to-front as **area → bar → line** so lines never hide behind fills or bars, and overlaid areas are drawn largest-first so smaller areas stay visible. Same-type series can be stacked, and an optional **navigator** strip beneath the plot lets you window the visible x-range (with wheel/drag pan-zoom on the plot itself).

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="randomise">Randomise</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Trend">
            <RiplField label="Stacked" inline>
                <RiplSwitch v-model="stacked" />
            </RiplField>
            <RiplField label="Navigator" inline>
                <RiplSwitch v-model="overview" />
            </RiplField>
            <RiplField label="Line type">
                <RiplSelect v-model="lineType">
                    <option value="linear">Linear</option>
                    <option value="spline">Spline</option>
                    <option value="basis">Basis</option>
                    <option value="bumpX">Bump X</option>
                    <option value="cardinal">Cardinal</option>
                    <option value="catmullRom">Catmull-Rom</option>
                    <option value="monotoneX">Monotone X</option>
                    <option value="natural">Natural</option>
                    <option value="step">Step</option>
                </RiplSelect>
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
} from '../.vitepress/compositions/use-chart-config';

import {
    createTrendChart,
} from '@ripl/charts';

import type {
    TrendChartSeriesOptions,
} from '@ripl/charts';

import type {
    PolylineRenderer,
} from '@ripl/web';

import {
    ref,
    watch,
} from 'vue';

interface SalesRow {
    month: string;
    revenue: number;
    expenses: number;
    orders: number;
    target: number;
}

const seriesMeta = [
    { type: 'area' as const, id: 'revenue', label: 'Revenue', value: 'revenue' },
    { type: 'area' as const, id: 'expenses', label: 'Expenses', value: 'expenses' },
    { type: 'bar' as const, id: 'orders', label: 'Orders', value: 'orders' },
    { type: 'line' as const, id: 'target', label: 'Target', value: 'target' },
];

const stacked = ref(false);
const overview = ref(false);
const lineType = ref<PolylineRenderer>('monotoneX');

const config = useChartConfig({
    features: { title: true, legend: true, axes: true, grid: true, animation: true },
    title: 'Sales Trend',
    axisY: 'Value',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function getSeries(): TrendChartSeriesOptions<SalesRow>[] {
    return seriesMeta.map(s => ({
        type: s.type,
        id: s.id,
        label: s.label,
        value: s.value,
        color: config.colors[s.id],
        ...(s.type === 'area' ? { fillOpacity: 0.25 } : {}),
        ...(s.type === 'bar' ? {} : { lineType: lineType.value }),
    })) as TrendChartSeriesOptions<SalesRow>[];
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let data = Array.from({ length: MONTHS.length }, (_, index) => getDataItem(index));

const {
    chart,
    contextChanged,
} = useRiplChart(context => createTrendChart(context, {
    data,
    key: 'month',
    series: getSeries(),
    stacked: stacked.value,
    overview: overview.value,
    ...buildCommonOptions(config),
}));

function apply() {
    chart.value?.update({
        series: getSeries(),
        stacked: stacked.value,
        overview: overview.value,
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });
watch([stacked, overview, lineType], apply);

function monthLabel(index: number): string {
    const year = 24 + Math.floor(index / MONTHS.length);
    return `${MONTHS[index % MONTHS.length]} '${year}`;
}

function getValue(min: number, max: number) {
    return Math.round(min + Math.random() * (max - min));
}

function rollValues() {
    return {
        revenue: getValue(400, 1000),
        expenses: getValue(120, 420),
        orders: getValue(60, 320),
        target: getValue(520, 900),
    };
}

function getDataItem(index: number): SalesRow {
    return {
        month: monthLabel(index),
        ...rollValues(),
    };
}

function addData() {
    data.push(getDataItem(data.length));
    chart.value?.update({ data });
}

function randomise() {
    data = data.map(item => ({
        month: item.month,
        ...rollValues(),
    }));

    chart.value?.update({ data });
}
</script>

## Usage

```ts
import {
    createTrendChart,
} from '@ripl/charts';

const chart = createTrendChart('#container', {
    data: [/* ... */],
    key: 'month',
    series: [
        { type: 'area', id: 'revenue', label: 'Revenue', value: 'revenue' },
        { type: 'bar', id: 'orders', label: 'Orders', value: 'orders' },
        { type: 'line', id: 'target', label: 'Target', value: 'target' },
    ],
});
```

## Data Format

A single flat dataset is shared by every series; each series reads its own numeric field via `value`, and `key` gives the category plotted along the x axis:

```ts
const data = [
    { month: 'Jan',
        revenue: 620,
        orders: 140,
        target: 700 },
    { month: 'Feb',
        revenue: 780,
        orders: 190,
        target: 720 },
    { month: 'Mar',
        revenue: 550,
        orders: 120,
        target: 680 },
];
```

## Variants

### Stacked

Same-type series stack independently — bars stack among bar series, areas among area series:

```ts
createTrendChart('#container', {
    data,
    key: 'month',
    stacked: true,
    series: [
        { type: 'area', id: 'revenue', label: 'Revenue', value: 'revenue' },
        { type: 'area', id: 'expenses', label: 'Expenses', value: 'expenses' },
        { type: 'line', id: 'target', label: 'Target', value: 'target' },
    ],
});
```

### Navigator

Enable the overview strip to window the visible x-range (and pan/zoom on the plot):

```ts
createTrendChart('#container', {
    data,
    key: 'month',
    overview: true,
    series: [
        { type: 'bar', id: 'orders', label: 'Orders', value: 'orders' },
        { type: 'line', id: 'target', label: 'Target', value: 'target' },
    ],
});
```

## Options

- **`data`** — The data array shared by all series
- **`series`** — Array of series, each a discriminated union on `type`:
  - **`type: 'line'`** — `id`, `value`, `label`, optional `color`, `lineType`, `lineWidth`, `lineStyle` (`'solid'` \| `'dashed'` \| `'dotted'` \| custom dash array), `markers`, `markerRadius`
  - **`type: 'area'`** — as line, plus `fillOpacity` (fill opacity, default `0.3`); unstacked areas paint largest-first
  - **`type: 'bar'`** — `id`, `value`, `label`, optional `color`
- **`key`** — Key accessor for the categorical x-axis
- **`stacked`** — Stack same-type series (default `false`)
- **`borderRadius`** — Corner radius applied to bars (default `2`)
- **`overview`** — `boolean | { size }` — Show the navigator strip; enabling it also turns on in-plot pan/zoom
- **`navigator`** — `boolean | NavigatorInteractions` — Configure in-plot pan/zoom/brush directly
- **`labels`** — `boolean | anchor` — Show value labels next to marks
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes
- **`format`** — Format applied to values in tooltips and labels

## Events

Bar series emit `barclick` / `barenter` / `barleave`, and line/area markers emit `markerclick` / `markerenter` / `markerleave`. Each payload carries `{ x, y, xValue, yValue, seriesId }`:

```ts
chart.on('markerclick', event => {
    const { seriesId, xValue, yValue } = event.data;
    console.log(`${seriesId} @ ${xValue}: ${yValue}`);
});
```
