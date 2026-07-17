# Area Chart

The **Area Chart** renders filled areas beneath lines, making it easy to compare cumulative totals or show how individual series contribute to a whole. It supports stacked mode (areas stacked on top of each other), per-series opacity and line interpolation, and includes crosshair, grid, tooltips, and a legend. When areas overlap (unstacked), they are painted largest-first so a smaller area is never hidden behind a larger one. On entry the area is revealed left-to-right as the line draws on, and it transitions smoothly between data states on update.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addPoint">Add Point</RiplButton>
            <RiplButton @click="removePoint">Remove Point</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Area" :extras-reset="reset">
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
            <RiplField label="Line style">
                <RiplSelect v-model="extras.lineStyle">
                    <option value="solid">Solid</option>
                    <option value="dashed">Dashed</option>
                    <option value="dotted">Dotted</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Fill opacity">
                <RiplInputRange v-model="extras.fillOpacity" :min="0" :max="1" :step="0.05" />
            </RiplField>
            <RiplField label="Markers" inline>
                <RiplSwitch v-model="extras.markers" />
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

const { extras, reset } = useChartExtras({
    stacked: false,
    lineType: 'monotoneX' as PolylineRenderer,
    lineStyle: 'solid' as 'solid' | 'dashed' | 'dotted',
    fillOpacity: 0.3,
    markers: false,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        axes: true,
        grid: true,
        tooltip: true,
        crosshair: true,
        format: true,
        animation: true,
        theme: true,
        navigator: true,
        annotations: true,
    },
    title: 'Traffic by Device',
    axisX: 'Month',
    axisY: 'Sessions',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function generateData(count = 6) {
    return MONTHS.slice(0, count).map(month => ({
        month,
        desktop: Math.round(Math.random() * 600 + 200),
        mobile: Math.round(Math.random() * 400 + 100),
    }));
}

let data = generateData();

function getSeries() {
    return seriesMeta.map(s => ({
        id: s.id,
        value: s.id,
        label: s.label,
        fillOpacity: extras.fillOpacity,
        lineType: extras.lineType,
        lineStyle: extras.lineStyle,
        markers: extras.markers,
        color: config.colors[s.id],
    }));
}

function buildOptions() {
    const options = {
        stacked: extras.stacked,
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // Sample reference line + shaded band, drawn through the y scale.
    options.annotations = config.annotationsVisible
        ? [
            {
                axis: 'y',
                value: 500,
                label: 'Target',
            },
            {
                type: 'band',
                axis: 'y',
                from: 0,
                to: 200,
                label: 'Baseline',
            },
        ]
        : [];

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createAreaChart(context, {
        data,
        key: 'month',
        padding: { top: 30, right: 20, bottom: 30, left: 20 },
        ...buildOptions(),
    });
});

// Furniture options (axes, grid, tooltip, crosshair, legend, theme, navigator) are only read when a
// chart is constructed, so rebuild the chart on any customization change; data edits animate in place.
watch([config, extras], () => example.value?.recreate(), { deep: true });

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
            fillOpacity: 0.4 },
        { id: 'mobile',
            value: 'mobile',
            label: 'Mobile',
            fillOpacity: 0.4 },
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
            fillOpacity: 0.2,
            lineType: 'monotoneX' },
        { id: 'mobile',
            value: 'mobile',
            label: 'Mobile',
            fillOpacity: 0.6,
            lineType: 'step' },
    ],
});
```

## Options

- **`data`** — The data array
- **`series`** — Array of series with `id`, `value`, `label`, optional `color`, `fillOpacity`, `lineType`, `lineStyle` (`'solid'` \| `'dashed'` \| `'dotted'` \| custom dash array), `lineWidth`, `markers`
- **`key`** — Key accessor for data points
- **`stacked`** — Stack series on top of each other (default `false`)
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines (default `true`)
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair (default `true`)
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips (default `true`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes
- **`overview`** — `boolean | { size }` — Show the navigator scrub bar beneath the plot; enabling it also turns on category-axis (horizontal) pan/zoom on the plot
