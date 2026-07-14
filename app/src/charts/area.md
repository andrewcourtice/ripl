# Area Chart

The **Area Chart** renders filled areas beneath lines, making it easy to compare cumulative totals or show how individual series contribute to a whole. It supports stacked mode (areas stacked on top of each other), per-series opacity and line interpolation, and includes crosshair, grid, tooltips, and a legend. On entry the area is revealed left-to-right as the line draws on, and it transitions smoothly between data states on update.

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
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Area">
            <RiplField label="Line type">
                <RiplSelect v-model="lineType">
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
            <RiplField label="Line style">
                <RiplSelect v-model="lineStyle">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Stacked" inline>
                <RiplSwitch v-model="stacked" />
            </RiplField>
            <RiplField label="Markers" inline>
                <RiplSwitch v-model="markers" />
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
    createAreaChart,
} from '@ripl/charts';

import type {
    PolylineRenderer,
} from '@ripl/web';

import {
    ref,
    watch,
} from 'vue';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const seriesMeta = [
    { id: 'desktop', label: 'Desktop' },
    { id: 'mobile', label: 'Mobile' },
];

const stacked = ref(false);
const lineType = ref<PolylineRenderer>('monotoneX');
const lineStyle = ref<'solid' | 'dashed' | 'dotted'>('solid');
const markers = ref(false);

const config = useChartConfig({
    features: { title: true, legend: true, axes: true, grid: true, animation: true, navigator: true },
    title: 'Traffic by Device',
    axisX: 'Month',
    axisY: 'Sessions',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function generateData(count = 6) {
    return MONTHS.slice(0, count).map(month => ({
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
        lineType: lineType.value,
        lineStyle: lineStyle.value,
        markers: markers.value,
        color: config.colors[s.id],
    }));
}

const { contextChanged, chart } = useRiplChart(context => {
    return createAreaChart(context, {
        data,
        key: 'month',
        stacked: stacked.value,
        padding: { top: 30, right: 20, bottom: 30, left: 20 },
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
watch([stacked, lineType, lineStyle, markers], apply);

function randomize() {
    data = generateData(data.length);
    chart.value?.update({ data });
}

function addPoint() {
    if (data.length < MONTHS.length) {
        data = generateData(data.length + 1);
        chart.value?.update({ data });
    }
}

function removePoint() {
    if (data.length > 2) {
        data = generateData(data.length - 1);
        chart.value?.update({ data });
    }
}
</script>

## Usage

```ts
import {
    createAreaChart,
} from '@ripl/charts';

const chart = createAreaChart('#container', {
    data: [/* ... */],
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
- **`series`** — Array of series with `id`, `value`, `label`, optional `color`, `opacity`, `lineType`, `lineStyle` (`'solid'` \| `'dashed'` \| `'dotted'` \| custom dash array), `lineWidth`, `markers`
- **`key`** — Key accessor for data points
- **`stacked`** — Stack series on top of each other (default `false`)
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines (default `true`)
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair (default `true`)
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips (default `true`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes
