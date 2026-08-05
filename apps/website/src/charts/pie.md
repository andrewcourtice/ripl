# Pie Chart

The **Pie Chart** illustrates numerical proportions as angular slices of a circle. It supports animated entry, exit, and reorder transitions when data changes, and can switch to a donut layout by setting an `innerRadius`. Slices are filled with a translucent tint of their series color and separated by a constant-width gap (`padWidth`) that holds its width right to the center. Hover any slice to see a tooltip and dim the rest, and adjust the inner radius in the demo below.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example ref="example" @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="removeData">Remove Data</RiplButton>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Pie" :extras-reset="reset">
            <RiplField label="Inner radius" option="innerRadius">
                <RiplInputRange v-model="extras.innerRadius" :min="0" :max="0.9" :step="0.05" />
            </RiplField>
            <RiplField label="Segment gap" option="padWidth">
                <RiplInputRange v-model="extras.padWidth" :min="0" :max="10" :step="1" />
            </RiplField>
            <RiplField label="Labels" option="labels">
                <RiplSelect v-model="extras.labels">
                    <option value="off">Off</option>
                    <option value="inside">Inside</option>
                    <option value="outside">Outside</option>
                </RiplSelect>
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
    createPieChart,
} from '@ripl/charts';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    ref,
    watch,
} from 'vue';

const COUNTRIES = [
    'Australia', 'Poland', 'South Africa', 'New Zealand',
    'United States', 'Sweden', 'Great Britain', 'Brazil',
    'France', 'Switzerland',
];

const { extras, reset } = useChartExtras({
    innerRadius: 0,
    padWidth: 2,
    labels: 'off' as 'off' | 'inside' | 'outside',
});

function labelsOption() {
    return extras.labels === 'off' ? false : extras.labels;
}

const config = useChartConfig({
    features: {
        title: true,
        legend: true,
        format: true,
        animation: true,
        theme: true,
    },
    title: 'Sales by Country',
});

function getDataValue() {
    return Math.round(Math.random() * 500);
}

function getDataItem(label: string = stringUniqueId()) {
    return {
        label,
        id: stringUniqueId(),
        value: getDataValue(),
    };
}

let data = COUNTRIES.map(label => getDataItem(label));

function buildOptions() {
    return {
        innerRadius: extras.innerRadius,
        padWidth: extras.padWidth,
        labels: labelsOption(),
        ...buildCommonOptions(config),
    };
}

const example = ref();

const {
    contextChanged,
    chart,
} = useRiplChart(context => createPieChart(context, {
    key: 'id',
    value: 'value',
    label: 'label',
    data,
    ...buildOptions(),
}));

watch([config, extras], () => chart.value?.update(buildOptions()), { deep: true });


function update() {
    chart.value?.update({ data });
}

function editData(body: (index: number) => void) {
    const index = Math.floor(Math.random() * data.length);
    body(index);
    update();
}

function addData() {
    editData(index => data.splice(index, 0, getDataItem()));
}

function removeData() {
    editData(index => data.splice(index, 1));
}

function randomize() {
    data = data.map(item => ({
        ...item,
        value: getDataValue(),
    }));

    update();
}
</script>

## Usage

```ts
import {
    createPieChart,
} from '@ripl/charts';

const chart = createPieChart('#container', {
    key: 'id',
    value: 'value',
    label: 'label',
    data: [
        {
            id: '1',
            label: 'Australia',
            value: 55,
        },
        {
            id: '2',
            label: 'Poland',
            value: 21,
        },
        {
            id: '3',
            label: 'South Africa',
            value: 185,
        },
    ],
});
```

## Data Format

Each item needs a unique `key`, a numeric `value`, and a display `label`:

```ts
const data = [
    {
        id: 'au',
        label: 'Australia',
        value: 55,
    },
    {
        id: 'pl',
        label: 'Poland',
        value: 21,
    },
    {
        id: 'za',
        label: 'South Africa',
        value: 185,
    },
];
```

The `key`, `value`, and `label` options map to fields in each data item.

## Variants

### Donut

Set `innerRadius` (0–1, as a fraction of the outer radius) to create a donut chart:

```ts
createPieChart('#container', {
    data,
    key: 'id',
    value: 'value',
    label: 'label',
    innerRadius: 0.5,
});
```

### Per-slice colors

Drive slice colors from the data instead of the palette:

```ts
createPieChart('#container', {
    data,
    key: 'id',
    value: 'value',
    label: 'label',
    colorBy: 'color',
});
```

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createPieChart('#container', {
    data,
    key: 'browser',
    value: 'share',
    label: 'browser',
    colorBy: 'browser',
    // Non-zero turns the pie into a donut. A value of 1 or less is a fraction of the outer
    // radius; anything larger is read as absolute pixels.
    innerRadius: 60,
    // Segments are separated by a gap of this constant width, in pixels.
    padWidth: 2,
    labels: 'outside',
    legend: { position: 'right' },
    format: 'percentage',
});
```

## Events

Subscribe with `chart.on(...)`. A handler receives an `Event` object, not the payload directly — the
payload is on `event.data`, and carries the interacted datum plus its `{ x, y }` anchor in chart
pixels. `event.target` and `event.stopPropagation()` are also available.

<!-- events:start -->
<!-- eslint-skip -->
```ts
// Emitted when a segment is clicked.
chart.on('segmentclick', event => console.log(event.data)); // event.data: PieChartSegmentEvent
// Emitted when the pointer enters a segment.
chart.on('segmententer', event => console.log(event.data)); // event.data: PieChartSegmentEvent
// Emitted when the pointer leaves a segment.
chart.on('segmentleave', event => console.log(event.data)); // event.data: PieChartSegmentEvent
```
<!-- events:end -->
