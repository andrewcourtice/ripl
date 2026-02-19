# Bar Chart

The `BarChart` supports grouped and stacked modes, vertical and horizontal orientations, with animated transitions, tooltips, and legend.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div layout="row">
            <button class="ripl-button" @click="randomize">Randomize</button>
            <button class="ripl-button" @click="addData">Add Month</button>
            <button class="ripl-button" @click="removeData">Remove Month</button>
            <button class="ripl-button" @click="toggleMode">Toggle Stacked/Grouped</button>
            <button class="ripl-button" @click="toggleOrientation">Toggle Orientation</button>
        </div>
    </template>
</ripl-example>

<script setup lang="ts">
import { ref } from 'vue';
import { createBarChart, BarChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

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
        keyBy: 'month',
        mode: stacked.value ? 'stacked' : 'grouped',
        orientation: horizontal.value ? 'horizontal' : 'vertical',
        padding: { top: 30, right: 20, bottom: 30, left: 20 },
        series: [
            { id: 'sales', valueBy: 'sales', label: 'Sales' },
            { id: 'costs', valueBy: 'costs', label: 'Costs' },
            { id: 'profit', valueBy: 'profit', label: 'Profit' },
            { id: 'returns', valueBy: 'returns', label: 'Returns' },
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
    stacked.value = !stacked.value;
    chart.value?.update({ mode: stacked.value ? 'stacked' : 'grouped' });
}

function toggleOrientation() {
    horizontal.value = !horizontal.value;
    chart.value?.update({ orientation: horizontal.value ? 'horizontal' : 'vertical' });
}
</script>

## Usage

```ts
import { createBarChart } from '@ripl/charts';

const chart = createBarChart('#container', {
    data: [...],
    keyBy: 'quarter',
    mode: 'grouped',        // 'grouped' | 'stacked'
    orientation: 'vertical', // 'vertical' | 'horizontal'
    series: [
        { id: 'sales', valueBy: 'sales', label: 'Sales' },
        { id: 'costs', valueBy: 'costs', label: 'Costs' },
    ],
});
```

## Options

- **`data`** — The data array
- **`series`** — Array of series with `id`, `valueBy`, `label`, and optional `color`
- **`keyBy`** — Key accessor for categories
- **`mode`** — `'grouped'` (default) or `'stacked'`
- **`orientation`** — `'vertical'` (default) or `'horizontal'`
- **`showGrid`** — Show grid lines (default `true`)
- **`showLegend`** — Show legend for multi-series (default `true`)
- **`borderRadius`** — Bar corner radius (default `2`)
