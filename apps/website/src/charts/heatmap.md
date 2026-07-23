# Heatmap Chart

The **Heatmap Chart** displays data as a matrix of colored cells, where color intensity encodes each cell's value. It's ideal for spotting patterns across two categorical dimensions — time-of-day vs day-of-week, for example. Cells animate smoothly between values on update, and the color range is configurable via a `[low, high]` color tuple.

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
        <RiplChartConfig :config="config" extra-title="Heatmap" :extras-reset="reset">
            <RiplField label="Cell labels" inline>
                <RiplSwitch v-model="extras.cellLabels" />
            </RiplField>
            <RiplField label="Low color" inline>
                <RiplColorInput v-model="extras.lowColor" />
            </RiplField>
            <RiplField label="High color" inline>
                <RiplColorInput v-model="extras.highColor" />
            </RiplField>
            <RiplField label="Corner radius">
                <RiplInputRange v-model="extras.borderRadius" :min="0" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Legend orientation">
                <RiplSelect v-model="extras.legendOrientation">
                    <option value="horizontal">Horizontal</option>
                    <option value="vertical">Vertical</option>
                </RiplSelect>
            </RiplField>
            <RiplField label="Legend thickness">
                <RiplInputRange v-model="extras.legendThickness" :min="6" :max="24" :step="1" />
            </RiplField>
            <RiplField label="Legend segments">
                <RiplInputRange v-model="extras.legendSegments" :min="0" :max="12" :step="1" />
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
    createHeatmapChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOURS = ['9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm'];

const { extras, reset } = useChartExtras({
    cellLabels: false,
    lowColor: '#e0f2fe',
    highColor: '#0369a1',
    borderRadius: 2,
    legendOrientation: 'horizontal' as 'horizontal' | 'vertical',
    legendThickness: 12,
    legendSegments: 12,
});

const config = useChartConfig({
    features: {
        title: true,
        tooltip: true,
        format: true,
        animation: true,
        theme: true,
    },
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

function buildOptions() {
    return {
        // Cell values centered in each cell; the label color auto-contrasts against the cell color.
        labels: extras.cellLabels,
        colors: [extras.lowColor, extras.highColor],
        borderRadius: extras.borderRadius,
        legend: {
            orientation: extras.legendOrientation,
            thickness: extras.legendThickness,
            segments: extras.legendSegments,
        },
        ...buildCommonOptions(config),
    };
}

const example = ref();

const { contextChanged, chart } = useRiplChart(context => {
    return createHeatmapChart(context, {
        data,
        keyX: 'hour',
        keyY: 'day',
        value: 'value',
        xCategories: HOURS,
        yCategories: DAYS,
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
- **`labels`** — Show each cell's value centered in the cell (default `false`); the label color auto-contrasts against the cell color
