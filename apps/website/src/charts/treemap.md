# Treemap Chart

The **Treemap Chart** displays hierarchical data as nested rectangles, where each rectangle's area is proportional to its value. It's great for visualizing how a total breaks down into parts, such as market share, disk usage, or budget allocation. Cells are labeled, automatically colored, and animate smoothly on data changes. Configurable gaps and rounded corners keep the layout clean.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Treemap" :extras-reset="reset">
            <RiplField label="Cell gap">
                <RiplInputRange v-model="extras.gap" :min="0" :max="12" :step="1" />
            </RiplField>
            <RiplField label="Corner radius">
                <RiplInputRange v-model="extras.borderRadius" :min="0" :max="12" :step="1" />
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
    useChartExtras,
} from '../.vitepress/compositions/use-chart-config';

import {
    createTreemapChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const CATEGORIES = ['Electronics', 'Clothing', 'Food', 'Books', 'Sports', 'Home', 'Toys', 'Health'];

const { extras, reset } = useChartExtras({
    gap: 3,
    borderRadius: 4,
});

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Revenue by Category',
});

function generateData() {
    return CATEGORIES.map(name => ({
        name,
        value: Math.round(Math.random() * 900 + 100),
    }));
}

let data = generateData();

function buildOptions() {
    return {
        gap: extras.gap,
        borderRadius: extras.borderRadius,
        ...buildCommonOptions(config),
    };
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createTreemapChart(context, {
        data,
        key: 'name',
        value: 'value',
        label: 'name',
        ...buildOptions(),
    });
});

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function randomize() {
    data = generateData();
    chart.value?.update({ data });
}
</script>

## Usage

```ts
import {
    createTreemapChart,
} from '@ripl/charts';

const chart = createTreemapChart('#container', {
    data: [/* ... */],
    key: 'name',
    value: 'value',
    label: 'name',
});
```

## Options

- **`data`**: the data array
- **`key`**: unique key accessor
- **`value`**: value accessor (determines rectangle area)
- **`label`**: label accessor (displayed inside cells)
- **`colorBy`**: optional per-item color accessor
- **`legend`**: legend configuration; shown by default, pass `false` to hide
- **`gap`**: gap between cells in pixels (default `3`)
- **`borderRadius`**: cell corner radius (default `4`)
