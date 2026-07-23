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
            <RiplField label="Inner radius">
                <RiplInputRange v-model="extras.innerRadius" :min="0" :max="0.4" :step="0.05" />
            </RiplField>
            <RiplField label="Max radius">
                <RiplInputRange v-model="extras.maxRadiusRatio" :min="0.2" :max="0.5" :step="0.05" />
            </RiplField>
            <RiplField label="Segment gap">
                <RiplInputRange v-model="extras.padAngle" :min="0" :max="0.1" :step="0.01" />
            </RiplField>
            <RiplField label="Grid rings">
                <RiplInputRange v-model="extras.levels" :min="2" :max="8" :step="1" />
            </RiplField>
            <RiplField label="Labels">
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

```typescript
const chart = createPolarAreaChart(context, {
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

- **`data`**: the data array
- **`key`**: key accessor for each segment (a field name or a function)
- **`value`**: numeric value accessor; encoded as the segment radius
- **`label`**: label accessor for each segment
- **`colorBy`**: optional per-segment color accessor (otherwise a palette color is assigned)
- **`innerRadius`**: inner radius as a fraction of the chart size (`0`–`1`, default `0.15`)
- **`maxRadiusRatio`**: maximum outer radius as a ratio of the chart size (`0`–`0.5`, default `0.45`)
- **`padAngle`**: padding angle between segments in radians (default `0.02`)
- **`levels`**: number of concentric grid rings (default `4`)
- **`labels`**: `false` (default) \| `true` (inside) \| `'outside'` (leader-line) \| a full options object
- **`legend`** (`boolean | ChartLegendOptions`): segment legend (shown by default for multiple segments)
- **`format`**: value formatter for tooltips/labels (`'number'`, `'percentage'`, or a function)
- **`padding`**: chart padding
- **`title`** (`string | ChartTitleOptions`): chart title
- **`animation`** (`boolean | ChartAnimationOptions`): enable/configure entry/update animations
