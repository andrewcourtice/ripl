# Trend Chart

A trend chart is any combination of x/y series such as bar, line or area.

<ripl-example @context-changed="contextChanged">
    <template #footer>
        <div layout="row">
            <button class="ripl-button" @click="addData">Add Data</button>  
            <button class="ripl-button" @click="randomise">Randomise</button>
            <select class="ripl-select" v-model="lineRenderer" @change="updateRenderer">
                <option value="linear">Linear</option>
                <option value="spline">Spline</option>
                <option value="basis">Basis</option>
                <option value="bumpX">Bump X</option>
                <option value="bumpY">Bump Y</option>
                <option value="cardinal">Cardinal</option>
                <option value="catmullRom">Catmull-Rom</option>
                <option value="monotoneX">Monotone X</option>
                <option value="monotoneY">Monotone Y</option>
                <option value="natural">Natural</option>
                <option value="step">Step</option>
                <option value="stepBefore">Step Before</option>
                <option value="stepAfter">Step After</option>
            </select>
        </div>
    </template>    
</ripl-example>

<script lang="ts" setup>
import {
    ref,
} from 'vue';

import {
    scaleContinuous
} from '@ripl/core';

import {
    createTrendChart
} from '@ripl/charts';

import {
    stringUniqueId
} from '@ripl/utilities';

import {
    useRiplChart
} from '../../.vitepress/compositions/example';

const dataScale = scaleContinuous([0, 1], [-500, 1200]);
const lineRenderer = ref('linear');

let data = Array.from({ length: 15 }, getDataItem);

const {
    chart,
    contextChanged
} = useRiplChart(context => createTrendChart(context, {
    data,
    keyBy: 'id',
    labelBy: 'id',
    series: [
        {
            type: 'bar',
            id: 'australia',
            labelBy: 'Australia',
            valueBy: 'australia',
        },
        {
            type: 'bar',
            id: 'new-zealand',
            labelBy: 'New Zealand',
            valueBy: 'newZealand',
        },
        {
            type: 'bar',
            id: 'sweden',
            labelBy: 'Sweden',
            valueBy: 'sweden',
        },
        {
            type: 'bar',
            id: 'united-states',
            labelBy: 'United States',
            valueBy: 'unitedStates',
        },
        {
            type: 'line',
            id: 'great-britain',
            labelBy: 'Great Britain',
            valueBy: 'greatBritain',
            lineType: lineRenderer.value,
        }
    ]
}));

function getDataItem() {
    return {
        id: stringUniqueId(),
        australia: getValue(),
        newZealand: getValue(),
        sweden: getValue(),
        unitedStates: getValue(),
        greatBritain: getValue(),
    }
}

function getValue() {
    return Math.round(dataScale(Math.random()));
}

function addData() {
    data.push(getDataItem());
    chart.value?.update({ data });
}

function randomise() {
    data = data.map(value => ({
        ...getDataItem(),
        id: value.id
    }));

    chart.value?.update({ data });
}

function updateRenderer() {
    chart.value?.update({
        series: [
            {
                type: 'bar',
                id: 'australia',
                labelBy: 'Australia',
                valueBy: 'australia',
            },
            {
                type: 'bar',
                id: 'new-zealand',
                labelBy: 'New Zealand',
                valueBy: 'newZealand',
            },
            {
                type: 'bar',
                id: 'sweden',
                labelBy: 'Sweden',
                valueBy: 'sweden',
            },
            {
                type: 'bar',
                id: 'united-states',
                labelBy: 'United States',
                valueBy: 'unitedStates',
            },
            {
                type: 'line',
                id: 'great-britain',
                labelBy: 'Great Britain',
                valueBy: 'greatBritain',
                lineType: lineRenderer.value,
            }
        ]
    });
}
</script>

```typescript
const chart = createTrendChart(context, {
    data,
    keyBy: 'id',
    labelBy: 'id',
    series: [
        {
            type: 'bar',
            id: 'australia',
            labelBy: 'Australia',
            valueBy: 'australia',
        },
        {
            type: 'bar',
            id: 'new-zealand',
            labelBy: 'New Zealand',
            valueBy: 'newZealand',
        },
        {
            type: 'bar',
            id: 'sweden',
            labelBy: 'Sweden',
            valueBy: 'sweden',
        },
        {
            type: 'line',
            id: 'united-states',
            labelBy: 'United States',
            valueBy: 'unitedStates',
        }
    ]
});
```