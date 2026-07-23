# Trend Chart

The **Trend Chart** is a true mixed cartesian chart that combines line, bar, and area series on shared axes. Each series declares its `type` (`'line'`, `'bar'`, or `'area'`) plus the options specific to that type, and the chart reuses the same renderers as the standalone line, bar, and area charts. Series paint back-to-front as **area → bar → line** so lines never hide behind fills or bars, and overlaid areas are drawn largest-first so smaller areas stay visible. Same-type series can be stacked, and an optional **navigator** strip beneath the plot lets you window the visible x-range (with wheel/drag pan-zoom on the plot itself).

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="randomise">Randomise</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Trend" :extras-reset="reset">
            <RiplField label="Stacked" inline>
                <RiplSwitch v-model="extras.stacked" />
            </RiplField>
            <RiplField label="Line type">
                <RiplSelect v-model="extras.lineType">
                    <option value="linear">Linear</option>
                    <option value="spline">Spline</option>
                    <option value="basis">Basis</option>
                    <option value="cardinal">Cardinal</option>
                    <option value="catmullRom">Catmull-Rom</option>
                    <option value="natural">Natural</option>
                    <option value="monotoneX">Monotone X</option>
                    <option value="monotoneY">Monotone Y</option>
                    <option value="bumpX">Bump X</option>
                    <option value="bumpY">Bump Y</option>
                    <option value="step">Step</option>
                    <option value="stepBefore">Step Before</option>
                    <option value="stepAfter">Step After</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Corner radius">
                <RiplInputRange v-model="extras.borderRadius" :min="0" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Fill opacity">
                <RiplInputRange v-model="extras.fillOpacity" :min="0" :max="1" :step="0.05" />
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

const { extras, reset } = useChartExtras({
    stacked: false,
    lineType: 'monotoneX' as PolylineRenderer,
    borderRadius: 2,
    fillOpacity: 0.25,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        axes: true,
        grid: true,
        tooltip: true,
        crosshair: true,
        dataLabels: true,
        format: true,
        animation: true,
        theme: true,
        navigator: true,
    },
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
        ...(s.type === 'area' ? { fillOpacity: extras.fillOpacity } : {}),
        ...(s.type === 'bar' ? {} : { lineType: extras.lineType }),
    })) as TrendChartSeriesOptions<SalesRow>[];
}

function buildOptions() {
    return {
        stacked: extras.stacked,
        borderRadius: extras.borderRadius,
        series: getSeries(),
        ...buildCommonOptions(config),
    };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let data = Array.from({ length: MONTHS.length }, (_, index) => getDataItem(index));

const example = ref();

const {
    chart,
    contextChanged,
} = useRiplChart(context => createTrendChart(context, {
    data,
    key: 'month',
    ...buildOptions(),
}));

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


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
    {
        month: 'Jan',
        revenue: 620,
        orders: 140,
        target: 700,
    },
    {
        month: 'Feb',
        revenue: 780,
        orders: 190,
        target: 720,
    },
    {
        month: 'Mar',
        revenue: 550,
        orders: 120,
        target: 680,
    },
];
```

## Variants

### Stacked

Same-type series stack independently, so bars stack among bar series and areas among area series:

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

- **`data`**: the data array shared by all series
- **`series`**: array of series, each a discriminated union on `type`:
  - **`type: 'line'`**: `id`, `value`, `label`, optional `color`, `lineType`, `lineWidth`, `lineStyle` (`'solid'` \| `'dashed'` \| `'dotted'` \| custom dash array), `markers`, `markerRadius`
  - **`type: 'area'`**: as line, plus `fillOpacity` (fill opacity, default `0.3`); unstacked areas paint largest-first
  - **`type: 'bar'`**: `id`, `value`, `label`, optional `color`
- **`key`**: key accessor for the categorical x-axis
- **`stacked`**: stack same-type series (default `false`)
- **`borderRadius`**: corner radius applied to bars (default `2`)
- **`overview`** (`boolean | { size }`): show the navigator strip; enabling it also turns on in-plot pan/zoom
- **`navigator`** (`boolean | NavigatorInteractions`): configure in-plot pan/zoom/brush directly
- **`labels`** (`boolean | anchor`): show value labels next to marks
- **`grid`** (`boolean | ChartGridOptions`): show/configure grid lines
- **`crosshair`** (`boolean | ChartCrosshairOptions`): show/configure crosshair
- **`tooltip`** (`boolean | ChartTooltipOptions`): show/configure tooltips
- **`legend`** (`boolean | ChartLegendOptions`): show/configure legend
- **`axis`** (`boolean | ChartAxisOptions`): configure x/y axes
- **`format`**: format applied to values in tooltips and labels

## Events

Bar series emit `barclick` / `barenter` / `barleave`, and line/area markers emit `markerclick` / `markerenter` / `markerleave`. Each payload carries `{ x, y, xValue, yValue, seriesId }`:

```ts
chart.on('markerclick', event => {
    const { seriesId, xValue, yValue } = event.data;
    console.log(`${seriesId} @ ${xValue}: ${yValue}`);
});
```
