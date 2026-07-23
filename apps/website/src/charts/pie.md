# Pie Chart

The **Pie Chart** illustrates numerical proportions as angular slices of a circle. It supports animated entry, exit, and reorder transitions when data changes, and can switch to a donut layout by setting an `innerRadius`. Hover any slice to see a tooltip, and adjust the inner radius in the demo below.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

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
            <RiplField label="Inner radius">
                <RiplInputRange v-model="extras.innerRadius" :min="0" :max="0.9" :step="0.05" />
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

### Custom start angle

Rotate the starting position of the first slice:

```ts
createPieChart('#container', {
    data,
    key: 'id',
    value: 'value',
    label: 'label',
    startAngle: Math.PI,
});
```

## Options

- **`data`** — The data array
- **`key`** — Unique identifier field for each slice
- **`value`** — Numeric value field
- **`label`** — Display label field
- **`innerRadius`** — Inner radius ratio for donut mode (0–1, default `0`)
- **`labels`** — `boolean | 'inside' | 'outside' | ChartSegmentLabelsOptions` — Segment labels. Hidden by default (the legend is shown by default). `true` / `'inside'` draws labels inside each slice; `'outside'` places them beyond the arc with a leader line; an object customizes `position` / `font` / `fontColor`.
- **`format`** — `'number' | 'percentage' | 'date' | 'string' | ((value) => string)` — Formats segment values shown as text (e.g. tooltips). Numbers are capped at 2 decimals by default.
- **`legend`** — `boolean | ChartLegendOptions` — Show/configure legend