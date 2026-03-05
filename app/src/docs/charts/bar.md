# Bar Chart

The `BarChart` supports grouped and stacked modes, vertical and horizontal orientations, with animated transitions, tooltips, and legend.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addData">Add Month</RiplButton>
            <RiplButton @click="removeData">Remove Month</RiplButton>
            <RiplSwitch v-model="stacked" @update:model-value="toggleMode" label="Stacked" />
            <RiplSwitch v-model="horizontal" @update:model-value="toggleOrientation" label="Horizontal" />
        </RiplControlGroup>
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    BarChart,
    createBarChart,
} from '@ripl/charts';

import {
    ref,
} from 'vue';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const stacked = ref(false);
const horizontal = ref(false);
let monthCount = 6;

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

const { contextChanged, chart } = useRiplChart(context => {
    return createBarChart(context, {
        data,
        key: 'month',
        mode: stacked.value ? 'stacked' : 'grouped',
        orientation: horizontal.value ? 'horizontal' : 'vertical',
        padding: { top: 30, right: 20, bottom: 30, left: 20 },
        series: [
            { id: 'sales', value: 'sales', label: 'Sales' },
            { id: 'costs', value: 'costs', label: 'Costs' },
            { id: 'profit', value: 'profit', label: 'Profit' },
            { id: 'returns', value: 'returns', label: 'Returns' },
        ],
    });
});

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

function toggleMode() {
    chart.value?.update({ mode: stacked.value ? 'stacked' : 'grouped' });
}

function toggleOrientation() {
    chart.value?.update({ orientation: horizontal.value ? 'horizontal' : 'vertical' });
}
</script>

## Usage

```ts
import {
    createBarChart,
} from '@ripl/charts';

const chart = createBarChart('#container', {
    data: [...],
    key: 'quarter',
    mode: 'grouped',        // 'grouped' | 'stacked'
    orientation: 'vertical', // 'vertical' | 'horizontal'
    series: [
        { id: 'sales', value: 'sales', label: 'Sales' },
        { id: 'costs', value: 'costs', label: 'Costs' },
    ],
});
```

## Options

- **`data`** — The data array
- **`series`** — Array of series with `id`, `value`, `label`, and optional `color`
- **`key`** — Key accessor for categories
- **`mode`** — `'grouped'` (default) or `'stacked'`
- **`orientation`** — `'vertical'` (default) or `'horizontal'`
- **`grid`** — `boolean | ChartGridOptions` — Show/configure grid lines (default `true`)
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend
- **`tooltip`** — `boolean | ChartTooltipOptions` — Show/configure tooltips (default `true`)
- **`axis`** — `boolean | ChartAxisOptions` — Configure x/y axes
- **`borderRadius`** — Bar corner radius (default `2`)
