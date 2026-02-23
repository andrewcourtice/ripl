# Scatter Chart

A scatter chart (also known as a bubble chart when using variable sizes) displays data points on a two-dimensional plane, with optional size variation to represent a third dimension.

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div class="ripl-control-group">
            <button class="ripl-button" @click="addData">Add Data</button>
            <button class="ripl-button" @click="removeData">Remove Data</button>
            <button class="ripl-button" @click="randomise">Randomise</button>
        </div>
    </template>    
</ripl-example>

<script lang="ts" setup>
import {
    ref,
} from 'vue';

import {
    scaleContinuous,
} from '@ripl/core';

import {
    createScatterChart,
} from '@ripl/charts';

import {
    stringUniqueId,
} from '@ripl/utilities';

import {
    useRiplChart,
} from '../../.vitepress/compositions/example';

const xScale = scaleContinuous([0, 1], [0, 100]);
const yScale = scaleContinuous([0, 1], [0, 100]);
const sizeScale = scaleContinuous([0, 1], [5, 50]);

let data = Array.from({ length: 20 }, getDataItem);

const {
    chart,
    contextChanged,
} = useRiplChart(context => createScatterChart(context, {
    data,
    keyBy: 'id',
    xAxisLabel: 'X Value',
    yAxisLabel: 'Y Value',
    series: [
        {
            id: 'sales',
            labelBy: 'Sales',
            xBy: 'sales',
            yBy: 'profit',
            sizeBy: 'volume',
            minRadius: 5,
            maxRadius: 25,
        },
        {
            id: 'marketing',
            labelBy: 'Marketing',
            xBy: 'marketing',
            yBy: 'engagement',
            sizeBy: 'reach',
            minRadius: 5,
            maxRadius: 25,
        },
        {
            id: 'support',
            labelBy: 'Support',
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
    keyBy: 'id',
    xAxisLabel: 'X Value',
    yAxisLabel: 'Y Value',
    series: [
        {
            id: 'sales',
            labelBy: 'Sales',
            xBy: 'sales',
            yBy: 'profit',
            sizeBy: 'volume',
            minRadius: 5,
            maxRadius: 25,
        },
        {
            id: 'marketing',
            labelBy: 'Marketing',
            xBy: 'marketing',
            yBy: 'engagement',
            sizeBy: 'reach',
            minRadius: 5,
            maxRadius: 25,
        },
    ],
});
```
