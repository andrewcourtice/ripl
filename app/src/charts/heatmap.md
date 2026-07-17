# Heatmap Chart

The **Heatmap Chart** displays data as a matrix of colored cells, where color intensity encodes each cell's value. It's ideal for spotting patterns across two categorical dimensions — time-of-day vs day-of-week, for example. Cells animate smoothly between values on update, and the color range is configurable via a `[low, high]` color tuple.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Colour scale">
            <RiplField label="Low colour" inline>
                <RiplColorInput v-model="lowColor" />
            </RiplField>
            <RiplField label="High colour" inline>
                <RiplColorInput v-model="highColor" />
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
    useChartConfig,
} from '../.vitepress/compositions/use-chart-config';

import {
    createHeatmapChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];

const lowColor = ref('#e0f2fe');
const highColor = ref('#0369a1');

const config = useChartConfig({
    features: { title: true, animation: true },
    title: 'Activity by Hour',
});

function generateData() {
    const result = [];
    for (const day of DAYS) {
        for (const hour of HOURS) {
            result.push({ day, hour, value: Math.round(Math.random() * 100) });
        }
    }
    return result;
}

let data = generateData();

const { contextChanged, chart } = useRiplChart(context => {
    return createHeatmapChart(context, {
        data,
        keyX: 'hour',
        keyY: 'day',
        value: 'value',
        xCategories: HOURS,
        yCategories: DAYS,
        colors: [lowColor.value, highColor.value],
        padding: { top: 20, right: 20, bottom: 40, left: 20 },
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({
        colors: [lowColor.value, highColor.value],
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });
watch([lowColor, highColor], apply);

function randomize() {
    data = generateData();
    chart.value?.update({ data });
}
</script>

## Usage

```ts
import {
    createHeatmapChart,
} from '@ripl/charts';

const chart = createHeatmapChart('#container', {
    data: [/* ... */],
    keyX: 'hour',
    keyY: 'day',
    value: 'value',
    xCategories: ['9am', '10am', '11am'],
    yCategories: ['Mon', 'Tue', 'Wed'],
});
```

## Options

- **`data`** — The data array (one item per cell)
- **`keyX`** — Accessor for the x-axis category
- **`keyY`** — Accessor for the y-axis category
- **`value`** — Accessor for the cell value
- **`xCategories`** — Ordered list of x-axis categories
- **`yCategories`** — Ordered list of y-axis categories
- **`colors`** — Tuple of `[lowColor, highColor]` hex strings
- **`borderRadius`** — Cell corner radius (default `2`)
