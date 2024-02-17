# Trend Chart

A trend chart is any combination of x/y series such as bar, line or area.

<ripl-example @context-changed="contextChanged"></ripl-example>

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

import useRiplChart from '../../.vitepress/compositions/example';

const dataScale = scaleContinuous([0, 1], [-500, 1200]);

let data = Array.from({ length: 10 }, getDataItem);

function getDataItem() {
    return {
        id: stringUniqueId(),
        australia: getValue(),
        newZealand: getValue(),
        sweden: getValue(),
        unitedStates: getValue()
    }
}

function getValue() {
    return Math.round(dataScale(Math.random()));
}

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
            type: 'line',
            id: 'united-states',
            labelBy: 'United States',
            valueBy: 'unitedStates',
        }
    ]
}));
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