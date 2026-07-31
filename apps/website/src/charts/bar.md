# Bar Chart

The **Bar Chart** is one of the most versatile chart types in Ripl. It supports grouped and stacked modes, vertical and horizontal orientations, and handles animated entry, exit, and update transitions automatically when data changes. Tooltips on hover, a configurable legend, grid lines, and axis labels are all built in and enabled by default, so you get a polished result with minimal configuration.

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
            <RiplField label="Mode" option="stacked">
                <RiplSelect v-model="extras.stackMode">
                    <option value="grouped">Grouped</option>
                    <option value="stacked">Stacked</option>
                    <option value="percent">100% stacked</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Horizontal" option="orientation" inline>
                <RiplSwitch v-model="extras.horizontal" />
            </RiplField>
            <RiplField label="Corner radius" option="borderRadius">
                <RiplInputRange
                    v-model="extras.borderRadius"
                    :min="0"
                    :max="8"
                    :step="1"
                />
            </RiplField>
            <template #axes>
                <RiplField
                    v-if="multiAxisAvailable"
                    label="Multiple axes"
                    option="yAxis"
                    inline
                >
                    <RiplSwitch v-model="extras.multiAxis" />
                </RiplField>
            </template>
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
    computed,
    ref,
    watch,
} from 'vue';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const seriesMeta = [
    { id: 'sales', label: 'Sales' },
    { id: 'costs', label: 'Costs' },
    { id: 'profit', label: 'Profit' },
    { id: 'returnRate', label: 'Return rate' },
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
    multiAxis: false,
});

// Multiple y-axes apply to vertical grouped bars only: stacked bars share one cumulative scale and
// horizontal bars read categories along the y-axis, so both fall back to the primary axis. The toggle
// is withdrawn rather than left inert, so it never looks broken.
const multiAxisAvailable = computed(() => !extras.horizontal && extras.stackMode === 'grouped');
const multiAxisActive = computed(() => multiAxisAvailable.value && extras.multiAxis);

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
        // A percentage, not dollars: the one series whose units differ, so the "Multiple axes"
        // toggle has something real to separate.
        returnRate: Math.round((Math.random() * 5 + 0.5) * 10) / 10,
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
        // The return-rate series is a percentage; give it its own axis when asked.
        yAxis: multiAxisActive.value && s.id === 'returnRate' ? 'rate' : undefined,
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

    // A second `axis.y` entry renders a right-hand percentage axis for the return-rate series.
    if (multiAxisActive.value) {
        options.axis = {
            ...options.axis,
            y: [
                {
                    ...options.axis.y,
                    id: 'amount',
                },
                {
                    id: 'rate',
                    visible: config.axesVisible,
                    title: 'Return rate (%)',
                    position: 'right',
                },
            ],
        };
    }

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

Pass `stacked: 'percent'` to normalize each category to its share of the category total. The value axis is fixed to 0–100% and values default to percentage formatting:

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

Rotate crowded tick labels with `axis.x.labelRotation` (degrees; positive tilts labels up to the right):

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

Vertical **grouped** bars support any number of y-axes. Supply an array of `axis.y` entries and bind each series to one with its `yAxis` option, naming the axis's `id`; `position: 'right'` axes sit on the right and same-side axes stack outward in array order. Each axis scales independently to the series bound to it:

```ts
createBarChart('#container', {
    data,
    key: 'month',
    series: [
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            yAxis: 'revenue',
        },
        {
            id: 'orders',
            value: 'orders',
            label: 'Orders',
            yAxis: 'orders',
        },
    ],
    axis: {
        y: [
            {
                id: 'revenue',
                title: 'Revenue ($)',
            },
            {
                id: 'orders',
                position: 'right',
                title: 'Orders',
            },
        ],
    },
});
```

> [!NOTE]
> Multiple y-axes apply to vertical grouped bars only. Stacked bars share one cumulative value
> scale, and horizontal bars read categories along the y-axis, so both use the primary axis.

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

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createBarChart('#container', {
    data,
    key: 'month',
    orientation: 'vertical',
    borderRadius: 4,
    labels: true,
    format: 'number',
    // `stacked` is not shown here: stacked and percent bars share one cumulative scale, so they
    // cannot combine with the second axis below. Both are in Variants above.
    series: [
        {
            id: 'revenue',
            value: 'revenue',
            label: 'Revenue',
            color: '#7cacf8',
            yAxis: 'revenue',
        },
        {
            id: 'orders',
            value: 'orders',
            label: 'Orders',
            color: '#6dd5b1',
            yAxis: 'orders',
        },
    ],
    axis: {
        y: [
            {
                id: 'revenue',
                title: 'Revenue ($)',
            },
            {
                id: 'orders',
                position: 'right',
                title: 'Orders',
            },
        ],
    },
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when a bar is clicked.
chart.on('barclick', event => console.log(event.data)); // event.data: BarChartBarEvent
// Emitted when the pointer enters a bar.
chart.on('barenter', event => console.log(event.data)); // event.data: BarChartBarEvent
// Emitted when the pointer leaves a bar.
chart.on('barleave', event => console.log(event.data)); // event.data: BarChartBarEvent
```
<!-- events:end -->
