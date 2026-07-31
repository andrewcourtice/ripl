# Heatmap Chart

The **Heatmap Chart** displays data as a matrix of colored cells, where color intensity encodes each cell's value. It's ideal for spotting patterns across two categorical dimensions, such as time-of-day against day-of-week. Cells animate smoothly between values on update, and the color range is configurable via a `[low, high]` color tuple.

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
            <RiplField label="Corner radius" option="borderRadius">
                <RiplInputRange
                    v-model="extras.borderRadius"
                    :min="0"
                    :max="8"
                    :step="1"
                />
            </RiplField>
            <template #colors>
                <RiplField label="Low" option="gradient" inline>
                    <RiplColorInput v-model="extras.lowColor" />
                </RiplField>
                <RiplField label="High" option="gradient" inline>
                    <RiplColorInput v-model="extras.highColor" />
                </RiplField>
            </template>
            <template #labels>
                <RiplField label="Cell labels" option="labels" inline>
                    <RiplSwitch v-model="extras.cellLabels" />
                </RiplField>
            </template>
            <template #legend>
                <RiplField label="Orientation" option="legend">
                    <RiplSelect v-model="extras.legendOrientation">
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                    </RiplSelect>
                </RiplField>
                <RiplField label="Thickness" option="legend">
                    <RiplInputRange
                        v-model="extras.legendThickness"
                        :min="6"
                        :max="24"
                        :step="1"
                    />
                </RiplField>
                <RiplField label="Segments" option="legend">
                    <RiplInputRange
                        v-model="extras.legendSegments"
                        :min="0"
                        :max="12"
                        :step="1"
                    />
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
            result.push({
                day,
                hour,
                value: Math.round(Math.random() * 100),
            });
        }
    }
    return result;
}

let data = generateData();

function buildOptions() {
    return {
        // Cell values centered in each cell; the label color auto-contrasts against the cell color.
        labels: extras.cellLabels,
        gradient: [extras.lowColor, extras.highColor],
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

## Data Format

Each item is one cell, identified by its x and y category and carrying the value that drives its
color. `xCategories` and `yCategories` fix the axis order (and which cells exist), so a missing
combination simply renders no cell:

```ts
const data = [
    {
        day: 'Mon',
        hour: '9am',
        value: 42,
    },
    {
        day: 'Mon',
        hour: '10am',
        value: 71,
    },
    {
        day: 'Tue',
        hour: '9am',
        value: 18,
    },
];

const xCategories = ['9am', '10am', '11am'];
const yCategories = ['Mon', 'Tue', 'Wed'];
```

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createHeatmapChart('#container', {
    data,
    keyX: 'hour',
    keyY: 'day',
    value: 'sessions',
    xCategories: HOURS,
    yCategories: DAYS,
    // Color stops interpolated low→high: two for a simple ramp, or any number of stops —
    // a built-in `COLOR_SCHEME_*` palette works here too.
    gradient: ['#dbeafe', '#1d4ed8'],
    borderRadius: 4,
    labels: true,
    // A color-scale legend, not the per-series legend other charts use.
    legend: {
        orientation: 'horizontal',
        thickness: 12,
        segments: 6,
    },
    tooltip: true,
    axis: {
        x: { title: 'Hour' },
        y: { title: 'Day' },
    },
    format: 'number',
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when a cell is clicked.
chart.on('cellclick', event => console.log(event.data)); // event.data: HeatmapChartCellEvent
// Emitted when the pointer enters a cell.
chart.on('cellenter', event => console.log(event.data)); // event.data: HeatmapChartCellEvent
// Emitted when the pointer leaves a cell.
chart.on('cellleave', event => console.log(event.data)); // event.data: HeatmapChartCellEvent
```
<!-- events:end -->
