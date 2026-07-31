# Polar Area Chart

The **Polar Area Chart** renders equal-angle segments whose radius encodes the value, making it easy to compare magnitudes across categories. Unlike a pie chart (where angle encodes value), all slices share the same angle; only the radius varies. The chart includes animated axis rings, radial lines, labels that enter on first render and transition smoothly on data updates, and an optional legend (shown by default).

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
        <RiplChartConfig :config="config" extra-title="Polar Area" :extras-reset="reset">
            <RiplField label="Inner radius" option="innerRadius">
                <RiplInputRange v-model="extras.innerRadius" :min="0" :max="0.4" :step="0.05" />
            </RiplField>
            <RiplField label="Max radius" option="maxRadiusRatio">
                <RiplInputRange v-model="extras.maxRadiusRatio" :min="0.2" :max="0.5" :step="0.05" />
            </RiplField>
            <RiplField label="Segment gap" option="padAngle">
                <RiplInputRange v-model="extras.padAngle" :min="0" :max="0.1" :step="0.01" />
            </RiplField>
            <RiplField label="Grid rings" option="levels">
                <RiplInputRange v-model="extras.levels" :min="2" :max="8" :step="1" />
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
    createPolarAreaChart,
} from '@ripl/charts';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    ref,
    watch,
} from 'vue';

const LABELS = ['Speed', 'Strength', 'Defense', 'Magic', 'Luck', 'Agility', 'Stamina', 'Wisdom'];

const { extras, reset } = useChartExtras({
    innerRadius: 0.15,
    maxRadiusRatio: 0.45,
    padAngle: 0.02,
    levels: 4,
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
    title: 'Attribute Spread',
});

function getDataValue() {
    return Math.round(Math.random() * 100);
}

function getDataItem(label: string = LABELS[Math.floor(Math.random() * LABELS.length)]) {
    return {
        id: stringUniqueId(),
        label,
        value: getDataValue(),
    };
}

let data = LABELS.slice(0, 6).map(label => getDataItem(label));

function buildOptions() {
    return {
        innerRadius: extras.innerRadius,
        maxRadiusRatio: extras.maxRadiusRatio,
        padAngle: extras.padAngle,
        levels: extras.levels,
        labels: labelsOption(),
        ...buildCommonOptions(config),
    };
}

const example = ref();

const {
    contextChanged,
    chart,
} = useRiplChart(context => createPolarAreaChart(context, {
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

function addData() {
    const unusedLabels = LABELS.filter(l => !data.some(d => d.label === l));
    const label = unusedLabels.length > 0
        ? unusedLabels[Math.floor(Math.random() * unusedLabels.length)]
        : `Stat ${data.length + 1}`;

    data = [...data, getDataItem(label)];
    update();
}

function removeData() {
    if (data.length > 2) {
        const index = Math.floor(Math.random() * data.length);
        data = data.filter((_, i) => i !== index);
        update();
    }
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
    createPolarAreaChart,
} from '@ripl/charts';

const chart = createPolarAreaChart('#container', {
    key: 'id',
    value: 'value',
    label: 'label',
    data: [
        {
            id: '1',
            label: 'Speed',
            value: 72,
        },
        {
            id: '2',
            label: 'Strength',
            value: 45,
        },
        {
            id: '3',
            label: 'Defense',
            value: 88,
        },
        {
            id: '4',
            label: 'Magic',
            value: 63,
        },
        {
            id: '5',
            label: 'Luck',
            value: 31,
        },
        {
            id: '6',
            label: 'Agility',
            value: 55,
        },
    ],
});
```

## Data Format

Each item needs a unique key, a numeric value (encoded as the segment's radius), and a label:

```ts
const data = [
    {
        id: 'speed',
        label: 'Speed',
        value: 72,
    },
    {
        id: 'strength',
        label: 'Strength',
        value: 45,
    },
    {
        id: 'defense',
        label: 'Defense',
        value: 88,
    },
];
```

Every segment spans the same angle, and only the radius varies with `value`.

## Options

A full configuration for this chart. The options every chart shares — `padding`, `title`,
`animation`, `theme` and the rest — behave the same everywhere and are documented on
[Shared Options](/charts/shared-options).

<!-- eslint-skip -->
```ts
createPolarAreaChart('#container', {
    data,
    key: 'month',
    value: 'rainfall',
    label: 'month',
    colorBy: 'season',
    // Hole in the middle, as a fraction of the chart size (0–1).
    innerRadius: 0.15,
    // How far the longest segment reaches, as a fraction of the chart size. 0.5 touches the
    // edge, so this is the outer bound (0–0.5).
    maxRadiusRatio: 0.45,
    // Gap between adjacent segments, in radians.
    padAngle: 0.02,
    // Concentric grid rings.
    levels: 4,
    labels: 'outside',
    legend: { position: 'right' },
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
// Emitted when a segment is clicked.
chart.on('segmentclick', event => console.log(event.data)); // event.data: PolarAreaChartSegmentEvent
// Emitted when the pointer enters a segment.
chart.on('segmententer', event => console.log(event.data)); // event.data: PolarAreaChartSegmentEvent
// Emitted when the pointer leaves a segment.
chart.on('segmentleave', event => console.log(event.data)); // event.data: PolarAreaChartSegmentEvent
```
<!-- events:end -->
