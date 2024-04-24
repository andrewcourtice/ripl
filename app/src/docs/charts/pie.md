# Pie Chart

A pie chart is useful for illustrating numerical proportions of statistical data.

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div layout="row">
            <button class="ripl-button" @click="addData">Add Data</button>  
            <button class="ripl-button" @click="removeData">Remove Data</button>  
            <button class="ripl-button" @click="randomize">Randomize</button>  
        </div>
    </template>
</ripl-example>

<script lang="ts" setup>
import {
    ref,
} from 'vue';

import {
    Context,
    serialiseRGBA,
    clamp
} from '@ripl/core';

import {
    PieChart,
    createPieChart
} from '@ripl/charts';

import {
    stringUniqueId
} from '@ripl/utilities';

import {
    useRiplChart
} from '../../.vitepress/compositions/example';

const getColor = () => serialiseRGBA(
    clamp(Math.round(Math.random()) * 255, 80, 230),
    clamp(Math.round(Math.random()) * 255, 80, 230),
    clamp(Math.round(Math.random()) * 255, 80, 230),
    1
);

let data = Array.from([
    'Australia',
    'Poland',
    'South Africa',
    'New Zealand',
    'United States',
    'Sweden'
], label => getDataItem(label));

const {
    contextChanged,
    chart
} = useRiplChart(context => createPieChart(context, {
    key: 'id',
    value: 'value',
    color: 'color',
    label: 'label',
    data,
}));

function getDataValue() {
    return Math.round(Math.random() * 500);
}

function getDataItem(label: string = stringUniqueId()) {
    return {
        label,
        id: stringUniqueId(),
        value: getDataValue(),
        color: getColor()
    }
}

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
        value: getDataValue()
    }));

    update();
}
</script>

```typescript
const chart = createPieChart(context, {
    key: 'id',
    value: 'value',
    color: 'color',
    label: 'label',
    data: [
        {
            id: stringUniqueId(),
            label: 'Australia',
            value: 55,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'Poland',
            value: 21,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'South Africa',
            value: 185,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'New Zealand',
            value: 18,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'USA',
            value: 129,
            color: getColor()
        },
        {
            id: stringUniqueId(),
            label: 'Sweden',
            value: 15,
            color: getColor()
        },
    ]
})
```