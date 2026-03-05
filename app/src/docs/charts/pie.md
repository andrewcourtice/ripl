# Pie Chart

A pie chart is useful for illustrating numerical proportions of statistical data.

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="removeData">Remove Data</RiplButton>
            <RiplButton @click="randomize">Randomize</RiplButton>
            <RiplSwitch v-model="donut" @update:model-value="toggleDonut" label="Donut" />
        </RiplControlGroup>
    </template>
</ripl-example>

<script lang="ts" setup>
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    createPieChart,
} from '@ripl/charts';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    ref,
} from 'vue';

const COUNTRIES = [
    'Australia', 'Poland', 'South Africa', 'New Zealand',
    'United States', 'Sweden', 'Great Britain', 'Brazil',
    'France', 'Switzerland',
];

const donut = ref(false);

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

const {
    contextChanged,
    chart,
} = useRiplChart(context => createPieChart(context, {
    key: 'id',
    value: 'value',
    label: 'label',
    data,
}));

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

function toggleDonut() {
    chart.value?.update({ innerRadius: donut.value ? 0.25 : 0 });
}
</script>

```typescript
const chart = createPieChart(context, {
    key: 'id',
    value: 'value',
    label: 'label',
    data: [
        { id: '1',
            label: 'Australia',
            value: 55 },
        { id: '2',
            label: 'Poland',
            value: 21 },
        { id: '3',
            label: 'South Africa',
            value: 185 },
        { id: '4',
            label: 'New Zealand',
            value: 18 },
        { id: '5',
            label: 'USA',
            value: 129 },
        { id: '6',
            label: 'Sweden',
            value: 15 },
    ],
});
```