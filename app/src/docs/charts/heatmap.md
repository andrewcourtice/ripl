# Heatmap Chart

The `HeatmapChart` displays data as a matrix of colored cells, with color intensity representing values.

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="randomize">Randomize</button>
        </div>
    </template>
</ripl-example>

<script setup lang="ts">
import { ref } from 'vue';
import { createHeatmapChart } from '@ripl/charts';
import { useRiplChart } from '../../.vitepress/compositions/example';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];

function generateData() {
    const result = [];
    for (const day of DAYS) {
        for (const hour of HOURS) {
            result.push({ day, hour, value: Math.round(Math.random() * 100) });
        }
    }
    return result;
}

const data = ref(generateData());

const { contextChanged } = useRiplChart(context => {
    return createHeatmapChart(context, {
        data: data.value,
        xBy: 'hour',
        yBy: 'day',
        valueBy: 'value',
        xCategories: HOURS,
        yCategories: DAYS,
        padding: { top: 20, right: 20, bottom: 40, left: 20 },
    });
});

function randomize() {
    data.value = generateData();
}
</script>

## Usage

```ts
import { createHeatmapChart } from '@ripl/charts';

const chart = createHeatmapChart('#container', {
    data: [...],
    xBy: 'hour',
    yBy: 'day',
    valueBy: 'value',
    xCategories: ['9am', '10am', '11am'],
    yCategories: ['Mon', 'Tue', 'Wed'],
});
```

## Options

- **`data`** — The data array (one item per cell)
- **`xBy`** — Accessor for the x-axis category
- **`yBy`** — Accessor for the y-axis category
- **`valueBy`** — Accessor for the cell value
- **`xCategories`** — Ordered list of x-axis categories
- **`yCategories`** — Ordered list of y-axis categories
- **`colorRange`** — Tuple of `[lowColor, highColor]` hex strings
- **`borderRadius`** — Cell corner radius (default `2`)
