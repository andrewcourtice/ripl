# Scatter Chart

A scatter chart (also known as a bubble chart when using variable sizes) displays data points on a two-dimensional plane, with optional size variation to represent a third dimension.

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <RiplControlGroup>
            <RiplButton @click="addData">Add Data</RiplButton>
            <RiplButton @click="removeData">Remove Data</RiplButton>
            <RiplButton @click="randomise">Randomise</RiplButton>
        </RiplControlGroup>
    </template>    
</ripl-example>

<script lang="ts" setup>
import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

import {
    createScatterChart,
} from '@ripl/charts';

import {
    scaleContinuous,
} from '@ripl/core';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    ref,
} from 'vue';

const xScale = scaleContinuous([0, 1], [0, 100]);
const yScale = scaleContinuous([0, 1], [0, 100]);
const sizeScale = scaleContinuous([0, 1], [5, 50]);

let data = Array.from({ length: 20 }, getDataItem);

const {
    chart,
    contextChanged,
} = useRiplChart(context => createScatterChart(context, {
    data,
    key: 'id',
    axis: {
        x: { title: 'X Value' },
        y: { title: 'Y Value' },
    },
    series: [
        {
            id: 'sales',
            label: 'Sales',
            xBy: 'sales',
            yBy: 'profit',
            sizeBy: 'volume',
            minRadius: 5,
            maxRadius: 25,
        },
        {
            id: 'marketing',
            label: 'Marketing',
            xBy: 'marketing',
            yBy: 'engagement',
            sizeBy: 'reach',
            minRadius: 5,
            maxRadius: 25,
        },
        {
            id: 'support',
            label: 'Support',
            xBy: 'support',
            yBy: 'satisfaction',
            sizeBy: 'tickets',
            minRadius: 5,
            maxRadius: 25,
        },
    ],
}));

function getDataItem() {
    return {
        id: stringUniqueId(),
        sales: getValue(xScale),
        profit: getValue(yScale),
        volume: getValue(sizeScale),
        marketing: getValue(xScale),
        engagement: getValue(yScale),
        reach: getValue(sizeScale),
        support: getValue(xScale),
        satisfaction: getValue(yScale),
        tickets: getValue(sizeScale),
    };
}

function getValue(scale: any) {
    return Math.round(scale(Math.random()) * 100) / 100;
}

function addData() {
    data.push(getDataItem());
    chart.value?.update({ data });
}

function removeData() {
    if (data.length > 1) {
        data.splice(Math.floor(Math.random() * data.length), 1);
        chart.value?.update({ data });
    }
}

function randomise() {
    data = data.map(value => ({
        ...getDataItem(),
        id: value.id,
    }));

    chart.value?.update({ data });
}
</script>

```typescript
const chart = createScatterChart(context, {
    data,
    key: 'id',
    axis: {
        x: { title: 'X Value' },
        y: { title: 'Y Value' },
    },
    series: [
        {
            id: 'sales',
            label: 'Sales',
            xBy: 'sales',
            yBy: 'profit',
            sizeBy: 'volume',
            minRadius: 5,
            maxRadius: 25,
        },
        {
            id: 'marketing',
            label: 'Marketing',
            xBy: 'marketing',
            yBy: 'engagement',
            sizeBy: 'reach',
            minRadius: 5,
            maxRadius: 25,
        },
    ],
});
```
