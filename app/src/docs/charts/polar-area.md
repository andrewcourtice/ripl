# Polar Area Chart

The **Polar Area Chart** renders equal-angle segments whose radius encodes the value, making it easy to compare magnitudes across categories. Unlike a pie chart (where angle encodes value), all slices share the same angle — only the radius varies. The chart includes animated axis rings, radial lines, labels that enter on first render and transition smoothly on data updates, and an optional legend (shown by default).

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="removeData">Remove Data</RiplButton>
            <RiplButton @click="randomize">Randomize</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Polar Area">
            <RiplField label="Labels">
                <RiplSelect v-model="labels">
                    <option value="off">Off</option>
                    <option value="inside">Inside</option>
                    <option value="outside">Outside</option>
                </RiplSelect>
            </RiplField>
        </RiplChartConfig>
    </template>
</ripl-example>

<script lang="ts" setup>
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    buildCommonOptions,
    useChartConfig,
} from '../../.vitepress/compositions/use-chart-config';

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

const labels = ref<'off' | 'inside' | 'outside'>('off');

function labelsOption() {
    return labels.value === 'off' ? false : labels.value;
}

const config = useChartConfig({
    features: { title: true, legend: true, animation: true },
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

const {
    contextChanged,
    chart,
} = useRiplChart(context => createPolarAreaChart(context, {
    key: 'id',
    value: 'value',
    label: 'label',
    data,
    labels: labelsOption(),
    ...buildCommonOptions(config),
}));

function update() {
    chart.value?.update({ data });
}

function apply() {
    chart.value?.update({
        labels: labelsOption(),
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });
watch(labels, apply);

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
        { id: '1',
            label: 'Speed',
            value: 72 },
        { id: '2',
            label: 'Strength',
            value: 45 },
        { id: '3',
            label: 'Defense',
            value: 88 },
        { id: '4',
            label: 'Magic',
            value: 63 },
        { id: '5',
            label: 'Luck',
            value: 31 },
        { id: '6',
            label: 'Agility',
            value: 55 },
    ],
});
```

## Data Format

Each item needs a unique key, a numeric value (encoded as the segment's radius), and a label:

```ts
const data = [
    { id: 'speed',
        label: 'Speed',
        value: 72 },
    { id: 'strength',
        label: 'Strength',
        value: 45 },
    { id: 'defense',
        label: 'Defense',
        value: 88 },
];
```

Every segment spans the same angle — only the radius varies with `value`.

## Options

- **`data`** — The data array
- **`key`** — Key accessor for each segment (a field name or a function)
- **`value`** — Numeric value accessor; encoded as the segment radius
- **`label`** — Label accessor for each segment
- **`color`** — Optional per-segment color accessor (otherwise a palette color is assigned)
- **`innerRadiusRatio`** — Inner radius as a ratio of the chart size (`0`–`1`, default `0.15`)
- **`maxRadiusRatio`** — Maximum outer radius as a ratio of the chart size (`0`–`0.5`, default `0.45`)
- **`padAngle`** — Padding angle between segments in radians (default `0.02`)
- **`levels`** — Number of concentric grid rings (default `4`)
- **`labels`** — `false` (default) \| `true` (inside) \| `'outside'` (leader-line) \| a full options object
- **`legend`** — `boolean | ChartLegendOptions` — Segment legend (shown by default for multiple segments)
- **`format`** — Value formatter for tooltips/labels (`'number'`, `'percentage'`, or a function)
- **`padding`** — Chart padding
- **`title`** — `string | ChartTitleOptions` — Chart title
- **`animation`** — `boolean | ChartAnimationOptions` — Enable/configure entry/update animations
