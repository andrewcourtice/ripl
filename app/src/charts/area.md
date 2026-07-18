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
            <RiplField label="Mode">
                <RiplSelect v-model="extras.stackMode">
                    <option value="overlaid">Overlaid</option>
                    <option value="stacked">Stacked</option>
                    <option value="percent">100% stacked</option>
                </RiplSelect>
            </RiplField>
            <RiplField v-if="extras.stackMode !== 'percent'" label="Secondary axis" inline>
                <RiplSwitch v-model="extras.secondaryAxis" />
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

// Maps the drawer's three-way mode onto the chart's `stacked` option.
const STACK_MODE_VALUES = {
    overlaid: false,
    stacked: true,
    percent: 'percent',
} as const;

const { extras, reset } = useChartExtras({
    stackMode: 'overlaid' as keyof typeof STACK_MODE_VALUES,
    secondaryAxis: false,
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

// Percent stacking normalizes per axis group, so the secondary-axis binding only applies to the
// other modes (the drawer hides the toggle in percent mode to match).
function secondaryAxisActive() {
    return extras.secondaryAxis && extras.stackMode !== 'percent';
}

// With the secondary axis on, shrink the mobile series an order of magnitude so its units
// genuinely differ from desktop's and the right-hand axis is justified.
function activeData() {
    if (!secondaryAxisActive()) {
        return data;
    }

    return data.map(item => ({
        ...item,
        mobile: Math.round(item.mobile / 10),
    }));
}

function getSeries() {
    const secondary = secondaryAxisActive();

    return seriesMeta.map(s => ({
        id: s.id,
        value: s.id,
        label: s.label,
        fillOpacity: extras.fillOpacity,
        lineType: extras.lineType,
        lineStyle: extras.lineStyle,
        markers: extras.markers,
        color: config.colors[s.id],
        axis: secondary && s.id === 'mobile' ? 1 : undefined,
    }));
}

function buildOptions() {
    const options = {
        data: activeData(),
        stacked: STACK_MODE_VALUES[extras.stackMode],
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // A second `axis.y` entry renders a right-hand y-axis; the mobile series binds to it via its
    // `axis: 1` series option.
    if (secondaryAxisActive()) {
        options.axis = {
            ...options.axis,
            y: [
                options.axis.y,
                {
                    visible: config.axesVisible,
                    title: 'Mobile (sessions)',
                },
            ],
        };
    }

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
        key: 'month',
        padding: { top: 30, right: 20, bottom: 30, left: 20 },
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    data = generateData(data.length);
    chart.value?.update({ data: activeData() });
}

function addPoint() {
    if (data.length < MONTHS.length) {
        data = generateData(data.length + 1);
        chart.value?.update({ data: activeData() });
    }
}

function removePoint() {
    if (data.length > 2) {
        data = generateData(data.length - 1);
        chart.value?.update({ data: activeData() });
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

### 100% stacked

Pass `stacked: 'percent'` to normalize each category to its share of the category total — the value axis is fixed to 0–100% and values default to percentage formatting:

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    stacked: 'percent',
    series: [
        { id: 'desktop',
            value: 'desktop',
            label: 'Desktop' },
        { id: 'mobile',
            value: 'mobile',
            label: 'Mobile' },
    ],
});
```

### Secondary y-axis

Supply a second `axis.y` entry to render a right-hand axis, and bind a series to it with the series `axis` option (an index or the axis `id`). When the chart is stacked, series stack per axis group:

```ts
createAreaChart('#container', {
    data,
    key: 'month',
    series: [
        { id: 'sessions',
            value: 'sessions',
            label: 'Sessions' },
        { id: 'conversion',
            value: 'conversion',
            label: 'Conversion %',
            axis: 1 },
    ],
    axis: {
        y: [
            { title: 'Sessions' },
            { title: 'Conversion %',
                format: 'percentage' },
        ],
    },
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
- **`series`** — Array of series with `id`, `value`, `label`, optional `color`, `fillOpacity`, `lineType`, `lineStyle` (`'solid'` \| `'dashed'` \| `'dotted'` \| custom dash array), `lineWidth`, `markers`, `axis` (y-axis index/id binding)
- **`key`** — Key accessor for data points
- **`stacked`** — `false` (overlaid, default), `true` (stacked), or `'percent'` (100%-stacked with a 0–100% value axis)
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines (default `true`)
- **`crosshair`** — `boolean | ChartCrosshairOptions` — Show/configure crosshair (default `true`)
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips (default `true`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes (`y` accepts an array for multiple y-axes; `x.scale: 'time'` positions date keys continuously)
- **`overview`** — `boolean | { size }` — Show the navigator scrub bar beneath the plot; enabling it also turns on category-axis (horizontal) pan/zoom on the plot
