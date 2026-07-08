# Packed Circle Chart

The **Packed Circle Chart** renders each datum as a circle whose **area** encodes its value, arranged in a tight, non-overlapping cluster. It's a softer alternative to the treemap for showing many parts of a whole — proportions read at a glance without a rigid grid. Larger circles are labelled automatically.

> [!NOTE]
> For the full API, see the [Charts API Reference](/docs/api/@ripl/charts/).

## Example

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplButton @click="addItem">Add</RiplButton>
            <RiplButton @click="removeItem">Remove</RiplButton>
        </RiplControlGroup>
    </template>
    <template #config>
        <RiplChartConfig :config="config" extra-title="Packed Circle" />
    </template>
</ripl-example>

<script setup lang="ts">
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    buildCommonOptions,
    useChartConfig,
} from '../../.vitepress/compositions/use-chart-config';

import {
    createPackedCircleChart,
} from '@ripl/charts';

import {
    ref,
    watch,
} from 'vue';

const NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliet', 'Kilo', 'Lima'];

const config = useChartConfig({
    features: { title: true, animation: true },
    title: 'Team Sizes',
});

function makeData(count: number) {
    return NAMES.slice(0, count).map(name => ({
        name,
        size: Math.round(Math.random() * 90 + 10),
    }));
}

let data = makeData(8);

const { contextChanged, chart } = useRiplChart(context => {
    return createPackedCircleChart(context, {
        data,
        key: 'name',
        value: 'size',
        label: 'name',
        format: v => `${v} people`,
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        ...buildCommonOptions(config),
    });
});

function apply() {
    chart.value?.update({
        data,
        ...buildCommonOptions(config),
    });
}

watch(config, apply, { deep: true });

function randomize() {
    data = makeData(data.length);
    apply();
}

function addItem() {
    if (data.length < NAMES.length) {
        data = makeData(data.length + 1);
        apply();
    }
}

function removeItem() {
    if (data.length > 3) {
        data = makeData(data.length - 1);
        apply();
    }
}
</script>

## Usage

```ts
import {
    createPackedCircleChart,
} from '@ripl/charts';

const chart = createPackedCircleChart('#container', {
    data: [
        { name: 'Alpha', size: 82 },
        { name: 'Bravo', size: 45 },
        { name: 'Charlie', size: 26 },
    ],
    key: 'name',
    value: 'size',
    label: 'name',
});
```

## Data Format

Each item provides a unique key, a numeric value (encoded as the circle's area), and optionally a label:

```ts
const data = [
    { name: 'Alpha',
        size: 82 },
    { name: 'Bravo',
        size: 45 },
];
```

## Options

- **`data`** — The data array
- **`key`** — Unique key accessor for each circle
- **`value`** — Numeric value accessor; encoded as the circle's area
- **`label`** — Optional label accessor (defaults to `key`)
- **`color`** — Optional per-circle color accessor
- **`format`** — Value formatter for tooltips
- **`padding`**, **`title`**, **`animation`** — Standard chart options
