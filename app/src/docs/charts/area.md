# Area Chart

The `AreaChart` renders filled areas beneath lines, supporting stacked mode, crosshair, grid, and smooth animations.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div layout="row">
            <button class="ripl-button" @click="randomize">Randomize</button>
            <button class="ripl-button" @click="toggleStacked">Toggle Stacked</button>
        </div>
    </template>
</ripl-example>

<script setup lang="ts">
import { ref } from 'vue';
import { createAreaChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

const stacked = ref(false);

function generateData() {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(month => ({
        month,
        desktop: Math.round(Math.random() * 600 + 200),
        mobile: Math.round(Math.random() * 400 + 100),
    }));
}

const data = ref(generateData());

const { contextChanged } = useRiplChart(context => {
    return createAreaChart(context, {
        data: data.value,
        keyBy: 'month',
        stacked: stacked.value,
        padding: { top: 20, right: 20, bottom: 30, left: 20 },
        series: [
            { id: 'desktop', valueBy: 'desktop', label: 'Desktop', opacity: 0.3 },
            { id: 'mobile', valueBy: 'mobile', label: 'Mobile', opacity: 0.3 },
        ],
    });
});

function randomize() {
    data.value = generateData();
}

function toggleStacked() {
    stacked.value = !stacked.value;
    data.value = [...data.value];
}
</script>

## Usage

```ts
import { createAreaChart } from '@ripl/charts';

const chart = createAreaChart('#container', {
    data: [...],
    keyBy: 'month',
    stacked: false,
    series: [
        { id: 'desktop', valueBy: 'desktop', label: 'Desktop' },
        { id: 'mobile', valueBy: 'mobile', label: 'Mobile' },
    ],
});
```

## Options

- **`data`** — The data array
- **`series`** — Array of series with `id`, `valueBy`, `label`, optional `color`, `opacity`, `lineType`
- **`keyBy`** — Key accessor for data points
- **`stacked`** — Stack series on top of each other (default `false`)
- **`showGrid`** — Show horizontal grid lines (default `true`)
- **`showCrosshair`** — Show vertical crosshair on hover (default `true`)
