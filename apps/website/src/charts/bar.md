# Bar Chart

The **Bar Chart** is one of the most versatile chart types in Ripl. It supports grouped and stacked modes, vertical and horizontal orientations, and handles animated entry, exit, and update transitions automatically when data changes. Built-in features include tooltips on hover, a configurable legend, grid lines, and axis labels — all enabled by default so you get a polished result with minimal configuration.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addData">Add Month</RiplButton>
            <RiplButton @click="removeData">Remove Month</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" :series="seriesMeta" extra-title="Bars" :extras-reset="reset">
            <RiplField label="Mode">
                <RiplSelect v-model="extras.stackMode">
                    <option value="grouped">Grouped</option>
                    <option value="stacked">Stacked</option>
                    <option value="percent">100% stacked</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Horizontal" inline>
                <RiplSwitch v-model="extras.horizontal" />
            </RiplField>
            <RiplField label="Corner radius">
                <RiplInputRange v-model="extras.borderRadius" :min="0" :max="8" :step="1" />
            </RiplField>
            <RiplField label="X label rotation">
                <RiplInputRange v-model="extras.labelRotation" :min="0" :max="60" :step="15" />
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
    createBarChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const seriesMeta = [
    { id: 'sales', label: 'Sales' },
    { id: 'costs', label: 'Costs' },
    { id: 'profit', label: 'Profit' },
    { id: 'returns', label: 'Returns' },
];

let monthCount = 6;

// Maps the drawer's three-way mode onto the chart's `stacked` option.
const STACK_MODE_VALUES = {
    grouped: false,
    stacked: true,
    percent: 'percent',
} as const;

const { extras, reset } = useChartExtras({
    stackMode: 'grouped' as keyof typeof STACK_MODE_VALUES,
    horizontal: false,
    borderRadius: 2,
    labelRotation: 0,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        axes: true,
        grid: true,
        tooltip: true,
        dataLabels: true,
        format: true,
        animation: true,
        theme: true,
        navigator: true,
        annotations: true,
    },
    title: 'Monthly Breakdown',
    axisX: 'Month',
    axisY: 'Amount ($)',
    colors: seedColors(seriesMeta.map(s => s.id)),
});

function generateItem(month: string) {
    return {
        month,
        sales: Math.round(Math.random() * 500 + 100),
        costs: Math.round(Math.random() * 300 + 50),
        profit: Math.round(Math.random() * 400 - 200),
        returns: Math.round(Math.random() * 100 + 10),
    };
}

function generateData() {
    return MONTHS.slice(0, monthCount).map(m => generateItem(m));
}

let data = generateData();

function getSeries() {
    return seriesMeta.map(s => ({
        id: s.id,
        value: s.id,
        label: s.label,
        color: config.colors[s.id],
    }));
}

function buildOptions() {
    const options = {
        stacked: STACK_MODE_VALUES[extras.stackMode],
        orientation: extras.horizontal ? 'horizontal' : 'vertical',
        borderRadius: extras.borderRadius,
        series: getSeries(),
        ...buildCommonOptions(config),
    };

    // Tick label rotation (degrees, counterclockwise-positive) applies to the x-axis; the label
    // band grows to fit and fewer labels are dropped on overflow.
    options.axis = {
        ...options.axis,
        x: {
            ...options.axis.x,
            labelRotation: extras.labelRotation || undefined,
        },
    };

    options.annotations = config.annotationsVisible
        ? [
            {
                axis: 'y',
                value: 500,
                label: 'Target',
            },
        ]
        : [];

    return options;
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createBarChart(context, {
        data,
        key: 'month',
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    data = generateData();
    chart.value?.update({ data });
}

function addData() {
    if (monthCount < MONTHS.length) {
        monthCount++;
        data = generateData();
        chart.value?.update({ data });
    }
}

function removeData() {
    if (monthCount > 2) {
        monthCount--;
        data = generateData();
        chart.value?.update({ data });
    }
}
</script>

## Usage

```ts
import {
    createBarChart,
} from '@ripl/charts';

const chart = createBarChart('#container', {
    data: [/* ... */],
    key: 'quarter',
    stacked: false,          // set true to stack series
    orientation: 'vertical', // 'vertical' | 'horizontal'
    series: [
        { id: 'sales', value: 'sales', label: 'Sales' },
        { id: 'costs', value: 'costs', label: 'Costs' },
    ],
});
```

## Data Format

Each item in the `data` array should contain a category key and one or more numeric fields for series values:

```ts
const data = [
    {
        month: 'Jan',
        sales: 420,
        costs: 280,
    },
    {
        month: 'Feb',
        sales: 380,
        costs: 310,
    },
    {
        month: 'Mar',
        sales: 510,
        costs: 250,
    },
];
```

The `key` option identifies the category field (`'month'`), and each series maps to a numeric field via its `value` property.

## Variants

### Grouped (default)

Bars for each series sit side-by-side within each category:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    stacked: false,
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
        {
            id: 'costs',
            value: 'costs',
            label: 'Costs',
        },
    ],
});
```

### Stacked

Bars stack on top of each other, showing cumulative totals:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    stacked: true,
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
        {
            id: 'costs',
            value: 'costs',
            label: 'Costs',
        },
    ],
});
```

### 100% stacked

Pass `stacked: 'percent'` to normalize each category to its share of the category total — the value axis is fixed to 0–100% and values default to percentage formatting:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    stacked: 'percent',
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
        {
            id: 'costs',
            value: 'costs',
            label: 'Costs',
        },
    ],
});
```

### Rotated x labels

Rotate crowded tick labels with `axis.x.labelRotation` (degrees — positive tilts labels up to the right):

```ts
createBarChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
    ],
    axis: {
        x: { labelRotation: 45 },
    },
});
```

### Multiple y-axes

Vertical **grouped** bars support any number of y-axes. Supply an array of `axis.y` entries and bind each series to one with its `axis` option (an array index or the axis `id`); `position: 'right'` axes sit on the right and same-side axes stack outward in array order. Each axis scales independently to the series bound to it:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            axis: 0,
        },
        {
            id: 'orders',
            value: 'orders',
            label: 'Orders',
            axis: 1,
        },
    ],
    axis: {
        y: [
            { title: 'Revenue ($)' },
            { position: 'right', title: 'Orders' },
        ],
    },
});
```

> [!NOTE]
> Multiple y-axes apply to vertical grouped bars only. Stacked bars share one cumulative value
> scale, and horizontal bars read categories along the y-axis — both use the primary axis.

### Horizontal

Swap axes so bars extend horizontally:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    orientation: 'horizontal',
    series: [
        {
            id: 'sales',
            value: 'sales',
            label: 'Sales',
        },
    ],
});
```

## Options

- **`data`** — The data array
- **`series`** — Array of series with `id`, `value`, `label`, and optional `color`
- **`key`** — Key accessor for categories
- **`stacked`** — `false` (grouped, default), `true` (stacked), or `'percent'` (100%-stacked with a 0–100% value axis)
- **`orientation`** — `'vertical'` (default) or `'horizontal'`
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines (default `true`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips (default `true`)
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes (`x.labelRotation` rotates tick labels by the given degrees; `y` accepts an array for multiple y-axes on vertical grouped bars)
- **`overview`** — `boolean | { size }` — Show the navigator scrub bar (beneath the plot for vertical bars, alongside it for horizontal bars); enabling it also turns on category-axis pan/zoom on the plot
- **`borderRadius`** — Bar corner radius (default `2`)
