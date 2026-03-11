# Area Chart

The **Area Chart** renders filled areas beneath lines, making it easy to compare cumulative totals or show how individual series contribute to a whole. It supports stacked mode (areas stacked on top of each other), per-series opacity and line interpolation, and includes crosshair, grid, tooltips, and a legend. Area and line elements animate smoothly from the baseline on entry and transition between data states on update.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/charts/charts).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplSwitch v-model="stacked" @update:model-value="toggleStacked" label="Stacked" />
        </RiplControlGroup>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    createAreaChart,
} from '@ripl/charts';

import {
    ref,
} from 'vue';

const stacked = ref(false);

function generateData() {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
        month,
        desktop: Math.round(Math.random() * 600 + 200),
        mobile: Math.round(Math.random() * 600 - 200),
    }));
}

const data = ref(generateData());

const { contextChanged } = useRiplChart(context => {
    return createAreaChart(context, {
        data: data.value,
        key: 'month',
        stacked: stacked.value,
        padding: { top: 20, right: 20, bottom: 30, left: 20 },
        series: [
            { id: 'desktop', value: 'desktop', label: 'Desktop', opacity: 0.3 },
            { id: 'mobile', value: 'mobile', label: 'Mobile', opacity: 0.3 },
        ],
    });
});

function randomize() {
    data.value = generateData();
}

function toggleStacked() {
    data.value = [...data.value];
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
