# Area Chart

The `AreaChart` renders filled areas beneath lines, supporting stacked mode, crosshair, grid, and smooth animations.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="randomize">Randomize</button>
            <label class="ripl-switch">
                <input type="checkbox" v-model="stacked" @change="toggleStacked">
                <span class="ripl-switch__track"><span class="ripl-switch__thumb"></span></span>
                Stacked
            </label>
        </div>
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
